import type { ConnectionDto, ConnectionType } from '@mini-zapier/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
  createConnection,
  listConnections,
} from '../../lib/api/connections';
import { getApiErrorMessage } from '../../lib/api/client';
import { useLocale } from '../../locale/LocaleProvider';
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

export type ConfigUpdater = (
  updater: (prev: Record<string, unknown>) => Record<string, unknown>,
) => void;

export function ConfigPanel({ workflowId }: ConfigPanelProps) {
  const { messages } = useLocale();
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
  const definitionCopy = definition
    ? messages.editorDefinitions[definition.id]
    : undefined;
  const selectedNodeLabel = definitionCopy?.label ?? selectedNode?.data.label ?? '';
  const selectedNodeDescription =
    definitionCopy?.description ?? messages.configPanel.defaultSelectedDescription;
  const connectionTypeLabel =
    definition?.connectionType
      ? messages.common.connectionTypeLabels[definition.connectionType as ConnectionType]
      : null;

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setConnectionsError(null);

    try {
      const nextConnections = await listConnections();
      setConnections(nextConnections);
      return nextConnections;
    } catch (error) {
      const message = getApiErrorMessage(error, messages.errors);
      setConnectionsError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [messages.errors]);

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
      toast.success(messages.configPanel.connectionCreatedToast(createdConnection.name));
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
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
    toast.success(messages.configPanel.nodeDeletedToast(selectedNodeLabel));
  }

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
            {messages.configPanel.noFormAvailable}
          </p>
        );
    }
  }

  if (!selectedNode) {
    return (
      <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-900/10 px-5 py-5">
          <p className="muted-label">{messages.configPanel.emptyEyebrow}</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.05rem] bg-slate-950 text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.52)]">
              IN
            </span>
            <div className="min-w-0">
              <h2 className="text-[1.58rem] font-semibold tracking-tight text-slate-900">
                {messages.configPanel.emptyTitle}
              </h2>
              <p className="mt-2.5 text-sm leading-6 text-slate-600">
                {messages.configPanel.emptyDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="app-subpanel-muted px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="muted-label">{messages.configPanel.workspaceGuidanceEyebrow}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {messages.configPanel.whatShowsUpDescription}
                </p>
              </div>
              <span className="app-pill">{messages.configPanel.inspectorSteps.length}</span>
            </div>

            <ol className="mt-4 space-y-2.5">
              {messages.configPanel.inspectorSteps.map((item) => (
                <li
                  key={item.step}
                  className="flex items-start gap-3 rounded-[18px] border border-white/70 bg-white/88 px-3.5 py-3 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[24px] border border-slate-900/10 bg-white/92 px-4 py-4 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.18)]">
            <p className="muted-label">{messages.configPanel.whatShowsUpTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {messages.configPanel.whatShowsUpDescription}
            </p>
          </section>
        </div>
      </aside>
    );
  }

  const selectedNodeTone =
    selectedNode.data.nodeKind === 'trigger'
      ? {
          short: 'TR',
          icon: 'bg-emerald-600 text-white',
          chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          meta: 'border-emerald-200/70 bg-emerald-50/55',
        }
      : {
          short: 'AC',
          icon: 'bg-sky-600 text-white',
          chip: 'border-sky-200 bg-sky-50 text-sky-700',
          meta: 'border-sky-200/70 bg-sky-50/55',
        };

  const availableConnections =
    definition?.connectionType === null
      ? []
      : connections.filter(
          (connection) => connection.type === definition?.connectionType,
        );

  return (
    <>
      <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-900/10 px-5 py-5">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.05rem] text-[11px] font-black uppercase tracking-[0.28em] shadow-[0_16px_28px_-18px_rgba(15,23,42,0.36)] ${selectedNodeTone.icon}`}
            >
              {selectedNodeTone.short}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="muted-label">{messages.configPanel.panelEyebrow}</p>
                  <h2 className="mt-2 text-[1.48rem] font-semibold tracking-tight text-slate-900">
                    {selectedNodeLabel}
                  </h2>
                  <p className="mt-2.5 text-sm leading-6 text-slate-600">
                    {selectedNodeDescription}
                  </p>
                </div>
                <span className={`app-pill ${selectedNodeTone.chip}`}>
                  {messages.common.nodeKindLabels[selectedNode.data.nodeKind]}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5">
            <div className={`rounded-[18px] border px-4 py-3 ${selectedNodeTone.meta}`}>
              <p className="muted-label">{messages.configPanel.nodeTypeEyebrow}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedNodeLabel}
              </p>
            </div>
            <div className={`rounded-[18px] border px-4 py-3 ${selectedNodeTone.meta}`}>
              <p className="muted-label">{messages.configPanel.connectionEyebrow}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {connectionTypeLabel
                  ? messages.configPanel.connectionRequired(connectionTypeLabel)
                  : messages.configPanel.noConnectionRequired}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {definition?.connectionType ? (
            <section className="app-subpanel-muted space-y-4 px-4 py-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="muted-label">{messages.configPanel.connectionEyebrow}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {messages.configPanel.connectionSectionDescription(
                        connectionTypeLabel ?? definition.connectionType,
                      )}
                    </p>
                  </div>
                  <span className="app-pill">
                    {availableConnections.length}
                  </span>
                </div>
              </div>

              <label className="block">
                <span className="muted-label">{messages.configPanel.availableConnections}</span>
                <select
                  className="mt-2 w-full rounded-[18px] border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
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
                    {messages.configPanel.selectConnection(
                      connectionTypeLabel ?? definition.connectionType,
                    )}
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
                  {messages.configPanel.requiredType(
                    connectionTypeLabel ?? definition.connectionType,
                  )}
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
                  data-testid="create-connection-button"
                  onClick={() => setCreateDialogOpen(true)}
                  type="button"
                >
                  {messages.configPanel.createConnection}
                </button>
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
                  onClick={() => void loadConnections().catch(() => undefined)}
                  type="button"
                >
                  {messages.configPanel.refreshConnections}
                </button>
              </div>

              {!loading && availableConnections.length === 0 ? (
                <EmptyState
                  description={messages.configPanel.noConnectionsDescription(
                    connectionTypeLabel ?? definition.connectionType,
                  )}
                  title={messages.configPanel.noConnectionsTitle(
                    connectionTypeLabel ?? definition.connectionType,
                  )}
                />
              ) : null}
            </section>
          ) : (
            <div className="rounded-[24px] border border-slate-900/10 bg-white/92 px-4 py-4 text-sm leading-6 text-slate-600 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.16)]">
              {messages.configPanel.noConnectionNeeded}
            </div>
          )}

          <section className="app-subpanel px-4 py-4">
            <div className="mb-4">
              <p className="muted-label">{messages.configPanel.nodeSettingsEyebrow}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {messages.configPanel.nodeSettingsDescription}
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
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {connectionsError}
            </div>
          ) : null}

          {loading ? (
            <LoadingState
              compact
              description={messages.configPanel.loadingConnectionsDescription}
              title={messages.configPanel.loadingConnectionsTitle}
            />
          ) : null}
        </div>

        <div className="border-t border-slate-900/10 px-5 py-5">
          <button
            className="w-full rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
            data-testid="delete-node-button"
            onClick={() => setDeleteDialogOpen(true)}
            type="button"
          >
            {messages.configPanel.deleteNode}
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
          confirmLabel={messages.configPanel.deleteNodeDialogConfirm}
          confirmTone="danger"
          description={messages.configPanel.deleteNodeDialogDescription(
            selectedNodeLabel,
          )}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteNode}
          title={messages.configPanel.deleteNodeDialogTitle}
        />
      ) : null}
    </>
  );
}
