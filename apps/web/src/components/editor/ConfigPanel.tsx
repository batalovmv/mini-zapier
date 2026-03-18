import type {
  ConnectionCatalogItemDto,
  ConnectionDto,
  ConnectionType,
} from '@mini-zapier/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import {
  createConnection,
  getConnection,
} from '../../lib/api/connections';
import { getApiErrorMessage } from '../../lib/api/client';
import { useLocale } from '../../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { ConnectionPicker } from './ConnectionPicker';
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

const railSectionClass = 'editor-inspector-panel px-3.5 py-3.5';
const railSectionMutedClass =
  'editor-inspector-panel editor-inspector-panel-secondary editor-inspector-panel-muted px-3.5 py-3.5';
const sectionEyebrowClass = 'editor-inspector-eyebrow';

function toConnectionCatalogItem(
  connection: ConnectionDto,
): ConnectionCatalogItemDto {
  return {
    id: connection.id,
    name: connection.name,
    type: connection.type,
    usageCount: 0,
    credentialFieldCount: Object.keys(connection.credentials).length,
    updatedAt: connection.updatedAt,
  };
}

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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectionCreating, setConnectionCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConnectionSummary, setSelectedConnectionSummary] =
    useState<ConnectionCatalogItemDto | null>(null);
  const [connectionPickerRefreshToken, setConnectionPickerRefreshToken] =
    useState(0);
  const selectedConnectionRequestIdRef = useRef(0);

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

  useEffect(() => {
    const selectedConnectionId = selectedNode?.data.connectionId ?? null;
    const requiredConnectionType = definition?.connectionType ?? null;

    if (!selectedConnectionId || !requiredConnectionType) {
      selectedConnectionRequestIdRef.current += 1;
      setSelectedConnectionSummary(null);
      return;
    }

    if (
      selectedConnectionSummary?.id === selectedConnectionId &&
      selectedConnectionSummary.type === requiredConnectionType
    ) {
      return;
    }

    const requestId = selectedConnectionRequestIdRef.current + 1;
    selectedConnectionRequestIdRef.current = requestId;

    void getConnection(selectedConnectionId)
      .then((connection) => {
        if (requestId !== selectedConnectionRequestIdRef.current) {
          return;
        }

        if (connection.type !== requiredConnectionType) {
          setSelectedConnectionSummary(null);
          return;
        }

        setSelectedConnectionSummary(toConnectionCatalogItem(connection));
      })
      .catch(() => {
        if (requestId !== selectedConnectionRequestIdRef.current) {
          return;
        }

        setSelectedConnectionSummary(null);
      });
  }, [
    definition?.connectionType,
    selectedConnectionSummary?.id,
    selectedConnectionSummary?.type,
    selectedNode?.data.connectionId,
  ]);

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

      setSelectedConnectionSummary(toConnectionCatalogItem(createdConnection));
      setConnectionPickerRefreshToken((currentToken) => currentToken + 1);
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

  function handleSelectConnection(
    connection: ConnectionCatalogItemDto | null,
  ): void {
    if (!selectedNode) {
      return;
    }

    setSelectedConnectionSummary(connection);
    updateNodeMeta(selectedNode.id, {
      connectionId: connection?.id ?? null,
    });
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
      <aside className="app-panel editor-rail editor-inspector flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <section className={railSectionMutedClass}>
            <p className={sectionEyebrowClass}>
              {messages.configPanel.emptyEyebrow}
            </p>
            <h2 className="mt-1.5 text-[1.22rem] font-semibold leading-tight tracking-tight text-slate-900">
              {messages.configPanel.emptyTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {messages.configPanel.emptyDescription}
            </p>
          </section>
        </div>
      </aside>
    );
  }

  const selectedConnection =
    selectedNode.data.connectionId === null
      ? null
      : selectedConnectionSummary?.id === selectedNode.data.connectionId &&
          selectedConnectionSummary.type === definition?.connectionType
        ? selectedConnectionSummary
        : null;
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
      <aside className="app-panel editor-rail editor-inspector flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-900/8 px-4 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.32rem] font-semibold leading-tight tracking-tight text-slate-900">
                {selectedNodeLabel}
              </h2>
              <span className={`app-pill ${nodeKindChipClass}`}>
                {messages.common.nodeKindLabels[selectedNode.data.nodeKind]}
              </span>
            </div>
            <p
              className="mt-1.5 text-sm leading-6 text-slate-600"
              data-testid="config-panel-status-line"
            >
              {headerStatusLine}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {definition?.connectionType ? (
            <section className={railSectionClass}>
              <div className="editor-inspector-copy">
                <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                  {messages.configPanel.connectionEyebrow}
                </h3>
              </div>

              <div className="mt-3">
                <ConnectionPicker
                  key={selectedNode.id}
                  connectionType={definition.connectionType as ConnectionType}
                  onCreateConnection={() => setCreateDialogOpen(true)}
                  onSelectConnection={handleSelectConnection}
                  refreshToken={connectionPickerRefreshToken}
                  selectedConnectionId={selectedNode.data.connectionId ?? null}
                  selectedConnectionName={selectedConnection?.name ?? null}
                />
              </div>
            </section>
          ) : null}

          <section className={railSectionClass}>
            <div className="editor-inspector-copy">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                {messages.configPanel.nodeSettingsEyebrow}
              </h3>
            </div>

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

        <div className="border-t border-slate-900/8 px-4 py-3.5">
          <div className="flex justify-end">
            <button
              className="editor-inspector-link text-rose-700 hover:text-rose-800"
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
