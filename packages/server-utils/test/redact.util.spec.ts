import assert from 'node:assert/strict';
import test from 'node:test';

import { redactCredentials } from '../src/redact.util';

test('redactCredentials masks password fields', () => {
  const source = {
    password: 'secret',
    username: 'admin',
  };

  const result = redactCredentials(source);

  assert.deepEqual(result, {
    password: '****',
    username: 'admin',
  });
  assert.deepEqual(source, {
    password: 'secret',
    username: 'admin',
  });
});

test('redactCredentials masks nested token, secret, apiKey and credentials fields', () => {
  const source = {
    botToken: 'telegram-token',
    nested: {
      signingSecret: 'webhook-secret',
      apiKey: 'service-key',
      credentials: {
        password: 'hidden',
      },
    },
    values: [
      {
        accessToken: 'array-token',
      },
    ],
  };

  const result = redactCredentials(source);

  assert.deepEqual(result, {
    botToken: '****',
    nested: {
      signingSecret: '****',
      apiKey: '****',
      credentials: '****',
    },
    values: [
      {
        accessToken: '****',
      },
    ],
  });
});
