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
