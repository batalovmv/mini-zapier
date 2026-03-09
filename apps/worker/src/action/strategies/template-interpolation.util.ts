const EXACT_INPUT_TEMPLATE_PATTERN = /^{{\s*input(?:\.([^}]+))?\s*}}$/;
const INPUT_TEMPLATE_PATTERN = /{{\s*input(?:\.([^}]+))?\s*}}/g;

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function ensureSignalNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Action execution aborted.');
  }
}

export function resolveInputPath(inputData: unknown, rawPath?: string): unknown {
  if (!rawPath) {
    return inputData;
  }

  const pathSegments = rawPath
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  let currentValue = inputData;

  for (const segment of pathSegments) {
    if (Array.isArray(currentValue)) {
      const index = Number.parseInt(segment, 10);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      currentValue = currentValue[index];
      continue;
    }

    if (isPlainObject(currentValue)) {
      currentValue = currentValue[segment];
      continue;
    }

    return undefined;
  }

  return currentValue;
}

function stringifyInterpolatedValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

export function interpolateValue(value: unknown, inputData: unknown): unknown {
  if (typeof value === 'string') {
    const exactMatch = value.match(EXACT_INPUT_TEMPLATE_PATTERN);

    if (exactMatch) {
      return resolveInputPath(inputData, exactMatch[1]);
    }

    return value.replace(INPUT_TEMPLATE_PATTERN, (_, rawPath?: string) =>
      stringifyInterpolatedValue(resolveInputPath(inputData, rawPath)),
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => interpolateValue(entry, inputData));
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      result[key] = interpolateValue(entry, inputData);
    }

    return result;
  }

  return value;
}

export function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

export function readRequiredStringRecord(
  value: unknown,
  fieldName: string,
): Record<string, string> {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  const result: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new Error(`${fieldName}.${key} must be a string.`);
    }

    result[key] = entry;
  }

  return result;
}
