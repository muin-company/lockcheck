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

# Check for drift (package.json vs lockfile mismatch) - NEW!
lockcheck --drift
```

## What it checks

- **Suspicious registries** - Packages not from registry.npmjs.org or registry.yarnpkg.com
- **Missing integrity hashes** - Packages without SHA verification
- **Duplicate versions** - Same package with multiple versions (bloats node_modules)
- **Version drift** (NEW with `--drift`) - Mismatches between package.json and lockfile versions

## Examples

### Example 1: Clean Project - All Good ✅

**Scenario:** Well-maintained project with standard dependencies.

```bash
$ cd my-clean-project
$ lockcheck

🔍 Scanning package-lock.json...

✅ Lockfile looks good!

📊 Summary:
  - Total packages: 342
  - Registries: 1 (registry.npmjs.org)
  - All integrity hashes present: ✓
  - No duplicate versions found: ✓

Exit code: 0
```

**Result:** Safe to deploy!

---

### Example 2: Suspicious Registry Detected 🚨

**Scenario:** A compromised dependency or typosquatting attempt.

```bash
$ lockcheck

🔍 Scanning package-lock.json...

⚠️  SECURITY WARNINGS:

🚨 Suspicious Registry:
  - evil-package@1.0.0
    Expected: https://registry.npmjs.org
    Found:    https://malicious-registry.com/evil-package/-/evil-package-1.0.0.tgz

    ⚠️  This package is NOT from the official npm registry!
    Risk: Supply chain attack, malware injection

🔍 Recommended Action:
  1. Check if this is a private/corporate registry (expected behavior)
  2. If not, REMOVE this package immediately
  3. Run `npm audit` and scan for malware
  4. Notify your security team

Exit code: 1
```

**Action:** Investigate and remove the suspicious package.

---

### Example 3: Missing Integrity Hashes

**Scenario:** Old lockfile or manually edited file missing SHA checksums.

```bash
$ lockcheck

🔍 Scanning package-lock.json...

⚠️  MISSING INTEGRITY HASHES:

❌ lodash@4.17.21 - No integrity hash found
❌ express@4.18.0 - No integrity hash found
❌ axios@1.3.0 - No integrity hash found

📊 Summary:
  - Total packages: 89
  - Missing integrity: 3

⚠️  Without integrity hashes, npm cannot verify package contents!
    This allows for man-in-the-middle attacks or corrupted packages.

🔧 Fix:
  rm -rf node_modules package-lock.json
  npm install

Exit code: 1
```

---

### Example 4: Duplicate Versions Bloating node_modules

**Scenario:** Different versions of the same package installed, wasting space.

```bash
$ lockcheck

🔍 Scanning package-lock.json...

⚠️  DUPLICATE VERSIONS:

📦 lodash found in 3 different versions:
  - 4.17.20 (used by: webpack, babel-core)
  - 4.17.21 (used by: express, mocha)
  - 3.10.1 (used by: legacy-lib)

📦 moment found in 2 different versions:
  - 2.29.1 (used by: react-datepicker)
  - 2.30.0 (used by: chart.js)

📊 Impact:
  - Extra disk space: ~450 KB
  - Potential bugs from version mismatch

💡 Fix:
  npm dedupe  # Attempts to flatten dependency tree
  # Or update dependencies to use consistent versions

Exit code: 0 (warning only)
```

---

### Example 5: Version Drift Detection (NEW!)

**Scenario:** Detect when package.json and lockfile versions don't match.

```bash
$ lockcheck --drift

🔍 Scanning package-lock.json...
🔍 Comparing with package.json...

⚠️  VERSION DRIFT DETECTED:

📦 react: 
   package.json: ^18.2.0
   lockfile:     17.0.2
   ❌ Lockfile version doesn't satisfy package.json range!

📦 axios:
   package.json: ^1.4.0
   lockfile:     1.3.0
   ❌ Lockfile version is outdated!

📦 typescript:
   ❌ Listed in package.json but missing from lockfile!

📊 Drift Summary:
  - Version mismatches: 2
  - Missing in lockfile: 1
  - Total drift issues: 3

💡 Recommended Fix:
  rm -rf node_modules package-lock.json
  npm install

This ensures your lockfile is regenerated from package.json.

Exit code: 1 (warnings found)
```

**Why drift happens:**
- Manual edits to package.json without running `npm install`
- Switching branches without updating dependencies
- Corrupted or stale lockfile
- Dependencies added/removed but not committed

**When to use --drift:**
- Before deploying to catch stale lockfiles
- In CI to enforce consistency
- After merging branches with dependency changes
- When debugging "works on my machine" issues

---

### Example 6: CI Enforcement with --strict Mode

**Scenario:** Block any lockfile issues in your CI pipeline.

```bash
$ lockcheck --strict

🔍 Scanning package-lock.json...

⚠️  Warnings found (treated as errors in --strict mode):

  - Package lodash has 2 different versions: 4.17.20, 4.17.21
  - Package moment has 2 different versions: 2.29.1, 2.30.0

❌ FAILED: 2 warnings in --strict mode

Exit code: 1  ← Build fails
```

**GitHub Actions Example:**

```yaml
- name: Check lockfile
  run: npx lockcheck --strict
```

**Result:** PR is blocked until duplicates are resolved.

---

### Example 6: JSON Output for Automation

**Scenario:** Integrate lockcheck results into your security dashboard.

```bash
$ lockcheck --json > lockfile-report.json
```

**Output (`lockfile-report.json`):**

```json
{
  "passed": false,
  "errors": [
    {
      "type": "suspicious_registry",
      "package": "evil-package",
      "version": "1.0.0",
      "registry": "https://malicious-registry.com",
      "expected": "https://registry.npmjs.org"
    }
  ],
  "warnings": [
    {
      "type": "duplicate_version",
      "package": "lodash",
      "versions": ["4.17.20", "4.17.21"]
    }
  ],
  "summary": {
    "totalPackages": 342,
    "registries": [
      "https://registry.npmjs.org",
      "https://malicious-registry.com"
    ],
    "missingIntegrity": 0,
    "duplicates": 1
  }
}
```

**Use case:** Parse JSON, send alerts to Slack/PagerDuty if `passed: false`.

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

## Integration Guides

### GitHub Actions (Detailed)

```yaml
# .github/workflows/lockfile-security.yml
name: Lockfile Security Check

on:
  push:
    branches: [main, develop]
  pull_request:
    paths:
      - 'package-lock.json'
      - 'yarn.lock'
      - 'pnpm-lock.yaml'

jobs:
  lockcheck:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run lockcheck (standard)
        run: npx lockcheck
        continue-on-error: true
        id: lockcheck-standard
      
      - name: Run lockcheck (strict mode)
        run: npx lockcheck --strict
        id: lockcheck-strict
      
      - name: Check for version drift
        run: npx lockcheck --drift
        id: lockcheck-drift
      
      - name: Generate JSON report
        if: always()
        run: npx lockcheck --json > lockcheck-report.json
      
      - name: Upload report artifact
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: lockcheck-report
          path: lockcheck-report.json
      
      - name: Comment on PR with results
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('lockcheck-report.json', 'utf8'));
            
            let comment = '## 🔒 Lockfile Security Report\n\n';
            
            if (report.errors.length > 0) {
              comment += '### ❌ Errors Found\n\n';
              report.errors.forEach(err => {
                comment += `- **${err.type}**: ${err.package}@${err.version}\n`;
                if (err.registry) comment += `  - Registry: \`${err.registry}\`\n`;
              });
            }
            
            if (report.warnings.length > 0) {
              comment += '\n### ⚠️  Warnings\n\n';
              report.warnings.forEach(warn => {
                comment += `- ${warn.type}: ${warn.package}\n`;
              });
            }
            
            comment += `\n### 📊 Summary\n`;
            comment += `- Total packages: ${report.summary.totalPackages}\n`;
            comment += `- Registries: ${report.summary.registries.length}\n`;
            comment += `- Missing integrity: ${report.summary.missingIntegrity}\n`;
            comment += `- Duplicates: ${report.summary.duplicates}\n`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### GitLab CI (Advanced)

```yaml
# .gitlab-ci.yml
stages:
  - security
  - report

lockfile-security:
  stage: security
  image: node:18-alpine
  script:
    - npm install -g lockcheck
    - lockcheck --json > lockcheck-report.json
    - |
      if ! lockcheck --strict; then
        echo "❌ Lockfile security check failed"
        exit 1
      fi
  artifacts:
    reports:
      junit: lockcheck-report.json
    when: always
    expire_in: 30 days
  only:
    changes:
      - package-lock.json
      - yarn.lock
  allow_failure: false

security-report:
  stage: report
  script:
    - |
      cat lockcheck-report.json | \
      jq -r '"Security issues: \(.errors | length)"'
  dependencies:
    - lockfile-security
```

### Pre-commit Hook with Husky

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lockcheck"
```

**package.json:**

```json
{
  "scripts": {
    "lockcheck": "lockcheck --strict --drift",
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lockcheck": "^1.0.0"
  }
}
```

**Advanced pre-commit with selective checking:**

```bash
#!/bin/sh
# .husky/pre-commit

# Only check if package-lock.json is staged
if git diff --cached --name-only | grep -q "package-lock.json"; then
  echo "🔍 Lockfile changed, running security check..."
  
  # Run standard check
  npx lockcheck || {
    echo "❌ Lockfile check failed"
    exit 1
  }
  
  # Check for drift
  npx lockcheck --drift || {
    echo "⚠️  Version drift detected"
    read -p "Continue anyway? (y/N): " response
    if [ "$response" != "y" ]; then
      exit 1
    fi
  }
  
  echo "✅ Lockfile is secure"
fi
```

### package.json Scripts

```json
{
  "scripts": {
    "check": "npm run check:lockfile",
    "check:lockfile": "lockcheck",
    "check:lockfile:strict": "lockcheck --strict",
    "check:lockfile:drift": "lockcheck --drift",
    "check:lockfile:all": "lockcheck --strict --drift",
    "preinstall": "lockcheck --drift || echo '⚠️  Lockfile drift detected'",
    "postinstall": "lockcheck",
    "precommit": "lockcheck --strict",
    "ci:security": "lockcheck --strict --json > reports/lockcheck.json"
  }
}
```

### Monorepo Setup (Lerna/Nx/Turborepo)

```bash
# Check all packages
for pkg in packages/*; do
  if [ -f "$pkg/package-lock.json" ]; then
    echo "Checking $pkg"
    lockcheck "$pkg/package-lock.json" --strict || exit 1
  fi
done
```

**With Turborepo:**

```json
// turbo.json
{
  "pipeline": {
    "check:lockfile": {
      "cache": false,
      "dependsOn": []
    }
  }
}
```

```json
// package.json (root)
{
  "scripts": {
    "check:lockfile": "turbo run check:lockfile"
  }
}
```

```json
// packages/app-a/package.json
{
  "scripts": {
    "check:lockfile": "lockcheck"
  }
}
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy lockfile first
COPY package-lock.json .

# Verify lockfile before installing
RUN npm install -g lockcheck && \
    lockcheck package-lock.json --strict && \
    echo "✅ Lockfile verified"

# Now safe to install dependencies
COPY package.json .
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
  agent any
  
  stages {
    stage('Security: Lockfile Check') {
      steps {
        script {
          def lockcheckResult = sh(
            script: 'npx lockcheck --json',
            returnStdout: true
          )
          
          def report = readJSON text: lockcheckResult
          
          if (!report.passed) {
            error("Lockfile security check failed: ${report.errors.size()} errors")
          }
          
          // Archive report
          writeFile file: 'lockcheck-report.json', text: lockcheckResult
          archiveArtifacts artifacts: 'lockcheck-report.json'
        }
      }
    }
  }
  
  post {
    failure {
      emailext(
        subject: "Lockfile Security Alert: ${env.JOB_NAME}",
        body: "Lockfile check failed. See attached report.",
        attachmentsPattern: 'lockcheck-report.json',
        to: 'security-team@company.com'
      )
    }
  }
}
```

## Troubleshooting

### Problem: False Positive on Private Registry

**Symptom:**
```bash
⚠️  Suspicious Registry:
  - @mycompany/private-pkg@1.0.0
    Found: https://npm.internal.company.com
```

**Solution:**
Private/corporate registries are expected. Currently, lockcheck flags all non-npmjs.org registries. You can:

1. **Review manually** - Verify the registry is your company's
2. **Suppress in CI** - Use `|| true` for private packages:
   ```bash
   lockcheck || [ $? -eq 1 ] && echo "Private registry detected, OK"
   ```
3. **Feature request** - Configuration file support coming soon:
   ```json
   {
     "allowedRegistries": [
       "https://registry.npmjs.org",
       "https://npm.internal.company.com"
     ]
   }
   ```

### Problem: Missing Integrity Hashes After Manual Edit

**Symptom:**
```bash
❌ lodash@4.17.21 - No integrity hash found
```

**Cause:** Manually editing `package-lock.json` removes integrity hashes.

**Solution:**
```bash
# Delete and regenerate lockfile
rm -rf node_modules package-lock.json
npm install

# Verify integrity restored
lockcheck
```

**Prevention:** Never manually edit lockfiles. Use `npm install <package>` instead.

### Problem: Drift Detection Shows False Positives

**Symptom:**
```bash
📦 react: 
   package.json: ^18.2.0
   lockfile:     18.2.5
   ❌ Lockfile version doesn't satisfy package.json range!
```

**Cause:** This is actually correct! `18.2.5` satisfies `^18.2.0`, but the message is confusing.

**Workaround:** Check semver ranges manually:
```bash
npm semver 18.2.5 --range "^18.2.0"  # Returns 18.2.5 if matches
```

**Fix coming:** Improve drift detection to respect semver ranges.

### Problem: Too Many Duplicate Version Warnings

**Symptom:**
```bash
⚠️  DUPLICATE VERSIONS:
📦 lodash found in 47 different versions
```

**Solution:**
```bash
# Deduplicate dependencies
npm dedupe

# Or update to latest compatible versions
npm update

# Force specific version (caution!)
npm install lodash@latest --save

# In package.json, use exact versions
{
  "dependencies": {
    "lodash": "4.17.21"  // No ^ or ~
  },
  "resolutions": {       // For Yarn
    "lodash": "4.17.21"
  },
  "overrides": {         // For npm 8.3+
    "lodash": "4.17.21"
  }
}
```

### Problem: lockcheck Hangs on Large Monorepo

**Symptom:** `lockcheck` runs for minutes without output.

**Cause:** Large lockfiles (100K+ packages) take time to parse.

**Solution:**
```bash
# Run with timeout
timeout 60s lockcheck || echo "Timeout, skipping"

# Or check only changed packages (CI)
git diff --name-only origin/main | grep "package-lock.json" | \
  xargs -I {} lockcheck {}
```

### Problem: Exit Code 0 Despite Warnings

**Symptom:** CI passes even though lockcheck shows warnings.

**Cause:** Warnings don't fail by default (only errors do).

**Solution:** Use `--strict` mode:
```bash
lockcheck --strict  # Treats warnings as errors
```

### Problem: "ENOENT: no such file" Error

**Symptom:**
```bash
Error: ENOENT: no such file or directory, open 'package-lock.json'
```

**Cause:** Lockfile doesn't exist or wrong path.

**Solution:**
```bash
# Check if lockfile exists
ls -la package-lock.json

# Specify path explicitly
lockcheck ./path/to/package-lock.json

# Generate lockfile if missing
npm install
```

### Problem: JSON Output is Malformed

**Symptom:** `lockcheck --json` returns partial JSON or crashes.

**Cause:** Bug in JSON serialization or corrupted lockfile.

**Solution:**
```bash
# Validate lockfile first
npm install --package-lock-only

# Try again
lockcheck --json | jq .  # jq will show JSON errors
```

### Problem: Drift Check Fails After Fresh Install

**Symptom:**
```bash
$ rm -rf node_modules package-lock.json
$ npm install
$ lockcheck --drift
❌ Version drift detected
```

**Cause:** `package.json` has outdated ranges that npm resolved differently.

**Solution:**
```bash
# Update package.json to match lockfile
npm install --save <package>@<locked-version>

# Or update lockfile to latest
rm package-lock.json
npm install
```

## Best Practices

### 1. Run lockcheck in Multiple Stages

```yaml
# Don't just check once - layer your security
stages:
  - pre-commit: Basic check (fast feedback)
  - PR: Strict check (block merge)
  - nightly: Full audit (catch issues over time)
```

```json
{
  "scripts": {
    "precommit": "lockcheck",
    "ci:pr": "lockcheck --strict --drift",
    "ci:nightly": "lockcheck --strict --json > nightly-report.json"
  }
}
```

### 2. Combine with Other Security Tools

```bash
# Layered security approach
npm audit                      # Check for known vulnerabilities
lockcheck --strict             # Verify lockfile integrity
npx license-checker --summary  # Check licenses
```

**Full security pipeline:**

```yaml
security-pipeline:
  - npm audit --audit-level=high
  - lockcheck --strict
  - npx snyk test               # Snyk vulnerability scanning
  - npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause'
```

### 3. Version Pin Critical Dependencies

```json
{
  "dependencies": {
    "express": "4.18.2",      // No ^ or ~ for critical deps
    "jsonwebtoken": "9.0.0"   // Exact versions prevent drift
  },
  "devDependencies": {
    "eslint": "^8.0.0"        // Dev tools can be flexible
  }
}
```

### 4. Automate Lockfile Updates

```yaml
# Renovate config (.github/renovate.json)
{
  "extends": ["config:base"],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 5am on monday"]
  },
  "postUpgradeTasks": {
    "commands": [
      "npm run lockcheck"
    ]
  }
}
```

### 5. Document Exceptions

```bash
# If you must use a non-standard registry, document it
# .lockcheck-exceptions
# This file explains why certain registries are allowed:
# 
# - https://npm.internal.company.com
#   Our private npm registry for @mycompany/* packages
#
# - https://artifacts.company.io
#   Legacy artifacts server (migrating to npm.internal.company.com)
```

### 6. Monitor Drift Over Time

```bash
# Track drift trends
echo "$(date),$(lockcheck --drift --json | jq '.driftCount')" >> drift-log.csv

# Alert if drift increases
current_drift=$(lockcheck --drift --json | jq '.driftCount')
if [ "$current_drift" -gt 10 ]; then
  echo "⚠️  High drift: $current_drift mismatches"
  # Send alert
fi
```

### 7. Use Lock Files Everywhere

```bash
# Even for simple scripts
{
  "name": "simple-script",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "dependencies": {
    "axios": "^1.4.0"
  }
}
```

**Why?** Ensures reproducible builds even for one-off scripts.

### 8. Test Lockfile Changes in Isolation

```bash
# Before merging a PR with lockfile changes:

# 1. Check out the PR branch
git checkout feature/update-deps

# 2. Fresh install
rm -rf node_modules
npm ci

# 3. Run security checks
npm audit
lockcheck --strict --drift

# 4. Run tests
npm test

# 5. Build and verify
npm run build
npm run start
```

### 9. Keep Lock Files in Version Control

```bash
# ✅ DO commit lockfiles
git add package-lock.json
git commit -m "chore: update dependencies"

# ❌ DON'T ignore lockfiles
# .gitignore should NOT contain:
# package-lock.json  # BAD!
```

**Exception:** Only ignore lockfiles for libraries (not applications).

### 10. Educate Your Team

```markdown
# Team Guidelines: Lockfile Hygiene

## Do's ✅
- Always commit `package-lock.json` changes
- Run `npm ci` in CI (not `npm install`)
- Use `npm update` to update deps (not manual edits)
- Run `lockcheck` before pushing

## Don'ts ❌
- Never manually edit lockfiles
- Don't delete lockfile without regenerating
- Don't ignore lockcheck warnings
- Don't use `npm install` in CI

## When lockcheck fails:
1. Review the error/warning
2. If suspicious registry → investigate
3. If missing integrity → regenerate lockfile
4. If duplicates → run `npm dedupe`
5. Ask #security-team if unsure
```

## Framework-Specific Examples

### React / Create React App

```bash
# CRA projects
cd my-react-app
lockcheck

# Common issues in CRA:
# - react-scripts pulls many deps → duplicates common
# - Solution: Use npm dedupe or upgrade react-scripts
```

**package.json:**

```json
{
  "scripts": {
    "start": "lockcheck && react-scripts start",
    "build": "lockcheck --strict && react-scripts build",
    "eject": "lockcheck && react-scripts eject"
  }
}
```

### Next.js

```bash
# Next.js with custom server
lockcheck

# Check for Next.js-specific drift
lockcheck --drift | grep "next"
```

**next.config.js:**

```javascript
module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Run lockcheck during server builds
      require('child_process').execSync('lockcheck --strict');
    }
    return config;
  }
};
```

### Vue / Vite

```bash
# Vite projects often use pnpm
# lockcheck works with package-lock.json only (npm)

# If using pnpm, convert to npm first
pnpm import  # Generates package-lock.json
lockcheck
```

### Express / Node.js Backend

```bash
# Backend projects: strict mode essential
lockcheck --strict --drift

# Add to Docker healthcheck
HEALTHCHECK --interval=30s CMD lockcheck || exit 1
```

**server.js:**

```javascript
// Check lockfile at startup
const { execSync } = require('child_process');

try {
  execSync('lockcheck --strict', { stdio: 'inherit' });
  console.log('✅ Lockfile verified');
} catch (err) {
  console.error('❌ Lockfile check failed');
  process.exit(1);
}

// Start server
app.listen(3000);
```

### Electron Apps

```bash
# Electron has complex dependency trees
lockcheck

# Check both main and renderer lockfiles
lockcheck src/main/package-lock.json
lockcheck src/renderer/package-lock.json
```

### React Native

```bash
# RN projects often have many duplicates
lockcheck | tee lockcheck-report.txt

# Common issue: metro-related duplicates
npm dedupe
lockcheck
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
