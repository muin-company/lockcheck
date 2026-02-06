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

## Real-World Examples

### 1. CI/CD Security Gate

**GitHub Actions:**

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'package-lock.json'
      - 'yarn.lock'

jobs:
  lockfile-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify lockfile integrity
        run: npx lockcheck --strict
      
      - name: Block merge on suspicious packages
        if: failure()
        run: |
          echo "❌ Lockfile contains security issues"
          echo "Review registry sources and missing hashes"
          exit 1
```

**GitLab CI:**

```yaml
# .gitlab-ci.yml
lockfile-audit:
  stage: security
  script:
    - npx lockcheck --strict
  only:
    changes:
      - package-lock.json
  allow_failure: false
```

### 2. Pre-commit Hook

Catch lockfile issues before they're committed:

```bash
#!/bin/bash
# .git/hooks/pre-commit

if git diff --cached --name-only | grep -q "package-lock.json"; then
  echo "🔍 Checking lockfile integrity..."
  npx lockcheck --strict
  
  if [ $? -ne 0 ]; then
    echo "❌ Lockfile has issues. Fix before committing."
    exit 1
  fi
  
  echo "✅ Lockfile is clean"
fi
```

With husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lockcheck --strict"
    }
  }
}
```

### 3. Monorepo Scanning

Check all lockfiles in a monorepo:

```bash
# Find and check all lockfiles
find . -name "package-lock.json" -not -path "*/node_modules/*" | while read lockfile; do
  echo "Checking $lockfile"
  lockcheck "$lockfile" --strict
done

# Or with parallel processing
find . -name "package-lock.json" -not -path "*/node_modules/*" | \
  parallel lockcheck {} --strict
```

### 4. Custom Registry Whitelist

For organizations using private registries:

```bash
# Allow specific registries (feature request - example config)
# lockcheck.config.json
{
  "allowedRegistries": [
    "https://registry.npmjs.org",
    "https://npm.internal.company.com",
    "https://artifacts.company.io"
  ],
  "strict": true
}

# Then run
lockcheck --config lockcheck.config.json
```

### 5. Automated Dependency Updates

Combine with Dependabot or Renovate:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "security-team"
    # After Dependabot creates PR, lockcheck runs automatically
```

GitHub Action to verify Dependabot PRs:

```yaml
name: Verify Dependency Updates

on:
  pull_request:
    branches: [main]

jobs:
  check-deps:
    if: github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify lockfile
        run: npx lockcheck --strict
      
      - name: Auto-merge if safe
        if: success()
        run: gh pr merge --auto --squash ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 6. JSON Output for Reporting

Generate security reports:

```bash
# Generate JSON report
lockcheck --json > lockfile-report.json

# Parse with jq
lockcheck --json | jq '.errors'

# Count issues
lockcheck --json | jq '.errors | length'

# Alert if issues found
lockcheck --json | jq -e '.passed == false' && \
  curl -X POST https://alerts.company.com/webhook \
  -d "Lockfile security issues detected"
```

### 7. Periodic Security Audits

Weekly lockfile health checks:

```bash
# crontab
0 9 * * 1 cd /path/to/project && lockcheck --json > reports/lockcheck-$(date +\%Y\%m\%d).json

# GitHub Actions scheduled scan
# .github/workflows/weekly-audit.yml
name: Weekly Security Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run lockfile check
        run: lockcheck --json > lockcheck-report.json
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: lockfile-audit
          path: lockcheck-report.json
      
      - name: Notify on Slack if issues
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
          -d '{"text":"⚠️ Weekly lockfile audit found issues"}'
```

### 8. Emergency Response

When a supply chain attack is detected:

```bash
# Quick scan across all projects
for repo in ~/projects/*/; do
  if [ -f "$repo/package-lock.json" ]; then
    echo "Scanning $repo"
    lockcheck "$repo/package-lock.json" --strict || echo "⚠️  Issue in $repo"
  fi
done

# Generate org-wide report
for repo in ~/projects/*/; do
  if [ -f "$repo/package-lock.json" ]; then
    echo "$repo" >> org-report.txt
    lockcheck "$repo/package-lock.json" --json >> org-report.txt
  fi
done
```

## Contributing

PRs welcome. Keep it simple.

1. Fork the repo
2. Create a feature branch
3. Add tests for new features
4. Run `npm test`
5. Submit PR

## License

MIT
