import { Injectable } from '@nestjs/common';
import { NodeKind } from '@mini-zapier/shared';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function readString(
  value: unknown,
  fieldName: string,
  allowEmpty = false,
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!allowEmpty && normalizedValue.length === 0) {
    throw new Error(`${fieldName} must not be empty.`);
  }

  return normalizedValue;
}

function readOptionalString(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return readString(value, fieldName);
}

function readOptionalNumber(
  value: unknown,
  fieldName: string,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  return value;
}

function readConfig(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value;
}

export interface SnapshotNode {
  id: string;
  nodeKind: NodeKind;
  nodeType: string;
  label: string;
  config: Record<string, unknown>;
  connectionId?: string | null;
  retryCount?: number;
  retryBackoff?: number;
  timeoutMs?: number | null;
}

interface SnapshotEdge {
  sourceNodeId: string;
  targetNodeId: string;
}

@Injectable()
export class ChainResolver {
  resolve(snapshot: unknown): SnapshotNode[] {
    const { nodes, edges } = this.parseSnapshot(snapshot);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const outgoingEdgeMap = new Map<string, SnapshotEdge[]>();
    const incomingEdgeMap = new Map<string, SnapshotEdge[]>();

    for (const node of nodes) {
      outgoingEdgeMap.set(node.id, []);
      incomingEdgeMap.set(node.id, []);
    }

    for (const edge of edges) {
      const sourceNode = nodeById.get(edge.sourceNodeId);
      const targetNode = nodeById.get(edge.targetNodeId);

      if (!sourceNode || !targetNode) {
        throw new Error('Definition snapshot contains edges with missing nodes.');
      }

      outgoingEdgeMap.get(edge.sourceNodeId)?.push(edge);
      incomingEdgeMap.get(edge.targetNodeId)?.push(edge);
    }

    const triggerNodes = nodes.filter((node) => node.nodeKind === 'trigger');

    if (triggerNodes.length !== 1) {
      throw new Error('Definition snapshot must contain exactly one trigger node.');
    }

    const triggerNode = triggerNodes[0];
    const triggerOutgoingEdges = outgoingEdgeMap.get(triggerNode.id) ?? [];

    if (triggerOutgoingEdges.length !== 1) {
      throw new Error(
        'Definition snapshot trigger node must have exactly one outgoing edge.',
      );
    }

    const actionNodes = nodes.filter((node) => node.nodeKind === 'action');

    for (const actionNode of actionNodes) {
      const incomingCount = incomingEdgeMap.get(actionNode.id)?.length ?? 0;
      const outgoingCount = outgoingEdgeMap.get(actionNode.id)?.length ?? 0;

      if (incomingCount > 1 || outgoingCount > 1) {
        throw new Error(
          'Definition snapshot action nodes must remain linear.',
        );
      }
    }

    const orderedActionNodes: SnapshotNode[] = [];
    const visitedNodeIds = new Set<string>();
    let currentNodeId: string | undefined = triggerNode.id;

    while (currentNodeId !== undefined) {
      if (visitedNodeIds.has(currentNodeId)) {
        throw new Error('Definition snapshot must not contain cycles.');
      }

      visitedNodeIds.add(currentNodeId);

      const outgoingEdges = outgoingEdgeMap.get(currentNodeId) ?? [];

      if (outgoingEdges.length === 0) {
        currentNodeId = undefined;
        continue;
      }

      const nextNode = nodeById.get(outgoingEdges[0].targetNodeId);

      if (!nextNode) {
        throw new Error('Definition snapshot contains an invalid edge target.');
      }

      if (nextNode.nodeKind !== 'action') {
        throw new Error('Trigger chain may only continue through action nodes.');
      }

      orderedActionNodes.push(nextNode);
      currentNodeId = nextNode.id;
    }

    if (visitedNodeIds.size !== nodes.length) {
      throw new Error('Definition snapshot must not contain disconnected nodes.');
    }

    if (orderedActionNodes.length !== actionNodes.length) {
      throw new Error('Definition snapshot action chain is incomplete.');
    }

    return orderedActionNodes;
  }

  private parseSnapshot(snapshot: unknown): {
    nodes: SnapshotNode[];
    edges: SnapshotEdge[];
  } {
    if (!isPlainObject(snapshot)) {
      throw new Error('Definition snapshot must be an object.');
    }

    const nodesValue = snapshot.nodes;
    const edgesValue = snapshot.edges;

    if (!Array.isArray(nodesValue) || !Array.isArray(edgesValue)) {
      throw new Error('Definition snapshot must contain nodes and edges arrays.');
    }

    return {
      nodes: nodesValue.map((node, index) => this.parseNode(node, index)),
      edges: edgesValue.map((edge, index) => this.parseEdge(edge, index)),
    };
  }

  private parseNode(node: unknown, index: number): SnapshotNode {
    if (!isPlainObject(node)) {
      throw new Error(`Definition snapshot node[${index}] must be an object.`);
    }

    const nodeKind = readString(node.nodeKind, `nodes[${index}].nodeKind`);

    if (nodeKind !== 'trigger' && nodeKind !== 'action') {
      throw new Error(`nodes[${index}].nodeKind must be trigger or action.`);
    }

    return {
      id: readString(node.id, `nodes[${index}].id`),
      nodeKind,
      nodeType: readString(node.nodeType, `nodes[${index}].nodeType`),
      label: readString(node.label, `nodes[${index}].label`),
      config: readConfig(node.config, `nodes[${index}].config`),
      connectionId: readOptionalString(
        node.connectionId,
        `nodes[${index}].connectionId`,
      ),
      retryCount:
        readOptionalNumber(node.retryCount, `nodes[${index}].retryCount`) ?? 0,
      retryBackoff:
        readOptionalNumber(
          node.retryBackoff,
          `nodes[${index}].retryBackoff`,
        ) ?? 0,
      timeoutMs: readOptionalNumber(node.timeoutMs, `nodes[${index}].timeoutMs`),
    };
  }

  private parseEdge(edge: unknown, index: number): SnapshotEdge {
    if (!isPlainObject(edge)) {
      throw new Error(`Definition snapshot edge[${index}] must be an object.`);
    }

    return {
      sourceNodeId: readString(
        edge.sourceNodeId,
        `edges[${index}].sourceNodeId`,
      ),
      targetNodeId: readString(
        edge.targetNodeId,
        `edges[${index}].targetNodeId`,
      ),
    };
  }
}
