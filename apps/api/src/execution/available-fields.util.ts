interface MinimalNode {
  id: string;
  nodeKind: string;
  nodeType: string;
}

interface MinimalEdge {
  sourceNodeId: string;
  targetNodeId: string;
}

/**
 * Walks the linear chain from trigger → action1 → action2 → ...
 * Returns ordered action node IDs (trigger excluded).
 * Works with both Prisma records and parsed definition snapshots.
 */
export function resolveChainPositions(
  nodes: MinimalNode[],
  edges: MinimalEdge[],
): string[] {
  const outgoingMap = new Map<string, string>();

  for (const edge of edges) {
    outgoingMap.set(edge.sourceNodeId, edge.targetNodeId);
  }

  const triggerNode = nodes.find((n) => n.nodeKind === 'trigger');

  if (!triggerNode) {
    return [];
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const orderedActionIds: string[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = triggerNode.id;

  while (currentId !== undefined) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const nextId = outgoingMap.get(currentId);

    if (nextId === undefined) {
      break;
    }

    const nextNode = nodeById.get(nextId);

    if (!nextNode || nextNode.nodeKind !== 'action') {
      break;
    }

    orderedActionIds.push(nextId);
    currentId = nextId;
  }

  return orderedActionIds;
}

/**
 * Computes a chain signature for structural compatibility comparison.
 * Format: "triggerType|actionType1,actionType2,..."
 * Does NOT depend on nodeId (which changes on every PUT).
 */
export function computeChainSignature(
  nodes: MinimalNode[],
  edges: MinimalEdge[],
): string {
  const chain = resolveChainPositions(nodes, edges);
  const triggerNode = nodes.find((n) => n.nodeKind === 'trigger');
  const triggerType = triggerNode?.nodeType ?? 'unknown';
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const actionTypes = chain.map(
    (id) => nodeById.get(id)?.nodeType ?? 'unknown',
  );

  return `${triggerType}|${actionTypes.join(',')}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Recursively extracts dot-notation field paths from a JSON value.
 * Arrays: enumerates only first element (index 0) as representative.
 * This matches worker's resolveInputPath which supports numeric path segments.
 */
export function extractFieldPaths(
  data: unknown,
  maxDepth = 5,
): string[] {
  const paths: string[] = [];

  function walk(value: unknown, prefix: string, depth: number): void {
    if (depth > maxDepth) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        const childPrefix = prefix ? `${prefix}.0` : '0';
        paths.push(childPrefix);
        walk(value[0], childPrefix, depth + 1);
      }

      return;
    }

    if (isPlainObject(value)) {
      for (const key of Object.keys(value)) {
        const childPrefix = prefix ? `${prefix}.${key}` : key;
        paths.push(childPrefix);
        walk(value[key], childPrefix, depth + 1);
      }
    }
  }

  walk(data, '', 0);

  return paths;
}

/**
 * Parses a definition snapshot's nodes and edges for chain resolution.
 * Tolerant: returns empty arrays on invalid input instead of throwing.
 */
export function parseSnapshotForChain(
  snapshot: unknown,
): { nodes: MinimalNode[]; edges: MinimalEdge[] } {
  if (!isPlainObject(snapshot)) {
    return { nodes: [], edges: [] };
  }

  const rawNodes = snapshot.nodes;
  const rawEdges = snapshot.edges;

  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
    return { nodes: [], edges: [] };
  }

  const nodes: MinimalNode[] = [];

  for (const node of rawNodes) {
    if (
      isPlainObject(node) &&
      typeof node.id === 'string' &&
      typeof node.nodeKind === 'string' &&
      typeof node.nodeType === 'string'
    ) {
      nodes.push({
        id: node.id,
        nodeKind: node.nodeKind,
        nodeType: node.nodeType,
      });
    }
  }

  const edges: MinimalEdge[] = [];

  for (const edge of rawEdges) {
    if (
      isPlainObject(edge) &&
      typeof edge.sourceNodeId === 'string' &&
      typeof edge.targetNodeId === 'string'
    ) {
      edges.push({
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
      });
    }
  }

  return { nodes, edges };
}

interface TreeNodeLike {
  path: string;
  children?: TreeNodeLike[];
}

/**
 * Flattens a field tree into dot-notation paths.
 * Collects ALL node paths (branches and leaves), matching extractFieldPaths behavior.
 */
export function flattenTreePaths(tree: TreeNodeLike[]): string[] {
  const paths: string[] = [];

  function walk(nodes: TreeNodeLike[]): void {
    for (const node of nodes) {
      paths.push(node.path);

      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(tree);

  return paths;
}
