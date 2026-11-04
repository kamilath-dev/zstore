import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  isValidBcryptHash,
  validateAdminAuthConfig,
  verifyAdminPassword
} from '../src/services/adminAuthSecurity';

const testPassword = 'Unit-test-password-2026!';
const testHash = await bcrypt.hash(testPassword, 12);
assert.equal(isValidBcryptHash(testHash), true);
assert.equal(isValidBcryptHash('not-a-bcrypt-hash'), false);
assert.equal(isValidBcryptHash(await bcrypt.hash(testPassword, 4)), false);

assert.deepEqual(
  validateAdminAuthConfig(' Owner@Example.Test ', testHash),
  { email: 'owner@example.test', passwordHash: testHash }
);
assert.throws(
  () => validateAdminAuthConfig(undefined, testHash),
  /ADMIN_EMAIL et ADMIN_PASSWORD_HASH/
);
assert.throws(
  () => validateAdminAuthConfig('owner@example.test', undefined),
  /ADMIN_EMAIL et ADMIN_PASSWORD_HASH/
);
assert.throws(
  () => validateAdminAuthConfig('not-an-email', testHash),
  /configuration d’authentification administrateur est invalide/
);
assert.throws(
  () => validateAdminAuthConfig('owner@example.test', 'invalid-hash'),
  /configuration d’authentification administrateur est invalide/
);

assert.equal(await verifyAdminPassword(
  'owner@example.test',
  testPassword,
  'owner@example.test',
  testHash
), true);
assert.equal(await verifyAdminPassword(
  'owner@example.test',
  'wrong-password',
  'owner@example.test',
  testHash
), false);
assert.equal(await verifyAdminPassword(
  'ordinary@example.test',
  testPassword,
  'owner@example.test',
  testHash
), false);

console.log('Admin authentication security tests passed.');
