import { BadRequestException } from '@nestjs/common';
import { NodeKind } from '@mini-zapier/shared';

export interface WorkflowNodeValidationInput {
  id: string;
  nodeKind: NodeKind;
}

export interface WorkflowEdgeValidationInput {
  sourceNodeId: string;
  targetNodeId: string;
}

export function validateLinearWorkflowGraph(
  nodes: WorkflowNodeValidationInput[],
  edges: WorkflowEdgeValidationInput[],
): void {
  const triggerNodes = nodes.filter((node) => node.nodeKind === 'trigger');

  if (triggerNodes.length !== 1) {
    throw new BadRequestException(
      'Workflow graph must contain exactly one trigger node.',
    );
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoingEdgeMap = new Map<string, WorkflowEdgeValidationInput[]>();
  const incomingEdgeMap = new Map<string, WorkflowEdgeValidationInput[]>();
  const uniqueEdgePairs = new Set<string>();

  for (const node of nodes) {
    outgoingEdgeMap.set(node.id, []);
    incomingEdgeMap.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new BadRequestException(
        'Workflow graph contains edges that reference missing nodes.',
      );
    }

    if (edge.sourceNodeId === edge.targetNodeId) {
      throw new BadRequestException(
        'Workflow graph must not contain self-referencing edges.',
      );
    }

    const edgeKey = `${edge.sourceNodeId}->${edge.targetNodeId}`;

    if (uniqueEdgePairs.has(edgeKey)) {
      throw new BadRequestException(
        'Workflow graph must not contain duplicate edges.',
      );
    }

    uniqueEdgePairs.add(edgeKey);
    outgoingEdgeMap.get(edge.sourceNodeId)?.push(edge);
    incomingEdgeMap.get(edge.targetNodeId)?.push(edge);
  }

  const triggerNode = triggerNodes[0];
  const triggerOutgoingEdges = outgoingEdgeMap.get(triggerNode.id) ?? [];

  if (triggerOutgoingEdges.length !== 1) {
    throw new BadRequestException(
      'Trigger node must have exactly one outgoing edge.',
    );
  }

  const actionNodes = nodes.filter((node) => node.nodeKind === 'action');

  for (const actionNode of actionNodes) {
    const incomingCount = incomingEdgeMap.get(actionNode.id)?.length ?? 0;
    const outgoingCount = outgoingEdgeMap.get(actionNode.id)?.length ?? 0;

    if (incomingCount > 1 || outgoingCount > 1) {
      throw new BadRequestException(
        'Each action node must have at most one incoming edge and at most one outgoing edge.',
      );
    }
  }

  const terminalActions = actionNodes.filter(
    (node) => (outgoingEdgeMap.get(node.id)?.length ?? 0) === 0,
  );

  if (terminalActions.length !== 1) {
    throw new BadRequestException(
      'Workflow graph must contain exactly one terminal action node.',
    );
  }

  const reachableNodeIds = new Set<string>();
  let currentNodeId: string | undefined = triggerNode.id;

  // Follow the only possible path from the trigger to detect cycles and gaps.
  while (currentNodeId !== undefined) {
    if (reachableNodeIds.has(currentNodeId)) {
      throw new BadRequestException('Workflow graph must not contain cycles.');
    }

    reachableNodeIds.add(currentNodeId);

    const outgoingEdges: WorkflowEdgeValidationInput[] =
      outgoingEdgeMap.get(currentNodeId) ?? [];

    if (outgoingEdges.length === 0) {
      currentNodeId = undefined;
      continue;
    }

    currentNodeId = outgoingEdges[0]?.targetNodeId;
  }

  if (reachableNodeIds.size !== nodes.length) {
    throw new BadRequestException(
      'Workflow graph must not contain disconnected nodes.',
    );
  }
}
