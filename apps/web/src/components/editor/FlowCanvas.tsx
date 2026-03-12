import { useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlowProvider,
  useOnViewportChange,
  useReactFlow,
  type NodeTypes,
  type Viewport,
} from 'reactflow';

import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import { ActionNode } from './nodes/ActionNode';
import { TriggerNode } from './nodes/TriggerNode';
import { DRAG_DATA_KEY } from './NodeSidebar';
import type {
  EditorNodeKind,
  EditorNodeType,
  WorkflowEditorNodeData,
} from './editor-definitions';

const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
};

interface DroppedNodePayload {
  nodeKind: EditorNodeKind;
  nodeType: EditorNodeType;
}

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };

declare global {
  interface Window {
    __MINI_ZAPIER_TEST__?: {
      connectNodes: (sourceNodeId: string, targetNodeId: string) => void;
    };
  }
}

function FlowCanvasInner() {
  const workflowId = useWorkflowEditorStore((state) => state.workflowId);
  const workflowVersion = useWorkflowEditorStore((state) => state.workflowVersion);
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const edges = useWorkflowEditorStore((state) => state.edges);
  const selectedNodeId = useWorkflowEditorStore((state) => state.selectedNodeId);
  const viewport = useWorkflowEditorStore((state) => state.viewport);
  const onNodesChange = useWorkflowEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowEditorStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowEditorStore((state) => state.onConnect);
  const selectNode = useWorkflowEditorStore((state) => state.selectNode);
  const addNode = useWorkflowEditorStore((state) => state.addNode);
  const setViewport = useWorkflowEditorStore((state) => state.setViewport);

  const reactFlow = useReactFlow<WorkflowEditorNodeData>();

  useOnViewportChange({
    onEnd: (nextViewport) => {
      setViewport(nextViewport);
    },
  });

  useEffect(() => {
    const nextViewport = viewport ?? defaultViewport;
    const frameId = window.requestAnimationFrame(() => {
      reactFlow.setViewport(nextViewport, {
        duration: 0,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reactFlow, viewport, workflowId, workflowVersion]);

  useEffect(() => {
    const isAutomatedBrowser = window.navigator.webdriver;

    if (!import.meta.env.DEV && !isAutomatedBrowser) {
      return;
    }

    window.__MINI_ZAPIER_TEST__ = {
      connectNodes(sourceNodeId: string, targetNodeId: string) {
        onConnect({
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: null,
          targetHandle: null,
        });
      },
    };

    return () => {
      delete window.__MINI_ZAPIER_TEST__;
    };
  }, [onConnect]);

  const canvasKey =
    workflowId && workflowVersion !== null
      ? `${workflowId}:${workflowVersion}`
      : 'draft-workflow';

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const rawPayload = event.dataTransfer.getData(DRAG_DATA_KEY);

    if (!rawPayload) {
      return;
    }

    const payload = JSON.parse(rawPayload) as DroppedNodePayload;
    const position = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const result = addNode({
      nodeKind: payload.nodeKind,
      nodeType: payload.nodeType,
      position,
    });

    if (result === 'DUPLICATE_TRIGGER') {
      toast.error('Only one trigger is allowed per workflow.');
    }
  }

  return (
    <div className="app-panel relative h-[780px] overflow-hidden 2xl:h-[820px]">
      <div className="border-b border-slate-900/10 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="muted-label">Workflow Canvas</p>
          <div className="text-sm text-slate-500">
            {selectedNodeId
              ? `Editing: ${nodes.find((n) => n.id === selectedNodeId)?.data?.label ?? 'Node'}`
              : 'Select a node to edit'}
          </div>
        </div>
      </div>

      <div
        data-testid="workflow-canvas-dropzone"
        className="h-[calc(100%-89px)]"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDrop}
      >
        <ReactFlow
          key={canvasKey}
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#0f172a',
            },
            style: {
              stroke: '#0f172a',
              strokeWidth: 1.6,
            },
            type: 'smoothstep',
          }}
          defaultViewport={viewport ?? defaultViewport}
          edges={edges}
          fitView={nodes.length > 0 && viewport === null}
          nodeTypes={nodeTypes}
          nodes={nodes}
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => selectNode(node.id)}
          onNodesChange={onNodesChange}
          onPaneClick={() => selectNode(null)}
        >
          <Background
            color="#cbd5e1"
            gap={18}
            size={1}
          />
          <Controls
            className="!rounded-2xl !border !border-slate-900/10 !bg-white/90 !shadow-lg"
            showInteractive={false}
          />
        </ReactFlow>
      </div>

      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto w-fit rounded-2xl border border-slate-900/10 bg-white/92 px-5 py-3 text-sm text-slate-600 shadow-lg">
          Drag a trigger or action from the left sidebar onto the canvas.
        </div>
      ) : null}
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}



