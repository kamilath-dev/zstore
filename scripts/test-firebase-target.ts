import assert from 'node:assert/strict';
import { validateTarget } from './inventory-common';

const firestoreTarget = validateTarget({
  'project-id': 'zstore-7ed88',
  'database-id': '(default)',
  'confirm-target': 'zstore-7ed88/(default)'
}, 'firestore');
assert.equal(firestoreTarget.projectId, 'zstore-7ed88');
assert.equal(firestoreTarget.databaseId, '(default)');

assert.equal(validateTarget({
  'project-id': 'zstore-7ed88',
  'confirm-target': 'zstore-7ed88'
}, 'auth').projectId, 'zstore-7ed88');
assert.equal(validateTarget({
  'project-id': 'zstore-7ed88',
  bucket: 'zstore-7ed88.firebasestorage.app',
  'confirm-target': 'zstore-7ed88/zstore-7ed88.firebasestorage.app'
}, 'storage').bucket, 'zstore-7ed88.firebasestorage.app');

assert.throws(
  () => validateTarget({
    'project-id': 'not-the-zstore-project',
    'database-id': '(default)',
    'confirm-target': 'not-the-zstore-project/(default)'
  }, 'firestore'),
  /seuls les inventaires de zstore-7ed88/
);
assert.throws(
  () => validateTarget({
    'project-id': 'zstore-7ed88',
    'database-id': 'another-database',
    'confirm-target': 'zstore-7ed88/another-database'
  }, 'firestore'),
  /Firestore doit cibler \(default\)/
);

console.log('Firebase target isolation tests passed.');
