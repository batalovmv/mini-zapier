import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  getNodeDefinition,
  type EditorNodeKind,
  type EditorNodeType,
  type WorkflowEditorNodeData,
} from './editor-definitions';
import { DRAG_DATA_KEY } from './NodeSidebar';
import { ActionNode } from './nodes/ActionNode';
import { TriggerNode } from './nodes/TriggerNode';

const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
};

interface DroppedNodePayload {
  nodeKind: EditorNodeKind;
  nodeType: EditorNodeType;
}

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };

const emptyStateSteps = [
  {
    step: '1',
    title: 'Pick one trigger first',
    description:
      'Webhook, Cron, or Email becomes the starting point for the workflow.',
  },
  {
    step: '2',
    title: 'Drop it on the canvas',
    description:
      'The canvas is the working surface where the linear flow gets assembled.',
  },
  {
    step: '3',
    title: 'Then add actions',
    description:
      'Chain actions after the trigger and configure each selected node in the right panel.',
  },
];

declare global {
  interface Window {
    __MINI_ZAPIER_TEST__?: {
      connectNodes: (sourceNodeId: string, targetNodeId: string) => void;
    };
  }
}

function readDroppedNodePayload(dataTransfer: DataTransfer): DroppedNodePayload | null {
  const rawPayload = dataTransfer.getData(DRAG_DATA_KEY);

  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as DroppedNodePayload;
  } catch {
    return null;
  }
}

function hasDroppedNodePayload(event: React.DragEvent<HTMLDivElement>): boolean {
  return Array.from(event.dataTransfer.types).includes(DRAG_DATA_KEY);
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
  const dragDepthRef = useRef(0);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dragPreview, setDragPreview] = useState<DroppedNodePayload | null>(null);

  const triggerCount = useMemo(
    () => nodes.filter((node) => node.data.nodeKind === 'trigger').length,
    [nodes],
  );
  const actionCount = nodes.length - triggerCount;
  const selectedNodeLabel =
    selectedNodeId !== null
      ? nodes.find((node) => node.id === selectedNodeId)?.data.label ?? 'Node'
      : null;
  const dragPreviewDefinition = dragPreview
    ? getNodeDefinition(dragPreview.nodeKind, dragPreview.nodeType)
    : undefined;
  const isEmpty = nodes.length === 0;
  const needsTrigger = nodes.length > 0 && triggerCount === 0;
  const needsFirstAction = triggerCount === 1 && actionCount === 0;

  function resetDropState() {
    dragDepthRef.current = 0;
    setIsDropActive(false);
    setDragPreview(null);
  }

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

  useEffect(() => {
    function clearDropState() {
      dragDepthRef.current = 0;
      setIsDropActive(false);
      setDragPreview(null);
    }

    window.addEventListener('dragend', clearDropState);
    window.addEventListener('drop', clearDropState);

    return () => {
      window.removeEventListener('dragend', clearDropState);
      window.removeEventListener('drop', clearDropState);
    };
  }, []);

  const canvasKey =
    workflowId && workflowVersion !== null
      ? `${workflowId}:${workflowVersion}`
      : 'draft-workflow';

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDroppedNodePayload(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropActive(true);
    setDragPreview(readDroppedNodePayload(event.dataTransfer));
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDroppedNodePayload(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDropActive(false);
      setDragPreview(null);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!hasDroppedNodePayload(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (!isDropActive) {
      setIsDropActive(true);
    }

    if (dragPreview === null) {
      setDragPreview(readDroppedNodePayload(event.dataTransfer));
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const payload = readDroppedNodePayload(event.dataTransfer);
    resetDropState();

    if (!payload) {
      return;
    }

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
    <div className="app-panel editor-rail relative flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-5 py-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <p className="muted-label">Workflow Canvas</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {isEmpty ? 'Start with one trigger' : 'Canvas workspace'}
              </h2>
              <span className="rounded-full border border-slate-900/10 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                {isEmpty
                  ? 'Step 1: trigger'
                  : `${triggerCount} trigger${triggerCount === 1 ? '' : 's'} / ${actionCount} action${actionCount === 1 ? '' : 's'}`}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {isEmpty
                ? 'Drop a trigger from the left library to anchor the workflow. After that, add actions that continue the chain.'
                : 'Keep the flow linear: trigger first, then actions. Select any node to configure it in the inspector on the right.'}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-900/10 bg-white/80 px-4 py-4 shadow-sm 2xl:max-w-[260px]">
            <p className="muted-label">Inspector</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {selectedNodeLabel ? `Editing: ${selectedNodeLabel}` : 'No node selected'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedNodeLabel
                ? 'The selected step can be configured in the right panel.'
                : 'Select a node on the canvas to open its settings and connection controls.'}
            </p>
          </div>
        </div>
      </div>

      <div
        data-testid="workflow-canvas-dropzone"
        className={`editor-canvas-surface relative min-h-0 flex-1 ${
          isEmpty ? 'editor-canvas-surface-empty' : ''
        } ${isDropActive ? 'editor-canvas-surface-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="pointer-events-none absolute inset-4 z-10 rounded-[30px] border border-dashed border-slate-900/10" />

        <ReactFlow
          className="!bg-transparent"
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
            color="#d6dee8"
            gap={20}
            id="canvas-grid-small"
            size={1}
          />
          <Background
            color="#e7edf3"
            gap={96}
            id="canvas-grid-large"
            size={1.5}
          />
          <Controls
            className="!rounded-2xl !border !border-slate-900/10 !bg-white/90 !shadow-lg !backdrop-blur"
            showInteractive={false}
          />
        </ReactFlow>

        {isDropActive ? (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center px-6">
            <div className="rounded-full border border-amber-500/40 bg-white/95 px-5 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-amber-900/10">
              {dragPreviewDefinition
                ? `Release to place ${dragPreviewDefinition.label} here.`
                : 'Release to place the node on the canvas.'}
            </div>
          </div>
        ) : null}

        {isEmpty ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center px-6 pb-10 pt-10 lg:pt-12">
            <div
              className={`w-full max-w-4xl rounded-[34px] border px-6 py-6 shadow-2xl transition lg:px-7 lg:py-7 ${
                isDropActive
                  ? 'border-amber-500/40 bg-white/96 shadow-amber-900/10'
                  : 'border-slate-900/10 bg-white/90 shadow-slate-900/10'
              }`}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                <div>
                  <p className="muted-label">Empty editor</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    Build the workflow from left to right
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    The first step is always a trigger. Drop one from the left
                    library to start the workflow, then continue the chain with
                    actions and configure each selected node in the inspector.
                  </p>

                  <div className="mt-5 grid gap-3">
                    {emptyStateSteps.map((item) => (
                      <div
                        key={item.step}
                        className="rounded-[26px] border border-slate-900/10 bg-slate-50/75 px-4 py-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {item.step}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-dashed border-slate-900/15 bg-slate-50/80 px-5 py-5">
                  <p className="muted-label">Canvas drop zone</p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                    {isDropActive
                      ? 'Release to place the node'
                      : 'This surface is the workspace'}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {isDropActive
                      ? 'Drop the node anywhere here. You can move it after placement.'
                      : 'Drag from the left rail into this area. Connections and selection still work the same as before.'}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-black tracking-[0.24em] text-white">
                        TR
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Trigger starts the workflow
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          Choose exactly one starting node.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/90 px-4 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-xs font-black tracking-[0.24em] text-white">
                        AC
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Actions continue the chain
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          Add follow-up steps after the trigger.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {needsTrigger ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-6">
            <div className="max-w-xl rounded-[26px] border border-amber-200 bg-white/92 px-5 py-4 text-sm leading-6 text-slate-700 shadow-lg">
              This canvas still needs a trigger. Add one from the left library
              so the workflow has a valid starting step.
            </div>
          </div>
        ) : null}

        {needsFirstAction ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-6">
            <div className="max-w-xl rounded-[26px] border border-sky-200 bg-white/92 px-5 py-4 text-sm leading-6 text-slate-700 shadow-lg">
              Trigger is in place. Next, drop an action from the left rail and
              connect it to continue the workflow.
            </div>
          </div>
        ) : null}
      </div>
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

