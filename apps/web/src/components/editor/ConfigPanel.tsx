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
import { StepTestSection } from './StepTestSection';

interface ConfigPanelProps {
  workflowId: string | null;
}

export type ConfigUpdater = (
  updater: (prev: Record<string, unknown>) => Record<string, unknown>,
) => void;

const railSectionClass =
  'rounded-[1.55rem] border border-slate-900/10 bg-white/88 px-4 py-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.24)]';
const railSectionMutedClass =
  'rounded-[1.55rem] border border-slate-900/10 bg-[linear-gradient(180deg,rgba(250,246,239,0.94)_0%,rgba(255,255,255,0.84)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]';
const sectionEyebrowClass =
  'text-[11px] font-semibold tracking-[0.16em] text-slate-500';

export function ConfigPanel({ workflowId }: ConfigPanelProps) {
  const { messages } = useLocale();
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const selectedNodeId = useWorkflowEditorStore((state) => state.selectedNodeId);
  const stepTestResults = useWorkflowEditorStore(
    (state) => state.stepTestResults,
  );
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

      setConnections((currentConnections) => [
        ...currentConnections.filter(
          (connection) => connection.id !== createdConnection.id,
        ),
        createdConnection,
      ]);
      setConnectionsError(null);
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
    connectionId: string | null;
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
            connectionId={options.connectionId}
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
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <section className={railSectionMutedClass}>
            <p className={sectionEyebrowClass}>
              {messages.configPanel.emptyEyebrow}
            </p>
            <h2 className="mt-2 text-[1.3rem] font-semibold leading-tight tracking-tight text-slate-900">
              {messages.configPanel.emptyTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {messages.configPanel.emptyDescription}
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
  const selectedConnection =
    selectedNode.data.connectionId === null
      ? null
      : availableConnections.find(
          (connection) => connection.id === selectedNode.data.connectionId,
        ) ?? null;
  const existingStepTestResult = stepTestResults[selectedNode.id] ?? null;
  const requiresConnection = Boolean(definition?.connectionType);
  const isActionNode = selectedNode.data.nodeKind === 'action';
  const hasConnectionSelected = selectedNode.data.connectionId !== null;
  const nodeKindChipClass =
    selectedNode.data.nodeKind === 'trigger'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-sky-200 bg-sky-50 text-sky-700';
  const headerStatusLine =
    requiresConnection && !hasConnectionSelected
      ? messages.configPanel.headerConnectionRequired(
          connectionTypeLabel ?? definition?.connectionType ?? '',
        )
      : isActionNode && !workflowId
        ? messages.configPanel.headerSaveToTest
        : existingStepTestResult
          ? existingStepTestResult.status === 'SUCCESS'
            ? messages.configPanel.headerLastTestSuccess
            : messages.configPanel.headerLastTestFailed
          : hasConnectionSelected
            ? selectedConnection
              ? messages.configPanel.headerConnectionSelected(
                  selectedConnection.name,
                )
              : messages.configPanel.headerConnectionSelectedFallback
            : messages.configPanel.headerMainFields;

  return (
    <>
      <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-900/10 px-5 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.42rem] font-semibold leading-tight tracking-tight text-slate-900">
                {selectedNodeLabel}
              </h2>
              <span className={`app-pill ${nodeKindChipClass}`}>
                {messages.common.nodeKindLabels[selectedNode.data.nodeKind]}
              </span>
            </div>
            <p
              className="mt-2 text-sm leading-6 text-slate-600"
              data-testid="config-panel-status-line"
            >
              {headerStatusLine}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {definition?.connectionType ? (
            <section className={railSectionClass}>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                {messages.configPanel.connectionEyebrow}
              </h3>

              <div className="mt-3">
                <select
                  aria-label={messages.configPanel.selectConnection(
                    connectionTypeLabel ?? definition.connectionType,
                  )}
                  className="w-full rounded-[1.15rem] border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
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
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
                  data-testid="create-connection-button"
                  onClick={() => setCreateDialogOpen(true)}
                  type="button"
                >
                  {messages.configPanel.createConnection}
                </button>
                <button
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                  onClick={() => void loadConnections().catch(() => undefined)}
                  type="button"
                >
                  {messages.configPanel.refreshConnections}
                </button>
              </div>

              {loading ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {messages.configPanel.loadingConnectionsDescription}
                </p>
              ) : null}

              {!loading && availableConnections.length === 0 ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {messages.configPanel.noConnectionsDescription(
                    connectionTypeLabel ?? definition.connectionType,
                  )}
                </p>
              ) : null}

              {connectionsError ? (
                <div className="mt-4 rounded-[1.15rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                  {connectionsError}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className={railSectionClass}>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">
              {messages.configPanel.nodeSettingsEyebrow}
            </h3>

            <div key={selectedNode.id} className="mt-3">
              {renderConfigForm({
                workflowId,
                nodeKind: selectedNode.data.nodeKind,
                nodeType: selectedNode.data.nodeType,
                config: selectedNode.data.config,
                onChange: (updater) => updateNodeConfig(selectedNode.id, updater),
                connectionId: selectedNode.data.connectionId ?? null,
              })}
            </div>

            {!definition?.connectionType && connectionsError ? (
              <div className="mt-4 rounded-[1.15rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {connectionsError}
              </div>
            ) : null}
          </section>

          {selectedNode.data.nodeKind === 'action' ? (
            <StepTestSection
              key={selectedNode.id}
              config={selectedNode.data.config}
              connectionId={selectedNode.data.connectionId ?? null}
              nodeId={selectedNode.id}
              nodeType={selectedNode.data.nodeType}
              requiresConnection={requiresConnection}
              workflowId={workflowId}
            />
          ) : null}
        </div>

        <div className="border-t border-slate-900/8 px-5 py-4">
          <div className="flex justify-end">
            <button
              className="text-xs font-semibold text-slate-500 transition hover:text-rose-700"
              data-testid="delete-node-button"
              onClick={() => setDeleteDialogOpen(true)}
              type="button"
            >
              {messages.configPanel.deleteNode}
            </button>
          </div>
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
