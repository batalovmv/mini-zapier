/**
 * Builds a tree representation of JSON data structure.
 * Used to create schema snapshots for the FieldPicker tree UI.
 *
 * Structurally identical to FieldTreeNode in @mini-zapier/shared.
 * Duplicated here to avoid cross-package dependency (structural typing makes this safe).
 */
export interface FieldTreeNode {
  key: string;
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  children?: FieldTreeNode[];
}

type FieldType = FieldTreeNode['type'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function inferType(value: unknown): FieldType {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (isPlainObject(value)) {
    return 'object';
  }

  const t = typeof value;

  if (t === 'string') {
    return 'string';
  }

  if (t === 'number') {
    return 'number';
  }

  if (t === 'boolean') {
    return 'boolean';
  }

  return 'null';
}

/**
 * Recursively builds a field tree from a JSON value.
 * Arrays: enumerates only first element (index 0) as representative.
 * This matches the existing extractFieldPaths behavior.
 */
export function buildFieldTree(
  data: unknown,
  maxDepth = 5,
): FieldTreeNode[] {
  const nodes: FieldTreeNode[] = [];

  function walk(value: unknown, prefix: string, depth: number): FieldTreeNode[] {
    const result: FieldTreeNode[] = [];

    if (depth > maxDepth) {
      return result;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        const childPath = prefix ? `${prefix}.0` : '0';
        const childType = inferType(value[0]);
        const children = walk(value[0], childPath, depth + 1);
        const node: FieldTreeNode = {
          key: '0',
          path: childPath,
          type: childType,
        };

        if (children.length > 0) {
          node.children = children;
        }

        result.push(node);
      }

      return result;
    }

    if (isPlainObject(value)) {
      for (const key of Object.keys(value)) {
        const childPath = prefix ? `${prefix}.${key}` : key;
        const childType = inferType(value[key]);
        const children = walk(value[key], childPath, depth + 1);
        const node: FieldTreeNode = {
          key,
          path: childPath,
          type: childType,
        };

        if (children.length > 0) {
          node.children = children;
        }

        result.push(node);
      }
    }

    return result;
  }

  return walk(data, '', 0);
}
