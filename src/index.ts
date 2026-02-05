import { readFileSync } from 'fs';
import { parseLockfile } from './parser';
import { checkLockfile } from './checker';
import { CheckOptions, CheckResult } from './types';

export { CheckOptions, CheckResult, Issue, IssueType } from './types';

export function checkLockfileFromPath(
  path: string,
  options: CheckOptions = {}
): CheckResult {
  const content = readFileSync(path, 'utf-8');
  return checkLockfileFromContent(content, options);
}

export function checkLockfileFromContent(
  content: string,
  options: CheckOptions = {}
): CheckResult {
  try {
    const entries = parseLockfile(content);
    return checkLockfile(entries, options);
  } catch (error) {
    return {
      passed: false,
      warnings: [],
      errors: [{
        type: 'invalid-format',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
}
