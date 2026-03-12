import type { WorkflowDto } from '@mini-zapier/shared';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from 'reactflow';
import { create } from 'zustand';

import type { WorkflowMutationInput } from '../lib/api/types';
import {
  createEditorNode,
  getNodeDefinition,
  toEditorNode,
  toWorkflowNode,
  type EditorNodeKind,
  type EditorNodeType,
  type WorkflowEditorEdge,
  type WorkflowEditorNode,
} from '../components/editor/editor-definitions';

const DEFAULT_WORKFLOW_NAME = 'Untitled workflow';
const DEFAULT_WORKFLOW_STATUS = 'DRAFT' as WorkflowDto['status'];

function cloneViewport(viewport: Viewport | null): Viewport | null {
  if (!viewport) {
    return null;
  }

  return {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}

function toViewportRecord(viewport: Viewport | null): Record<string, number> | null {
  if (!viewport) {
    return null;
  }

  return {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}

function toViewport(viewport: WorkflowDto['viewport']): Viewport | null {
  if (
    !viewport ||
    typeof viewport.x !== 'number' ||
    typeof viewport.y !== 'number' ||
    typeof viewport.zoom !== 'number'
  ) {
    return null;
  }

  return {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}

function hasPath(
  startNodeId: string,
  targetNodeId: string,
  edges: WorkflowEditorEdge[],
  visited = new Set<string>(),
): boolean {
  if (startNodeId === targetNodeId) {
    return true;
  }

  if (visited.has(startNodeId)) {
    return false;
  }

  visited.add(startNodeId);

  const outgoingEdges = edges.filter((edge) => edge.source === startNodeId);

  return outgoingEdges.some((edge) =>
    hasPath(edge.target, targetNodeId, edges, visited),
  );
}

function canConnectLinear(
  connection: Connection,
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
): boolean {
  if (!connection.source || !connection.target) {
    return false;
  }

  if (connection.source === connection.target) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  if (targetNode.data.nodeKind !== 'action') {
    return false;
  }

  if (
    edges.some(
      (edge) =>
        edge.source === connection.source && edge.target === connection.target,
    )
  ) {
    return false;
  }

  if (edges.some((edge) => edge.source === connection.source)) {
    return false;
  }

  if (edges.some((edge) => edge.target === connection.target)) {
    return false;
  }

  return !hasPath(connection.target, connection.source, edges);
}

export interface WorkflowValidationError {
  code: string;
  message: string;
}

function validateWorkflowGraph(
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  function pushError(code: string, message: string) {
    if (!errors.some((error) => error.code === code)) {
      errors.push({ code, message });
    }
  }

  const triggers = nodes.filter((node) => node.data.nodeKind === 'trigger');
  const actionNodes = nodes.filter((node) => node.data.nodeKind === 'action');
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoingEdgeMap = new Map<string, WorkflowEditorEdge[]>();
  const incomingEdgeMap = new Map<string, WorkflowEditorEdge[]>();
  const uniqueEdgePairs = new Set<string>();

  for (const node of nodes) {
    outgoingEdgeMap.set(node.id, []);
    incomingEdgeMap.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      pushError(
        'MISSING_NODE_REFERENCE',
        'Workflow contains edges that reference missing nodes.',
      );
      continue;
    }

    if (edge.source === edge.target) {
      pushError(
        'SELF_REFERENCING_EDGE',
        'Workflow must not contain self-referencing edges.',
      );
      continue;
    }

    const edgeKey = `${edge.source}->${edge.target}`;

    if (uniqueEdgePairs.has(edgeKey)) {
      pushError(
        'DUPLICATE_EDGES',
        'Workflow must not contain duplicate edges.',
      );
      continue;
    }

    uniqueEdgePairs.add(edgeKey);
    outgoingEdgeMap.get(edge.source)?.push(edge);
    incomingEdgeMap.get(edge.target)?.push(edge);
  }

  if (triggers.length === 0) {
    pushError('NO_TRIGGER', 'Workflow must have a trigger node.');
  } else if (triggers.length > 1) {
    pushError(
      'MULTIPLE_TRIGGERS',
      'Workflow must have exactly one trigger.',
    );
  }

  const triggerNode = triggers[0];

  if (triggerNode) {
    const triggerOutgoingEdges = outgoingEdgeMap.get(triggerNode.id) ?? [];

    if (triggerOutgoingEdges.length !== 1) {
      pushError(
        'INVALID_TRIGGER_OUTGOING',
        'Trigger node must have exactly one outgoing edge.',
      );
    }
  }

  if (nodes.length > 1 && edges.length === 0) {
    pushError(
      'NO_EDGES',
      'Nodes are not connected. Drag from one handle to another to create edges.',
    );
  }

  for (const actionNode of actionNodes) {
    const incomingCount = incomingEdgeMap.get(actionNode.id)?.length ?? 0;
    const outgoingCount = outgoingEdgeMap.get(actionNode.id)?.length ?? 0;

    if (incomingCount > 1 || outgoingCount > 1) {
      pushError(
        'INVALID_ACTION_DEGREE',
        'Each action node must have at most one incoming edge and at most one outgoing edge.',
      );
      break;
    }
  }

  if (actionNodes.length === 0) {
    pushError(
      'NO_ACTIONS',
      'Workflow must contain at least one action node connected to the trigger.',
    );
  } else {
    const terminalActions = actionNodes.filter(
      (node) => (outgoingEdgeMap.get(node.id)?.length ?? 0) === 0,
    );

    if (terminalActions.length !== 1) {
      pushError(
        'INVALID_TERMINAL_ACTIONS',
        'Workflow must contain exactly one terminal action node.',
      );
    }
  }

  if (triggerNode) {
    const reachableNodeIds = new Set<string>();
    let currentNodeId: string | undefined = triggerNode.id;

    while (currentNodeId !== undefined) {
      if (reachableNodeIds.has(currentNodeId)) {
        pushError('CYCLE', 'Workflow must not contain cycles.');
        break;
      }

      reachableNodeIds.add(currentNodeId);

      const outgoingEdges: WorkflowEditorEdge[] =
        outgoingEdgeMap.get(currentNodeId) ?? [];

      if (outgoingEdges.length === 0) {
        currentNodeId = undefined;
        continue;
      }

      currentNodeId = outgoingEdges[0]?.target;
    }

    if (reachableNodeIds.size !== nodes.length) {
      pushError(
        'DISCONNECTED_NODES',
        'Connect all nodes into a single chain starting from the trigger.',
      );
    }
  }

  return errors;
}

interface NodeMetaUpdates {
  label?: string;
  connectionId?: string | null;
  retryCount?: number;
  retryBackoff?: number;
  timeoutMs?: number | null;
}

interface WorkflowEditorStore {
  workflowId: string | null;
  workflowName: string;
  workflowStatus: WorkflowDto['status'];
  workflowVersion: number | null;
  workflowDescription: string | null;
  workflowTimezone: string | null;
  viewport: Viewport | null;
  nodes: WorkflowEditorNode[];
  edges: WorkflowEditorEdge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowStatus: (status: WorkflowDto['status']) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (options: {
    nodeKind: EditorNodeKind;
    nodeType: EditorNodeType;
    position: { x: number; y: number };
  }) => 'DUPLICATE_TRIGGER' | null;
  updateNodeConfig: (
    nodeId: string,
    configOrUpdater:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
  updateNodeMeta: (nodeId: string, updates: NodeMetaUpdates) => void;
  removeNode: (nodeId: string) => void;
  validateWorkflow: () => WorkflowValidationError[];
  resetEditor: () => void;
  loadWorkflow: (workflow: WorkflowDto) => void;
  saveWorkflow: () => WorkflowMutationInput;
}

export const useWorkflowEditorStore = create<WorkflowEditorStore>((set, get) => ({
  workflowId: null,
  workflowName: DEFAULT_WORKFLOW_NAME,
  workflowStatus: DEFAULT_WORKFLOW_STATUS,
  workflowVersion: null,
  workflowDescription: null,
  workflowTimezone: null,
  viewport: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange(changes) {
    set((state) => {
      const nextNodes = applyNodeChanges(
        changes,
        state.nodes,
      ) as WorkflowEditorNode[];
      const selectedNodeExists =
        state.selectedNodeId === null
          ? true
          : nextNodes.some((node) => node.id === state.selectedNodeId);

      return {
        nodes: nextNodes,
        selectedNodeId: selectedNodeExists ? state.selectedNodeId : null,
      };
    });
  },

  onEdgesChange(changes) {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect(connection) {
    const { nodes, edges } = get();

    if (!canConnectLinear(connection, nodes, edges)) {
      return;
    }

    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: crypto.randomUUID(),
          type: 'smoothstep',
          animated: false,
        },
        state.edges,
      ),
    }));
  },

  selectNode(nodeId) {
    set({ selectedNodeId: nodeId });
  },

  setWorkflowName(name) {
    set({ workflowName: name });
  },

  setWorkflowStatus(status) {
    set({ workflowStatus: status });
  },

  setViewport(viewport) {
    set({ viewport: cloneViewport(viewport) });
  },

  addNode({ nodeKind, nodeType, position }) {
    const definition = getNodeDefinition(nodeKind, nodeType);

    if (!definition) {
      return null;
    }

    if (nodeKind === 'trigger') {
      const { nodes } = get();
      const existingTrigger = nodes.find((n) => n.data.nodeKind === 'trigger');

      if (existingTrigger) {
        return 'DUPLICATE_TRIGGER' as const;
      }
    }

    const nextNode = createEditorNode(definition, position);

    set((state) => ({
      nodes: [...state.nodes, nextNode],
      selectedNodeId: nextNode.id,
    }));

    return null;
  },

  updateNodeConfig(nodeId, configOrUpdater) {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const nextConfig =
          typeof configOrUpdater === 'function'
            ? configOrUpdater(node.data.config)
            : configOrUpdater;
        return {
          ...node,
          data: {
            ...node.data,
            config: nextConfig,
          },
        };
      }),
    }));
  },

  updateNodeMeta(nodeId, updates) {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            }
          : node,
      ),
    }));
  },

  removeNode(nodeId) {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  validateWorkflow() {
    const { nodes, edges } = get();
    return validateWorkflowGraph(nodes, edges);
  },

  resetEditor() {
    set({
      workflowId: null,
      workflowName: DEFAULT_WORKFLOW_NAME,
      workflowStatus: DEFAULT_WORKFLOW_STATUS,
      workflowVersion: null,
      workflowDescription: null,
      workflowTimezone: null,
      viewport: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },

  loadWorkflow(workflow) {
    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowStatus: workflow.status,
      workflowVersion: workflow.version,
      workflowDescription: workflow.description ?? null,
      workflowTimezone: workflow.timezone ?? null,
      viewport: toViewport(workflow.viewport),
      nodes: workflow.nodes.map((node) => toEditorNode(node)),
      edges: workflow.edges.map((edge) => ({
        id: edge.id ?? crypto.randomUUID(),
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
        type: 'smoothstep',
      })),
      selectedNodeId: null,
    });
  },

  saveWorkflow() {
    const state = get();

    return {
      name: state.workflowName.trim() || DEFAULT_WORKFLOW_NAME,
      description: state.workflowDescription ?? undefined,
      timezone: state.workflowTimezone ?? undefined,
      viewport: toViewportRecord(state.viewport),
      nodes: state.nodes.map((node) => toWorkflowNode(node)),
      edges: state.edges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
      })),
    };
  },
}));
