import assert from 'node:assert/strict';
import test from 'node:test';

import { truncatePayload } from '../src/truncate.util';

test('truncatePayload keeps payloads smaller than the byte limit intact', () => {
  const payload = {
    ok: true,
    message: 'short',
  };

  const result = truncatePayload(payload, 64);

  assert.equal(result.truncated, false);
  assert.deepEqual(result.data, payload);
});

test('truncatePayload truncates long strings and reports truncated=true', () => {
  const payload = 'x'.repeat(128);

  const result = truncatePayload(payload, 32);

  assert.equal(result.truncated, true);
  assert.equal(typeof result.data, 'string');
  assert.equal(Buffer.byteLength(result.data as string, 'utf8') <= 32, true);
});

test('truncatePayload truncates oversized objects to a JSON string preview', () => {
  const payload = {
    body: 'x'.repeat(1024),
  };

  const result = truncatePayload(payload, 64);

  assert.equal(result.truncated, true);
  assert.equal(typeof result.data, 'string');
  assert.equal(Buffer.byteLength(result.data as string, 'utf8') <= 64, true);
});
