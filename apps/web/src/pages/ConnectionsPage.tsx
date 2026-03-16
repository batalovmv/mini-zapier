import type { ConnectionDto } from '@mini-zapier/shared';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { ConnectionFormDialog } from '../components/connections/ConnectionFormDialog';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import {
  createConnection,
  deleteConnection,
  listConnections,
  updateConnection,
} from '../lib/api/connections';

type ConnectionTypeValue = ConnectionDto['type'];

const CONNECTION_TYPE_ORDER = [
  'WEBHOOK' as ConnectionTypeValue,
  'SMTP' as ConnectionTypeValue,
  'TELEGRAM' as ConnectionTypeValue,
  'POSTGRESQL' as ConnectionTypeValue,
];
const DEFAULT_CREATE_TYPE = 'WEBHOOK' as ConnectionTypeValue;

type DialogState =
  | { mode: 'create'; initialType: ConnectionTypeValue }
  | { mode: 'edit'; connection: ConnectionDto };

export function ConnectionsPage() {
  const { messages, formatDateTime, formatNumber } = useLocale();
  const connectionTypeLabels =
    messages.common.connectionTypeLabels as Record<ConnectionTypeValue, string>;
  const typeDescriptions =
    messages.connectionsPage.typeDescriptions as Record<ConnectionTypeValue, string>;
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConnectionDto | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const sections = useMemo(
    () =>
      CONNECTION_TYPE_ORDER.map((type) => ({
        type,
        items: connections
          .filter((connection) => connection.type === type)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      })),
    [connections],
  );

  async function loadConnections(background = false): Promise<void> {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError(null);

    try {
      const nextConnections = await listConnections();
      setConnections(nextConnections);
    } catch (error) {
      const message = getApiErrorMessage(error, messages.errors);
      setPageError(message);
      if (!background) {
        setConnections([]);
      }
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadConnections();
  }, []);

  async function handleSubmit(payload: {
    name: string;
    type: ConnectionTypeValue;
    credentials?: Record<string, string>;
  }): Promise<void> {
    setSubmitPending(true);

    try {
      if (dialogState?.mode === 'edit') {
        await updateConnection(dialogState.connection.id, {
          name: payload.name,
          ...(payload.credentials ? { credentials: payload.credentials } : {}),
        });
        toast.success(messages.connectionsPage.connectionUpdatedToast(payload.name));
      } else {
        await createConnection({
          name: payload.name,
          type: payload.type,
          credentials: payload.credentials ?? {},
        });
        toast.success(messages.connectionsPage.connectionCreatedToast(payload.name));
      }

      setDialogState(null);
      await loadConnections(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setSubmitPending(false);
    }
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    setDeletePending(true);

    try {
      await deleteConnection(deleteTarget.id);
      toast.success(messages.connectionsPage.connectionDeletedToast(deleteTarget.name));
      setDeleteTarget(null);
      await loadConnections(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="space-y-7 xl:space-y-8">
      <section className="app-panel app-panel-strong overflow-hidden">
        <div className="border-b border-slate-900/10 px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="muted-label">{messages.connectionsPage.eyebrow}</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.45rem] sm:leading-[1.06]">
                {messages.connectionsPage.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                {messages.connectionsPage.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex rounded-full border border-slate-900/10 bg-white/88 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={refreshing}
                onClick={() => void loadConnections(true)}
                type="button"
              >
                {refreshing
                  ? messages.connectionsPage.refreshing
                  : messages.connectionsPage.refresh}
              </button>
              <button
                className="inline-flex rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_32px_-20px_rgba(141,69,20,0.62)] transition hover:bg-amber-700"
                onClick={() =>
                  setDialogState({
                    mode: 'create',
                    initialType: DEFAULT_CREATE_TYPE,
                  })
                }
                type="button"
              >
                {messages.connectionsPage.createConnection}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 py-5 sm:px-7">
          <span className="app-pill">
            {messages.connectionsPage.totalConnections(connections.length)}
          </span>
          <span className="text-sm text-slate-500">
            {loading
              ? messages.connectionsPage.loadingDescription
              : messages.connectionsPage.reuseHint}
          </span>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {loading ? (
        <LoadingState
          description={messages.connectionsPage.loadingDescription}
          title={messages.connectionsPage.loadingTitle}
        />
      ) : connections.length === 0 ? (
        <section className="app-panel overflow-hidden px-6 py-8 sm:px-7 sm:py-9">
          <EmptyState
            action={
              <button
                className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_32px_-20px_rgba(141,69,20,0.62)] transition hover:bg-amber-700"
                onClick={() =>
                  setDialogState({
                    mode: 'create',
                    initialType: DEFAULT_CREATE_TYPE,
                  })
                }
                type="button"
              >
                {messages.connectionsPage.createConnection}
              </button>
            }
            description={messages.connectionsPage.emptyDescription}
            title={messages.connectionsPage.emptyTitle}
          />
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {sections.map((section) => {
            const typeLabel = connectionTypeLabels[section.type];

            return (
              <section key={section.type} className="app-panel overflow-hidden">
                <div className="border-b border-slate-900/10 px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="muted-label">
                        {messages.connectionsPage.sectionEyebrow}
                      </p>
                      <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-slate-900">
                        {typeLabel}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {typeDescriptions[section.type]}
                      </p>
                    </div>
                    <span className="app-pill">{formatNumber(section.items.length)}</span>
                  </div>
                </div>

                <div className="px-5 py-5">
                  {section.items.length === 0 ? (
                    <EmptyState
                      action={
                        <button
                          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-amber-50"
                          onClick={() =>
                            setDialogState({
                              mode: 'create',
                              initialType: section.type,
                            })
                          }
                          type="button"
                        >
                          {messages.connectionsPage.createConnection}
                        </button>
                      }
                      description={messages.connectionsPage.noConnectionsForTypeDescription(typeLabel)}
                      title={messages.connectionsPage.noConnectionsForTypeTitle(typeLabel)}
                    />
                  ) : (
                    <div className="space-y-4">
                      {section.items.map((connection) => {
                        const storedKeys = Object.keys(connection.credentials);

                        return (
                          <article key={connection.id} className="app-subpanel px-4 py-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-lg font-semibold text-slate-900">
                                    {connection.name}
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {messages.connectionsPage.updatedLabel}:{' '}
                                    {formatDateTime(connection.updatedAt)}
                                  </p>
                                </div>
                                <span className="app-chip shrink-0 text-xs font-semibold">
                                  {typeLabel}
                                </span>
                              </div>

                              <div>
                                <p className="muted-label">
                                  {messages.connectionsPage.storedKeysLabel}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {storedKeys.map((key) => (
                                    <span
                                      key={key}
                                      className="app-chip px-3 py-1 text-xs font-semibold"
                                    >
                                      {key}
                                    </span>
                                  ))}
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  {messages.connectionsPage.storedKeysCount(storedKeys.length)}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 border-t border-slate-900/8 pt-3">
                                <button
                                  className="rounded-full border border-slate-900/10 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-amber-50"
                                  onClick={() =>
                                    setDialogState({
                                      mode: 'edit',
                                      connection,
                                    })
                                  }
                                  type="button"
                                >
                                  {messages.connectionsPage.editConnection}
                                </button>
                                <button
                                  className="rounded-full border border-rose-200 bg-rose-50/90 px-3.5 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
                                  onClick={() => setDeleteTarget(connection)}
                                  type="button"
                                >
                                  {messages.connectionsPage.deleteConnection}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {dialogState ? (
        <ConnectionFormDialog
          connection={dialogState.mode === 'edit' ? dialogState.connection : null}
          initialType={dialogState.mode === 'create' ? dialogState.initialType : undefined}
          mode={dialogState.mode}
          onClose={() => setDialogState(null)}
          onSubmit={(payload) => void handleSubmit(payload)}
          pending={submitPending}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmationDialog
          confirmLabel={messages.connectionsPage.deleteDialogConfirm}
          confirmTone="danger"
          description={messages.connectionsPage.deleteDialogDescription(deleteTarget.name)}
          pendingDescription={messages.connectionsPage.deleteDialogPendingDescription(
            deleteTarget.name,
          )}
          pendingLabel={messages.connectionsPage.deleteDialogPendingLabel}
          pendingTitle={messages.connectionsPage.deleteDialogPendingTitle}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDeleteConfirm()}
          pending={deletePending}
          title={messages.connectionsPage.deleteDialogTitle}
        />
      ) : null}
    </div>
  );
}
