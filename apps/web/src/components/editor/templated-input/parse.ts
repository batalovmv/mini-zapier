/**
 * Template parsing utilities for TemplatedInput.
 *
 * The regex MUST match the worker runtime exactly:
 * apps/worker/src/action/strategies/template-interpolation.util.ts L2
 */

// eslint-disable-next-line no-useless-escape
const TEMPLATE_RE = /{{\s*input(?:\.([^}]+))?\s*}}/g;

export type Segment =
  | { type: 'text'; value: string }
  | { type: 'ref'; raw: string; path: string | null };

/**
 * Normalize a captured path to match worker's `resolveInputPath` trim logic.
 * Returns `null` for bare `{{input}}`.
 */
export function normalizePath(captured: string | undefined): string | null {
  if (captured === undefined || captured === null) {
    return null;
  }

  const segments = captured
    .split('.')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return segments.length > 0 ? segments.join('.') : null;
}

/**
 * Parse a template string into segments, preserving the exact raw token for
 * roundtrip fidelity.
 */
export function parseTemplate(str: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // Reset regex state
  TEMPLATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TEMPLATE_RE.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }

    segments.push({
      type: 'ref',
      raw: match[0],
      path: normalizePath(match[1]),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < str.length) {
    segments.push({ type: 'text', value: str.slice(lastIndex) });
  }

  return segments;
}

/** Data attribute used to identify chip spans in the contentEditable. */
export const CHIP_ATTR = 'data-raw';
export const CHIP_PATH_ATTR = 'data-path';

/**
 * Recursively serialize a contentEditable element back to a plain string.
 * Chip spans are serialized using their `data-raw` attribute (exact roundtrip).
 */
export function serializeFromDom(el: HTMLElement): string {
  let result = '';

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? '';
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Chip span → use raw token
      if (element.hasAttribute(CHIP_ATTR)) {
        result += element.getAttribute(CHIP_ATTR) ?? '';
        continue;
      }

      // <br> → newline
      if (element.tagName === 'BR') {
        result += '\n';
        continue;
      }

      // Recurse into other elements (div/p/span wrappers from browser)
      const inner = serializeFromDom(element);

      // Block elements implicitly start a new line (browser wraps lines in divs)
      if (
        element.tagName === 'DIV' ||
        element.tagName === 'P'
      ) {
        // Only add newline if we already have content and the previous char
        // isn't already a newline
        if (result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
        }

        result += inner;
      } else {
        result += inner;
      }
    }
  }

  return result;
}

/**
 * Normalize contentEditable DOM after browser mutations (paste, Enter, etc.).
 * Flattens block wrappers into <br>, merges adjacent text nodes.
 */
export function normalizeDom(el: HTMLElement, multiline: boolean): void {
  const children = Array.from(el.childNodes);

  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as HTMLElement;

    // Skip chip spans
    if (element.hasAttribute(CHIP_ATTR)) {
      continue;
    }

    // Unwrap block elements (div, p) into <br> + children
    if (element.tagName === 'DIV' || element.tagName === 'P') {
      if (multiline) {
        // Insert <br> before the block if there's preceding content
        const prev = element.previousSibling;

        if (prev && !(prev.nodeType === Node.ELEMENT_NODE && (prev as HTMLElement).tagName === 'BR')) {
          el.insertBefore(document.createElement('br'), element);
        }
      }

      // Move children out
      while (element.firstChild) {
        el.insertBefore(element.firstChild, element);
      }

      el.removeChild(element);
    }
  }

  if (!multiline) {
    // Remove all <br> elements in single-line mode
    const brs = el.querySelectorAll('br');

    for (const br of Array.from(brs)) {
      br.remove();
    }
  }

  // Merge adjacent text nodes
  el.normalize();
}

/** Human-readable label for a chip. */
export function chipLabel(path: string | null): string {
  return path !== null ? `input.${path}` : 'input';
}
