#!/usr/bin/env node

import { resolve } from 'path';
import { existsSync } from 'fs';
import { checkLockfileFromPath } from './index';

function printHelp() {
  console.log(`
lockcheck - Verify lockfile integrity

Usage:
  lockcheck [path]                    Check lockfile (default: ./package-lock.json)
  lockcheck --json [path]             Output as JSON
  lockcheck --strict [path]           Treat warnings as errors
  lockcheck --help                    Show this help

Options:
  --json      Output results as JSON
  --strict    Fail on warnings
  --help      Show help

Examples:
  lockcheck
  lockcheck ./my-project/package-lock.json
  lockcheck --strict --json
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const strict = args.includes('--strict');
  
  const pathArg = args.find(arg => !arg.startsWith('--'));
  const lockfilePath = resolve(pathArg || './package-lock.json');

  if (!existsSync(lockfilePath)) {
    console.error(`Error: Lockfile not found at ${lockfilePath}`);
    process.exit(1);
  }

  const result = checkLockfileFromPath(lockfilePath, { strict });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.errors.length > 0) {
      console.error('\n❌ Errors found:\n');
      for (const error of result.errors) {
        console.error(`  - ${error.message}`);
        if (error.url) console.error(`    URL: ${error.url}`);
      }
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:\n');
      for (const warning of result.warnings) {
        console.warn(`  - ${warning.message}`);
        if (warning.url) console.warn(`    URL: ${warning.url}`);
      }
    }

    if (result.passed && result.warnings.length === 0) {
      console.log('✅ Lockfile looks good!');
    }
  }

  process.exit(result.passed ? 0 : 1);
}

main();
