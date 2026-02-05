import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { checkLockfileFromContent } from '../index';

const fixturesDir = join(__dirname, 'fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

test('valid lockfile passes all checks', () => {
  const content = loadFixture('valid-lockfile.json');
  const result = checkLockfileFromContent(content);
  
  assert.equal(result.passed, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('detects suspicious registry', () => {
  const content = loadFixture('suspicious-registry.json');
  const result = checkLockfileFromContent(content);
  
  assert.equal(result.passed, true); // warnings don't fail by default
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].type, 'suspicious-registry');
  assert.ok(result.warnings[0].message.includes('malicious-package'));
});

test('detects missing integrity hash', () => {
  const content = loadFixture('missing-integrity.json');
  const result = checkLockfileFromContent(content);
  
  assert.equal(result.passed, true);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].type, 'missing-integrity');
});

test('detects duplicate versions', () => {
  const content = loadFixture('duplicate-versions.json');
  const result = checkLockfileFromContent(content);
  
  assert.equal(result.passed, true);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].type, 'duplicate-version');
  assert.ok(result.warnings[0].message.includes('lodash'));
});

test('strict mode converts warnings to errors', () => {
  const content = loadFixture('suspicious-registry.json');
  const result = checkLockfileFromContent(content, { strict: true });
  
  assert.equal(result.passed, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.warnings.length, 0);
});

test('handles invalid JSON gracefully', () => {
  const content = loadFixture('invalid-json.json');
  const result = checkLockfileFromContent(content);
  
  assert.equal(result.passed, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].type, 'invalid-format');
});

test('custom allowed registries', () => {
  const content = loadFixture('suspicious-registry.json');
  const result = checkLockfileFromContent(content, {
    allowedRegistries: ['https://evil-registry.com']
  });
  
  assert.equal(result.passed, true);
  assert.equal(result.warnings.length, 0); // no warning since registry is allowed
});
