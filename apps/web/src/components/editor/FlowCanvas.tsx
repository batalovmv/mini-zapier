import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import toast from 'react-hot-toast';
import ReactFlow, {
  Background,
  type Connection,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlowProvider,
  useOnViewportChange,
  useReactFlow,
  type NodeTypes,
  type Viewport,
} from 'reactflow';

import { useLocale } from '../../locale/LocaleProvider';
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

function hasDroppedNodePayload(event: DragEvent<HTMLDivElement>): boolean {
  return Array.from(event.dataTransfer.types).includes(DRAG_DATA_KEY);
}

function FlowCanvasInner() {
  const { messages } = useLocale();
  const workflowId = useWorkflowEditorStore((state) => state.workflowId);
  const workflowVersion = useWorkflowEditorStore((state) => state.workflowVersion);
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const edges = useWorkflowEditorStore((state) => state.edges);

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
  const dragPreviewDefinition = dragPreview
    ? getNodeDefinition(dragPreview.nodeKind, dragPreview.nodeType)
    : undefined;
  const dragPreviewLabel = dragPreviewDefinition
    ? messages.editorDefinitions[dragPreviewDefinition.id].label
    : null;
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
        handleConnect({
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
  }, [handleConnect]);

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

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDroppedNodePayload(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropActive(true);
    setDragPreview(readDroppedNodePayload(event.dataTransfer));
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
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

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
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
      toast.error(messages.flowCanvas.duplicateTrigger);
    }
  }

  function handleConnect(connection: Connection) {
    const result = onConnect(connection);

    if (!result.ok) {
      toast.error(messages.flowCanvas.connectionRejected[result.code], {
        id: 'editor-connection-rejected',
      });
    }
  }

  return (
    <div className="app-panel editor-canvas-shell relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-9 items-center border-b border-slate-900/10 px-4">
        <span className="app-pill">
          {isEmpty
            ? messages.flowCanvas.stepCounterEmpty
            : messages.flowCanvas.stepCounter(triggerCount, actionCount)}
        </span>
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
        <div className="pointer-events-none absolute inset-4 z-10 rounded-[30px] border border-dashed border-slate-900/12" />

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
          onConnect={handleConnect}
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
            className="!rounded-2xl !border !border-slate-900/10 !bg-white/92 !shadow-lg !backdrop-blur"
            showInteractive={false}
          />
        </ReactFlow>

        {isDropActive ? (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center px-6">
            <div className="app-subpanel px-5 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
              {dragPreviewLabel
                ? messages.flowCanvas.dropSpecific(dragPreviewLabel)
                : messages.flowCanvas.dropGeneric}
            </div>
          </div>
        ) : null}

        {isEmpty ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center px-6 pb-10 pt-10 lg:pt-12">
            <div
              className={`w-full max-w-2xl rounded-[30px] border px-6 py-6 shadow-[0_28px_56px_-40px_rgba(15,23,42,0.38)] transition lg:px-7 lg:py-7 ${
                isDropActive
                  ? 'border-amber-500/40 bg-white/96 shadow-amber-900/10'
                  : 'border-slate-900/12 bg-white/92'
              }`}
            >
              <div>
                <p className="muted-label">{messages.flowCanvas.emptyEditorEyebrow}</p>
                <h3 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-900">
                  {messages.flowCanvas.emptyEditorTitle}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  {messages.flowCanvas.emptyEditorDescription}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/92 px-3 py-1 text-xs font-semibold text-emerald-700">
                    1. {messages.common.nodeKindLabels.trigger}
                  </span>
                  <span className="h-px w-5 bg-slate-300" />
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/92 px-3 py-1 text-xs font-semibold text-sky-700">
                    2. {messages.common.nodeKindLabels.action}
                  </span>
                </div>

                <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-900/16 bg-[rgba(250,246,239,0.82)] px-4 py-4">
                  <p className="muted-label">{messages.flowCanvas.dropZoneEyebrow}</p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">
                    {isDropActive
                      ? messages.flowCanvas.dropZoneTitleActive
                      : messages.flowCanvas.dropZoneTitleIdle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isDropActive
                      ? messages.flowCanvas.dropZoneDescriptionActive
                      : messages.flowCanvas.dropZoneDescriptionIdle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {needsTrigger ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-6">
            <div className="max-w-xl rounded-[26px] border border-amber-200/90 bg-white/94 px-5 py-4 text-sm leading-6 text-slate-700 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.42)]">
              {messages.flowCanvas.needsTrigger}
            </div>
          </div>
        ) : null}

        {needsFirstAction ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-6">
            <div className="max-w-xl rounded-[26px] border border-sky-200/90 bg-white/94 px-5 py-4 text-sm leading-6 text-slate-700 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.42)]">
              {messages.flowCanvas.needsFirstAction}
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


