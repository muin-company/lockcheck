# lockcheck

[![npm version](https://img.shields.io/npm/v/lockcheck.svg)](https://www.npmjs.com/package/lockcheck)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Verify lockfile integrity. Detect suspicious registries, duplicate versions, missing hashes.

## Why?

Supply chain attacks are real. Lockfiles can contain packages from unexpected registries, missing integrity hashes, or other red flags that automated CI should catch before they hit production.

lockcheck does one thing well: scan your package-lock.json and warn you about potential security issues.

## Installation

```bash
npm install -g lockcheck
```

Or run without installing:

```bash
npx lockcheck
```

## Usage

```bash
# Check current directory
lockcheck

# Check specific file
lockcheck ./path/to/package-lock.json

# Get JSON output
lockcheck --json

# Treat warnings as errors (for CI)
lockcheck --strict
```

## What it checks

- **Suspicious registries** - Packages not from registry.npmjs.org or registry.yarnpkg.com
- **Missing integrity hashes** - Packages without SHA verification
- **Duplicate versions** - Same package with multiple versions (bloats node_modules)

## Examples

### Before

```bash
$ lockcheck
⚠️  Warnings:

  - Package evil-package@1.0.0 uses non-standard registry
    URL: https://malicious-registry.com/evil-package/-/evil-package-1.0.0.tgz
  - Package lodash has 2 different versions: 4.17.20, 4.17.21
```

### After (fixing the issues)

```bash
$ lockcheck
✅ Lockfile looks good!
```

## CI Integration

Add to your GitHub Actions workflow:

```yaml
- name: Check lockfile integrity
  run: npx lockcheck --strict
```

Exit code is 0 if passed, 1 if errors found. Perfect for blocking bad merges.

## API

Use programmatically:

```typescript
import { checkLockfileFromPath } from 'lockcheck';

const result = checkLockfileFromPath('./package-lock.json', {
  strict: true,
  allowedRegistries: ['https://registry.npmjs.org']
});

if (!result.passed) {
  console.error('Issues found:', result.errors);
}
```

## Options

- `--json` - Output results as JSON
- `--strict` - Treat warnings as errors (fails with exit code 1)
- `--help` - Show help

## Contributing

PRs welcome. Keep it simple.

1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Run `npm test`
5. Submit PR

## License

MIT
