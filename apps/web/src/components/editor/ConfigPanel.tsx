import type { ConnectionDto, ConnectionType } from '@mini-zapier/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  createConnection,
  listConnections,
} from '../../lib/api/connections';
import { getApiErrorMessage } from '../../lib/api/client';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { ConnectionCreateDialog } from './ConnectionCreateDialog';
import { CronConfig } from './config-forms/CronConfig';
import { DataTransformConfig } from './config-forms/DataTransformConfig';
import { DbQueryConfig } from './config-forms/DbQueryConfig';
import { EmailActionConfig } from './config-forms/EmailActionConfig';
import { EmailTriggerConfig } from './config-forms/EmailTriggerConfig';
import { HttpRequestConfig } from './config-forms/HttpRequestConfig';
import { TelegramConfig } from './config-forms/TelegramConfig';
import { WebhookConfig } from './config-forms/WebhookConfig';
import { getNodeDefinition } from './editor-definitions';

interface ConfigPanelProps {
  workflowId: string | null;
}

const inspectorSteps = [
  {
    step: '1',
    title: 'Drop or select a node',
    description: 'The canvas controls what appears in this inspector.',
  },
  {
    step: '2',
    title: 'Configure its settings',
    description: 'Forms for the selected trigger or action open here.',
  },
  {
    step: '3',
    title: 'Attach a connection when needed',
    description: 'Nodes that use secrets get their connection controls here too.',
  },
];

export type ConfigUpdater = (
  updater: (prev: Record<string, unknown>) => Record<string, unknown>,
) => void;

function renderConfigForm(options: {
  workflowId: string | null;
  nodeKind: string;
  nodeType: string;
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}) {
  const definitionKey = `${options.nodeKind}:${options.nodeType}`;

  switch (definitionKey) {
    case 'trigger:WEBHOOK':
      return <WebhookConfig workflowId={options.workflowId} />;
    case 'trigger:CRON':
      return (
        <CronConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    case 'trigger:EMAIL':
      return <EmailTriggerConfig workflowId={options.workflowId} />;
    case 'action:HTTP_REQUEST':
      return (
        <HttpRequestConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    case 'action:EMAIL':
      return (
        <EmailActionConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    case 'action:TELEGRAM':
      return (
        <TelegramConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    case 'action:DB_QUERY':
      return (
        <DbQueryConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    case 'action:DATA_TRANSFORM':
      return (
        <DataTransformConfig
          config={options.config}
          onChange={options.onChange}
        />
      );
    default:
      return (
        <p className="text-sm leading-6 text-slate-600">
          No editor form is available for this node type.
        </p>
      );
  }
}

export function ConfigPanel({ workflowId }: ConfigPanelProps) {
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const selectedNodeId = useWorkflowEditorStore((state) => state.selectedNodeId);
  const updateNodeConfig = useWorkflowEditorStore(
    (state) => state.updateNodeConfig,
  );
  const updateNodeMeta = useWorkflowEditorStore((state) => state.updateNodeMeta);
  const removeNode = useWorkflowEditorStore((state) => state.removeNode);

  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectionCreating, setConnectionCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const definition = selectedNode
    ? getNodeDefinition(selectedNode.data.nodeKind, selectedNode.data.nodeType)
    : undefined;

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setConnectionsError(null);

    try {
      const nextConnections = await listConnections();
      setConnections(nextConnections);
      return nextConnections;
    } catch (error) {
      const message = getApiErrorMessage(error);
      setConnectionsError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadConnections().catch(() => {
      if (cancelled) {
        return;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadConnections]);

  async function handleCreateConnection(payload: {
    name: string;
    credentials: Record<string, string>;
  }): Promise<void> {
    if (!selectedNode || !definition?.connectionType) {
      return;
    }

    setConnectionCreating(true);

    try {
      const createdConnection = await createConnection({
        name: payload.name,
        type: definition.connectionType as ConnectionType,
        credentials: payload.credentials,
      });

      await loadConnections();
      updateNodeMeta(selectedNode.id, {
        connectionId: createdConnection.id,
      });
      setCreateDialogOpen(false);
      toast.success(`Connection "${createdConnection.name}" created.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setConnectionCreating(false);
    }
  }

  function handleDeleteNode(): void {
    if (!selectedNode) {
      return;
    }

    removeNode(selectedNode.id);
    setDeleteDialogOpen(false);
    toast.success(`Node "${selectedNode.data.label}" deleted.`);
  }

  if (!selectedNode) {
    return (
      <aside className="app-panel editor-rail flex h-full flex-col overflow-hidden">
        <div className="border-b border-slate-900/10 px-5 py-5">
          <p className="muted-label">Config Panel</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Inspector waits for a node
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Select a trigger or action on the canvas to configure it here.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <section className="app-subpanel-muted px-4 py-4">
            <p className="muted-label">Workspace guidance</p>
            <div className="mt-4 space-y-3">
              {inspectorSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-white/70 bg-white/90 px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
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
          </section>

          <section className="app-subpanel px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">
              What shows up here
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Connection selectors for nodes that need credentials, node-specific
              settings, and the remove control for the selected step.
            </p>
          </section>
        </div>
      </aside>
    );
  }

  const availableConnections =
    definition?.connectionType === null
      ? []
      : connections.filter(
          (connection) => connection.type === definition?.connectionType,
        );

  return (
    <>
      <aside className="app-panel editor-rail flex h-full flex-col overflow-hidden">
        <div className="border-b border-slate-900/10 px-5 py-5">
          <p className="muted-label">Config Panel</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {selectedNode.data.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {definition?.description ?? 'Configure the selected node.'}
              </p>
            </div>
            <span
              className={`app-pill ${
                selectedNode.data.nodeKind === 'trigger'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-sky-200 bg-sky-50 text-sky-700'
              }`}
            >
              {selectedNode.data.nodeKind}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="app-subpanel px-4 py-3">
              <p className="muted-label">Node type</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedNode.data.nodeType}
              </p>
            </div>
            <div className="app-subpanel px-4 py-3">
              <p className="muted-label">Connection</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {definition?.connectionType
                  ? `${definition.connectionType} connection required`
                  : 'No connection required'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {definition?.connectionType ? (
            <section className="app-subpanel-muted space-y-4 px-4 py-4">
              <div>
                <p className="muted-label">Connection</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Attach the {definition.connectionType} connection used by this
                  node.
                </p>
              </div>

              <label className="block">
                <span className="muted-label">Available connections</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  data-testid="connection-select"
                  onChange={(event) =>
                    updateNodeMeta(selectedNode.id, {
                      connectionId:
                        event.target.value.length > 0 ? event.target.value : null,
                    })
                  }
                  value={selectedNode.data.connectionId ?? ''}
                >
                  <option value="">
                    Select {definition.connectionType} connection
                  </option>
                  {availableConnections.map((connection) => (
                    <option
                      key={connection.id}
                      value={connection.id}
                    >
                      {connection.name}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  Required type: {definition.connectionType}.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
                  data-testid="create-connection-button"
                  onClick={() => setCreateDialogOpen(true)}
                  type="button"
                >
                  Create connection
                </button>
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
                  onClick={() => void loadConnections().catch(() => undefined)}
                  type="button"
                >
                  Refresh connections
                </button>
              </div>

              {!loading && availableConnections.length === 0 ? (
                <EmptyState
                  description={`No ${definition.connectionType} connection is available yet. Create one here to keep the workflow flow inside the UI.`}
                  title={`No ${definition.connectionType} connections`}
                />
              ) : null}
            </section>
          ) : (
            <div className="app-subpanel-muted px-4 py-4 text-sm leading-6 text-slate-600">
              This node does not require a connection.
            </div>
          )}

          <section className="app-subpanel px-4 py-4">
            <div className="mb-4">
              <p className="muted-label">Node settings</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Configure how this step behaves inside the workflow chain.
              </p>
            </div>

            {renderConfigForm({
              workflowId,
              nodeKind: selectedNode.data.nodeKind,
              nodeType: selectedNode.data.nodeType,
              config: selectedNode.data.config,
              onChange: (updater) => updateNodeConfig(selectedNode.id, updater),
            })}
          </section>

          {connectionsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {connectionsError}
            </div>
          ) : null}

          {loading ? (
            <LoadingState
              compact
              description="The connection list is loading."
              title="Loading connections..."
            />
          ) : null}
        </div>

        <div className="border-t border-slate-900/10 px-5 py-5">
          <button
            className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
            data-testid="delete-node-button"
            onClick={() => setDeleteDialogOpen(true)}
            type="button"
          >
            Delete Node
          </button>
        </div>
      </aside>

      {createDialogOpen && definition?.connectionType ? (
        <ConnectionCreateDialog
          connectionType={definition.connectionType as ConnectionType}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={(payload) => void handleCreateConnection(payload)}
          pending={connectionCreating}
        />
      ) : null}

      {deleteDialogOpen ? (
        <ConfirmationDialog
          confirmLabel="Delete node"
          confirmTone="danger"
          description={`Remove "${selectedNode.data.label}" from the workflow canvas and delete connected edges.`}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteNode}
          title="Delete selected node?"
        />
      ) : null}
    </>
  );
}
