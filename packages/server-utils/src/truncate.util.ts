const DEFAULT_MAX_BYTES = 65536;

function serializePayload(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }

  const serialized = JSON.stringify(data);
  return serialized ?? String(data);
}

function truncateStringToBytes(value: string, maxBytes: number): string {
  let low = 0;
  let high = value.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = value.slice(0, mid);

    if (Buffer.byteLength(candidate, 'utf8') <= maxBytes) {
      low = mid;
      continue;
    }

    high = mid - 1;
  }

  return value.slice(0, low);
}

export function truncatePayload(
  data: unknown,
  maxBytes = DEFAULT_MAX_BYTES,
): { data: unknown; truncated: boolean } {
  if (maxBytes <= 0) {
    throw new Error('maxBytes must be greater than 0.');
  }

  const serialized = serializePayload(data);

  if (Buffer.byteLength(serialized, 'utf8') <= maxBytes) {
    return {
      data,
      truncated: false,
    };
  }

  if (typeof data === 'string') {
    return {
      data: truncateStringToBytes(data, maxBytes),
      truncated: true,
    };
  }

  return {
    data: truncateStringToBytes(serialized, maxBytes),
    truncated: true,
  };
}
