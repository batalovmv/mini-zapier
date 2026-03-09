import type { ConnectionDto } from '@mini-zapier/shared';
import { useEffect, useMemo, useState } from 'react';

import { listConnections } from '../../lib/api/connections';
import { getApiErrorMessage } from '../../lib/api/client';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
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

function renderConfigForm(options: {
  workflowId: string | null;
  nodeKind: string;
  nodeType: string;
  config: Record<string, unknown>;
  onChange: (nextConfig: Record<string, unknown>) => void;
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

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const definition = selectedNode
    ? getNodeDefinition(selectedNode.data.nodeKind, selectedNode.data.nodeType)
    : undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      setLoading(true);
      setConnectionsError(null);

      try {
        const nextConnections = await listConnections();

        if (!cancelled) {
          setConnections(nextConnections);
        }
      } catch (error) {
        if (!cancelled) {
          setConnectionsError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConnections();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!selectedNode) {
    return (
      <aside className="app-panel flex h-full flex-col justify-between overflow-hidden">
        <div className="px-5 py-5">
          <p className="muted-label">Config Panel</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Select a node
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Click a node on the canvas to configure it. Each node renders the
            form defined in `TASK-015`.
          </p>
        </div>

        <div className="border-t border-slate-900/10 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Supported forms: Webhook, Cron, Email Trigger, HTTP Request, Email,
          Telegram, DB Query, Data Transform.
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
    <aside className="app-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-5 py-5">
        <p className="muted-label">Config Panel</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {selectedNode.data.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {definition?.description ?? 'Configure the selected node.'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
              selectedNode.data.nodeKind === 'trigger'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            {selectedNode.data.nodeKind}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {definition?.connectionType ? (
          <label className="block">
            <span className="muted-label">Connection</span>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
              onChange={(event) =>
                updateNodeMeta(selectedNode.id, {
                  connectionId:
                    event.target.value.length > 0 ? event.target.value : null,
                })
              }
              value={selectedNode.data.connectionId ?? ''}
            >
              <option value="">Select {definition.connectionType} connection</option>
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
        ) : (
          <div className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            This node does not require a connection.
          </div>
        )}

        {renderConfigForm({
          workflowId,
          nodeKind: selectedNode.data.nodeKind,
          nodeType: selectedNode.data.nodeType,
          config: selectedNode.data.config,
          onChange: (nextConfig) => updateNodeConfig(selectedNode.id, nextConfig),
        })}

        {connectionsError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {connectionsError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Loading connections...
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-900/10 px-5 py-5">
        <button
          className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          onClick={() => removeNode(selectedNode.id)}
          type="button"
        >
          Delete Node
        </button>
      </div>
    </aside>
  );
}
