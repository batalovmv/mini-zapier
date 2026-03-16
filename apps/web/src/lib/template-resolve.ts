import { parseTemplate, type Segment } from '../components/editor/templated-input/parse';

export type ResolvedSegment =
  | { type: 'text'; value: string }
  | { type: 'ref'; raw: string; resolved: string | null };

/**
 * Walk a dot-separated path against data (objects/arrays).
 * Mirrors worker's resolveInputPath exactly.
 */
function resolveInputPath(data: unknown, path: string | null): unknown {
  if (path === null) return data;

  const segments = path
    .split('.')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let current = data;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (
      current !== null &&
      typeof current === 'object' &&
      Object.prototype.toString.call(current) === '[object Object]'
    ) {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function stringify(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Resolve a template string against inputData, returning typed segments
 * so the UI can style resolved vs unresolved refs differently.
 */
export function resolveTemplateSegments(
  template: string,
  inputData: unknown,
): ResolvedSegment[] {
  const parsed: Segment[] = parseTemplate(template);

  return parsed.map((seg) => {
    if (seg.type === 'text') return seg;

    const value = resolveInputPath(inputData, seg.path);

    return {
      type: 'ref' as const,
      raw: seg.raw,
      resolved: value !== undefined ? stringify(value) : null,
    };
  });
}
