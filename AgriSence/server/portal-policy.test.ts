import assert from 'node:assert/strict';
import test from 'node:test';
import { checkOrderTransition, identifier, loginEmail, password, PortalError } from './portal-policy.js';

test('official IDs are normalized and mapped away from farmer emails', () => {
  assert.equal(identifier('office', ' Pune-Officer_01 '), 'pune-officer_01');
  assert.match(loginEmail('office', 'pune-officer_01'), /@office\.accounts\.agrisence\.invalid$/);
});

test('vendor identifiers require contact email format', () => {
  assert.equal(identifier('vendor', 'seller@example.com'), 'seller@example.com');
  assert.throws(() => identifier('vendor', 'seller'), PortalError);
});

test('portal passwords and order transitions enforce boundaries', () => {
  assert.doesNotThrow(() => password('LongSecurePassword1!'));
  assert.throws(() => password('short'), PortalError);
  assert.doesNotThrow(() => checkOrderTransition('Requested', 'Accepted'));
  assert.throws(() => checkOrderTransition('Completed', 'Accepted'), PortalError);
});
