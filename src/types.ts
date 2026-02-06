export interface CheckResult {
  passed: boolean;
  warnings: Issue[];
  errors: Issue[];
}

export interface Issue {
  type: IssueType;
  message: string;
  package?: string;
  version?: string;
  url?: string;
}

export type IssueType =
  | 'suspicious-registry'
  | 'duplicate-version'
  | 'missing-integrity'
  | 'invalid-format'
  | 'version-mismatch'
  | 'missing-in-lockfile'
  | 'extra-in-lockfile';

export interface PackageEntry {
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
}

export interface CheckOptions {
  strict?: boolean;
  allowedRegistries?: string[];
  driftCheck?: boolean;
  packageJsonPath?: string;
}
