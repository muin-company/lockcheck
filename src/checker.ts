import * as fs from 'fs';
import * as path from 'path';
import { PackageEntry, CheckResult, Issue, CheckOptions } from './types';

const DEFAULT_ALLOWED_REGISTRIES = [
  'https://registry.npmjs.org',
  'https://registry.yarnpkg.com'
];

export function checkLockfile(
  entries: PackageEntry[],
  options: CheckOptions = {}
): CheckResult {
  const warnings: Issue[] = [];
  const errors: Issue[] = [];
  const allowedRegistries = options.allowedRegistries || DEFAULT_ALLOWED_REGISTRIES;

  // Check for suspicious registries
  for (const entry of entries) {
    if (entry.resolved) {
      const isSuspicious = !allowedRegistries.some(registry =>
        entry.resolved!.startsWith(registry)
      );

      if (isSuspicious) {
        const issue: Issue = {
          type: 'suspicious-registry',
          message: `Package ${entry.name}@${entry.version} uses non-standard registry`,
          package: entry.name,
          version: entry.version,
          url: entry.resolved
        };
        warnings.push(issue);
      }
    }
  }

  // Check for missing integrity hashes
  for (const entry of entries) {
    if (entry.resolved && !entry.integrity) {
      const issue: Issue = {
        type: 'missing-integrity',
        message: `Package ${entry.name}@${entry.version} missing integrity hash`,
        package: entry.name,
        version: entry.version
      };
      warnings.push(issue);
    }
  }

  // Check for duplicate versions
  const versionMap = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!versionMap.has(entry.name)) {
      versionMap.set(entry.name, new Set());
    }
    versionMap.get(entry.name)!.add(entry.version);
  }

  for (const [name, versions] of versionMap.entries()) {
    if (versions.size > 1) {
      const issue: Issue = {
        type: 'duplicate-version',
        message: `Package ${name} has ${versions.size} different versions: ${Array.from(versions).join(', ')}`,
        package: name
      };
      warnings.push(issue);
    }
  }

  // Check for drift between package.json and lockfile
  if (options.driftCheck && options.packageJsonPath) {
    const driftIssues = checkDrift(entries, options.packageJsonPath);
    warnings.push(...driftIssues);
  }

  // In strict mode, treat warnings as errors
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Check for drift between package.json and lockfile
 */
function checkDrift(entries: PackageEntry[], packageJsonPath: string): Issue[] {
  const issues: Issue[] = [];

  try {
    // Read package.json
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Get all dependencies from package.json
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Build map of lockfile versions (use top-level packages)
    const lockfileMap = new Map<string, string>();
    for (const entry of entries) {
      // Only consider top-level dependencies (not nested)
      if (!entry.name.includes('node_modules')) {
        lockfileMap.set(entry.name, entry.version);
      }
    }

    // Check for version mismatches
    for (const [pkgName, versionRange] of Object.entries(allDeps)) {
      if (typeof versionRange !== 'string') continue;

      const lockfileVersion = lockfileMap.get(pkgName);

      if (!lockfileVersion) {
        // Package in package.json but not in lockfile
        issues.push({
          type: 'missing-in-lockfile',
          message: `Package ${pkgName} is in package.json but missing from lockfile`,
          package: pkgName,
          version: versionRange,
        });
      } else if (!satisfiesRange(lockfileVersion, versionRange)) {
        // Version in lockfile doesn't satisfy package.json range
        issues.push({
          type: 'version-mismatch',
          message: `Package ${pkgName}: lockfile has ${lockfileVersion} but package.json specifies ${versionRange}`,
          package: pkgName,
          version: lockfileVersion,
        });
      }
    }

    // Check for extra packages in lockfile (optional - can be noisy)
    // for (const [pkgName, version] of lockfileMap.entries()) {
    //   if (!allDeps[pkgName]) {
    //     issues.push({
    //       type: 'extra-in-lockfile',
    //       message: `Package ${pkgName}@${version} is in lockfile but not in package.json`,
    //       package: pkgName,
    //       version,
    //     });
    //   }
    // }

  } catch (error) {
    // If we can't read package.json, skip drift check
    if (error instanceof Error) {
      issues.push({
        type: 'invalid-format',
        message: `Failed to read package.json: ${error.message}`,
      });
    }
  }

  return issues;
}

/**
 * Check if a version satisfies a semver range (simplified)
 * For production, use 'semver' package. This is a basic check.
 */
function satisfiesRange(version: string, range: string): boolean {
  // Remove 'v' prefix if present
  version = version.replace(/^v/, '');
  range = range.replace(/^v/, '');

  // Exact match
  if (version === range) return true;

  // Range starts with exact version (e.g., "1.2.3")
  if (range === version) return true;

  // Caret range (^1.2.3 allows 1.x.x where x >= 2.3)
  if (range.startsWith('^')) {
    const rangeVersion = range.slice(1);
    const [rangeMajor] = rangeVersion.split('.');
    const [versionMajor] = version.split('.');
    if (rangeMajor === versionMajor) {
      // Simple check: major version matches
      return version >= rangeVersion;
    }
    return false;
  }

  // Tilde range (~1.2.3 allows 1.2.x where x >= 3)
  if (range.startsWith('~')) {
    const rangeVersion = range.slice(1);
    const [rangeMajor, rangeMinor] = rangeVersion.split('.');
    const [versionMajor, versionMinor] = version.split('.');
    if (rangeMajor === versionMajor && rangeMinor === versionMinor) {
      return version >= rangeVersion;
    }
    return false;
  }

  // Greater than or equal (>=1.2.3)
  if (range.startsWith('>=')) {
    return version >= range.slice(2);
  }

  // Any version (*, x)
  if (range === '*' || range === 'x' || range === 'latest') {
    return true;
  }

  // For complex ranges, assume it's ok (avoid false positives)
  // In production, use 'semver' package
  return true;
}
