const REDACTED_VALUE = '****';
const SENSITIVE_KEY_SUFFIXES = [
  'password',
  'token',
  'secret',
  'apikey',
  'credentials',
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = normalizeKey(key);

  return SENSITIVE_KEY_SUFFIXES.some(
    (suffix) =>
      normalizedKey === suffix || normalizedKey.endsWith(suffix),
  );
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      redacted[key] = REDACTED_VALUE;
      continue;
    }

    redacted[key] = redactValue(nestedValue);
  }

  return redacted;
}

export function redactCredentials<T>(obj: T): T {
  return redactValue(obj) as T;
}
