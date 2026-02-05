import { PackageEntry } from './types';

export function parseLockfile(content: string): PackageEntry[] {
  try {
    const lockfile = JSON.parse(content);
    const entries: PackageEntry[] = [];

    // Handle both lockfileVersion 1 and 2+ formats
    if (lockfile.packages) {
      // v2+ format
      for (const [path, pkg] of Object.entries<any>(lockfile.packages)) {
        if (path === '') continue; // Skip root package
        
        // Extract package name from path (handle nested node_modules)
        const pathParts = path.split('node_modules/').filter(Boolean);
        const name = pkg.name || pathParts[pathParts.length - 1];
        
        entries.push({
          name,
          version: pkg.version,
          resolved: pkg.resolved,
          integrity: pkg.integrity
        });
      }
    } else if (lockfile.dependencies) {
      // v1 format
      extractDependencies(lockfile.dependencies, entries);
    }

    return entries;
  } catch (error) {
    throw new Error('Invalid lockfile format');
  }
}

function extractDependencies(deps: any, entries: PackageEntry[]): void {
  for (const [name, pkg] of Object.entries<any>(deps)) {
    entries.push({
      name,
      version: pkg.version,
      resolved: pkg.resolved,
      integrity: pkg.integrity
    });

    if (pkg.dependencies) {
      extractDependencies(pkg.dependencies, entries);
    }
  }
}
