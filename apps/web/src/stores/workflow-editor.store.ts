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
  }) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeMeta: (nodeId: string, updates: NodeMetaUpdates) => void;
  removeNode: (nodeId: string) => void;
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
      return;
    }

    const nextNode = createEditorNode(definition, position);

    set((state) => ({
      nodes: [...state.nodes, nextNode],
      selectedNodeId: nextNode.id,
    }));
  },

  updateNodeConfig(nodeId, config) {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
              },
            }
          : node,
      ),
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
