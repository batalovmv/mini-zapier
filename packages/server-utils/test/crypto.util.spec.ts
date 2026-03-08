import assert from 'node:assert/strict';
import test from 'node:test';

import { decrypt, encrypt } from '../src/crypto.util';

test('encrypt/decrypt performs an AES-256-GCM roundtrip', () => {
  const plaintext = 'mini-zapier-secret';
  const key = 'test-encryption-key';

  const ciphertext = encrypt(plaintext, key);

  assert.notEqual(ciphertext, plaintext);
  assert.equal(decrypt(ciphertext, key), plaintext);
});

test('encrypt uses a random IV per payload', () => {
  const plaintext = 'same-value';
  const key = 'test-encryption-key';

  const firstCiphertext = encrypt(plaintext, key);
  const secondCiphertext = encrypt(plaintext, key);

  assert.notEqual(firstCiphertext, secondCiphertext);
});
