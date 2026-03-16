import type { FieldTreeNode } from '@mini-zapier/shared';

import type {
  WorkflowEditorEdge,
  WorkflowEditorNode,
} from '../components/editor/editor-definitions';

/**
 * Computes the chain position of a node in the linear workflow.
 * Returns -1 for trigger node or if node is not found in the chain.
 * Returns 0+ for action nodes (0 = first action after trigger).
 */
export function computeChainPosition(
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
  nodeId: string,
): number {
  const outgoingMap = new Map<string, string>();

  for (const edge of edges) {
    outgoingMap.set(edge.source, edge.target);
  }

  const triggerNode = nodes.find((n) => n.data.nodeKind === 'trigger');

  if (!triggerNode) {
    return -1;
  }

  if (triggerNode.id === nodeId) {
    return -1;
  }

  const visited = new Set<string>();
  let currentId: string | undefined = triggerNode.id;
  let position = 0;

  while (currentId !== undefined) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const nextId = outgoingMap.get(currentId);

    if (nextId === undefined) {
      break;
    }

    if (nextId === nodeId) {
      return position;
    }

    position++;
    currentId = nextId;
  }

  return -1;
}

/**
 * Returns ordered nodeId list: [triggerId, action1Id, action2Id, ...].
 * Returns empty array if no trigger exists.
 */
export function computeChainOrder(
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
): string[] {
  const outgoingMap = new Map<string, string>();

  for (const edge of edges) {
    outgoingMap.set(edge.source, edge.target);
  }

  const triggerNode = nodes.find((n) => n.data.nodeKind === 'trigger');

  if (!triggerNode) {
    return [];
  }

  const order: string[] = [triggerNode.id];
  const visited = new Set<string>([triggerNode.id]);
  let currentId: string | undefined = outgoingMap.get(triggerNode.id);

  while (currentId !== undefined) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    order.push(currentId);
    currentId = outgoingMap.get(currentId);
  }

  return order;
}

/**
 * Computes a structural fingerprint of the workflow graph.
 * Used to detect unsaved structural changes (node additions/removals,
 * edge reconnections, node type changes).
 */
export function computeStructuralFingerprint(
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
): string {
  const nodeParts = nodes
    .map((n) => `${n.id}:${n.data.nodeKind}:${n.data.nodeType}`)
    .sort()
    .join('|');

  const edgeParts = edges
    .map((e) => `${e.source}->${e.target}`)
    .sort()
    .join('|');

  return `${nodeParts}##${edgeParts}`;
}

/**
 * Flattens a field tree into dot-notation paths.
 * Collects ALL node paths (branches and leaves).
 */
export function flattenTreePaths(tree: FieldTreeNode[]): string[] {
  const paths: string[] = [];

  function walk(nodes: FieldTreeNode[]): void {
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
