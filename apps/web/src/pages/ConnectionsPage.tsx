import type {
  ConnectionCatalogItemDto,
  ConnectionCatalogResponseDto,
  ConnectionCatalogSort,
  ConnectionCatalogUsageFilter,
  ConnectionDto,
  ConnectionType,
} from '@mini-zapier/shared';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
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
  getConnection,
  listConnectionsCatalog,
  updateConnection,
} from '../lib/api/connections';

const PAGE_LIMIT = 20;
const DEFAULT_SORT = 'UPDATED_DESC' as ConnectionCatalogSort;
const DEFAULT_USAGE_FILTER = 'ALL' as ConnectionCatalogUsageFilter;
const DEFAULT_CREATE_TYPE = 'WEBHOOK' as ConnectionType;
const ALL_CONNECTION_TYPES = 'ALL' as const;
const CONNECTION_USAGE_FILTER_OPTIONS = [
  'ALL' as ConnectionCatalogUsageFilter,
  'USED' as ConnectionCatalogUsageFilter,
  'UNUSED' as ConnectionCatalogUsageFilter,
] as const;
const CONNECTION_SORT_OPTIONS = [
  'UPDATED_DESC' as ConnectionCatalogSort,
  'UPDATED_ASC' as ConnectionCatalogSort,
  'NAME_ASC' as ConnectionCatalogSort,
  'NAME_DESC' as ConnectionCatalogSort,
  'USAGE_DESC' as ConnectionCatalogSort,
] as const;
const CONNECTION_TYPE_OPTIONS = [
  'WEBHOOK' as ConnectionType,
  'SMTP' as ConnectionType,
  'TELEGRAM' as ConnectionType,
  'POSTGRESQL' as ConnectionType,
] as const;

type ConnectionTypeFilter = ConnectionType | typeof ALL_CONNECTION_TYPES;

type DialogState =
  | { mode: 'create'; initialType: ConnectionType }
  | { mode: 'edit'; connection: ConnectionDto };

function buildCatalogRange(page: number, limit: number, total: number): {
  start: number;
  end: number;
} {
  if (total === 0) {
    return {
      start: 0,
      end: 0,
    };
  }

  return {
    start: (page - 1) * limit + 1,
    end: Math.min(page * limit, total),
  };
}

export function ConnectionsPage() {
  const { messages, formatDateTime, formatNumber } = useLocale();
  const connectionTypeLabels =
    messages.common.connectionTypeLabels as Record<ConnectionType, string>;
  const usageOptionLabels =
    messages.connectionsPage.controls.usageOptions as Record<
      ConnectionCatalogUsageFilter,
      string
    >;
  const sortOptionLabels =
    messages.connectionsPage.controls.sortOptions as Record<
      ConnectionCatalogSort,
      string
    >;

  const [catalog, setCatalog] = useState<ConnectionCatalogResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [submitPending, setSubmitPending] = useState(false);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectionCatalogItemDto | null>(
    null,
  );
  const [deletePending, setDeletePending] = useState(false);

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConnectionTypeFilter>(
    ALL_CONNECTION_TYPES,
  );
  const [usageFilter, setUsageFilter] = useState<ConnectionCatalogUsageFilter>(
    DEFAULT_USAGE_FILTER,
  );
  const [sort, setSort] = useState<ConnectionCatalogSort>(DEFAULT_SORT);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim();
  const requestIdRef = useRef(0);

  async function loadCatalog(background = false): Promise<void> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setCatalog(null);
    }

    setPageError(null);

    try {
      const nextCatalog = await listConnectionsCatalog({
        page,
        limit: PAGE_LIMIT,
        ...(normalizedQuery.length > 0 ? { query: normalizedQuery } : {}),
        ...(typeFilter !== ALL_CONNECTION_TYPES ? { type: typeFilter } : {}),
        ...(usageFilter !== DEFAULT_USAGE_FILTER ? { usage: usageFilter } : {}),
        sort,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const totalPages = Math.max(
        1,
        Math.ceil(nextCatalog.total / nextCatalog.limit),
      );

      if (nextCatalog.total === 0 && nextCatalog.page > 1) {
        setPage(1);
        return;
      }

      if (
        nextCatalog.items.length === 0 &&
        nextCatalog.total > 0 &&
        nextCatalog.page > totalPages
      ) {
        setPage(totalPages);
        return;
      }

      setCatalog(nextCatalog);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message = getApiErrorMessage(error, messages.errors);
      setPageError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, [page, normalizedQuery, sort, typeFilter, usageFilter]);

  async function handleSubmit(payload: {
    name: string;
    type: ConnectionType;
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
      setEditLoadError(null);
      await loadCatalog(true);
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
      await loadCatalog(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setDeletePending(false);
    }
  }

  async function handleEditClick(item: ConnectionCatalogItemDto): Promise<void> {
    setEditLoadingId(item.id);
    setEditLoadError(null);

    try {
      const connection = await getConnection(item.id);
      setDialogState({
        mode: 'edit',
        connection,
      });
    } catch (error) {
      const message = getApiErrorMessage(error, messages.errors);
      setEditLoadError(messages.connectionsPage.editLoadError(item.name));
      toast.error(message);
    } finally {
      setEditLoadingId(null);
    }
  }

  function openCreateDialog(initialType: ConnectionType = DEFAULT_CREATE_TYPE): void {
    setEditLoadError(null);
    setDialogState({
      mode: 'create',
      initialType,
    });
  }

  function resetFilters(): void {
    setQuery('');
    setTypeFilter(ALL_CONNECTION_TYPES);
    setUsageFilter(DEFAULT_USAGE_FILTER);
    setPage(1);
  }

  const items = catalog?.items ?? [];
  const totalConnections = catalog?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalConnections / PAGE_LIMIT));
  const { start: rangeStart, end: rangeEnd } = buildCatalogRange(
    page,
    PAGE_LIMIT,
    totalConnections,
  );
  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    typeFilter !== ALL_CONNECTION_TYPES ||
    usageFilter !== DEFAULT_USAGE_FILTER;
  const showInitialEmptyState =
    !loading &&
    pageError === null &&
    catalog !== null &&
    totalConnections === 0 &&
    !hasActiveFilters;
  const showNoResultsState =
    !loading &&
    pageError === null &&
    catalog !== null &&
    totalConnections === 0 &&
    hasActiveFilters;
  const showPageErrorState = !loading && pageError !== null && catalog === null;
  const controlsDisabled =
    refreshing || submitPending || deletePending || editLoadingId !== null;
  const countLabel =
    refreshing && catalog !== null
      ? messages.connectionsPage.refreshing
      : totalConnections > 0
        ? messages.connectionsPage.showingRange(
            rangeStart,
            rangeEnd,
            totalConnections,
          )
        : messages.connectionsPage.totalConnections(0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="dashboard-panel dashboard-operational-panel app-panel overflow-hidden">
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="muted-label">{messages.connectionsPage.eyebrow}</p>
              <h1 className="mt-1.5 text-[1.9rem] font-semibold tracking-tight text-slate-900 sm:text-[2.05rem] sm:leading-[1.06]">
                {messages.connectionsPage.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-[1.35rem] text-slate-600">
                {messages.connectionsPage.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="dashboard-chip max-w-full whitespace-normal">
                  {messages.connectionsPage.totalConnections(totalConnections)}
                </span>
                <span className="dashboard-chip max-w-full whitespace-normal">
                  {countLabel}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-900/10 bg-white/88 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                disabled={loading || refreshing}
                onClick={() => void loadCatalog(true)}
                type="button"
              >
                {refreshing
                  ? messages.connectionsPage.refreshing
                  : messages.connectionsPage.refresh}
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-22px_rgba(141,69,20,0.54)] transition hover:bg-amber-700 sm:flex-none"
                onClick={() => openCreateDialog()}
                type="button"
              >
                {messages.connectionsPage.createConnection}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel app-panel overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col gap-2.5 border-b border-slate-900/10 pb-3.5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="muted-label">{messages.connectionsPage.resultsEyebrow}</p>
            <h2 className="mt-1.5 text-[1.3rem] font-semibold tracking-tight text-slate-900 sm:text-[1.45rem]">
              {messages.connectionsPage.resultsTitle}
            </h2>
          </div>

          <p className="dashboard-chip w-fit max-w-full whitespace-normal">
            {countLabel}
          </p>
        </div>

        <div className="dashboard-controls-grid mt-3.5">
          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.connectionsPage.controls.searchLabel}
            </span>
            <input
              className="dashboard-control-input"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={messages.connectionsPage.controls.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.connectionsPage.controls.typeLabel}
            </span>
            <select
              className="dashboard-control-input"
              disabled={controlsDisabled}
              onChange={(event) => {
                setTypeFilter(event.target.value as ConnectionTypeFilter);
                setPage(1);
              }}
              value={typeFilter}
            >
              <option value={ALL_CONNECTION_TYPES}>
                {messages.connectionsPage.controls.typeOptions.ALL}
              </option>
              {CONNECTION_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {connectionTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.connectionsPage.controls.usageLabel}
            </span>
            <select
              className="dashboard-control-input"
              disabled={controlsDisabled}
              onChange={(event) => {
                setUsageFilter(
                  event.target.value as ConnectionCatalogUsageFilter,
                );
                setPage(1);
              }}
              value={usageFilter}
            >
              {CONNECTION_USAGE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {usageOptionLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.connectionsPage.controls.sortLabel}
            </span>
            <select
              className="dashboard-control-input"
              disabled={controlsDisabled}
              onChange={(event) => {
                setSort(event.target.value as ConnectionCatalogSort);
                setPage(1);
              }}
              value={sort}
            >
              {CONNECTION_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {sortOptionLabels[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters ? (
          <div className="dashboard-controls-footer mt-2.5">
            <p className="text-sm text-slate-600">
              {messages.connectionsPage.filtersActive}
            </p>
            <button
              className="dashboard-filter-reset"
              disabled={controlsDisabled}
              onClick={resetFilters}
              type="button"
            >
              {messages.connectionsPage.controls.clear}
            </button>
          </div>
        ) : null}

        {pageError && catalog !== null ? (
          <div className="mt-3.5 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        {editLoadError ? (
          <div className="mt-3.5 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {editLoadError}
          </div>
        ) : null}

        <div className="mt-3.5">
          {loading ? (
            <LoadingState
              compact
              description={messages.connectionsPage.loadingDescription}
              title={messages.connectionsPage.loadingTitle}
            />
          ) : showPageErrorState ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
              <h3 className="text-lg font-semibold text-rose-900">
                {messages.connectionsPage.errorTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-rose-700">{pageError}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  className="dashboard-filter-reset"
                  onClick={() => void loadCatalog()}
                  type="button"
                >
                  {messages.connectionsPage.retry}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                  onClick={() => openCreateDialog()}
                  type="button"
                >
                  {messages.connectionsPage.createConnection}
                </button>
              </div>
            </div>
          ) : showInitialEmptyState ? (
            <EmptyState
              action={
                <button
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                  onClick={() => openCreateDialog()}
                  type="button"
                >
                  {messages.connectionsPage.createConnection}
                </button>
              }
              description={messages.connectionsPage.emptyDescription}
              title={messages.connectionsPage.emptyTitle}
            />
          ) : showNoResultsState ? (
            <EmptyState
              action={
                <button
                  className="dashboard-filter-reset"
                  onClick={resetFilters}
                  type="button"
                >
                  {messages.connectionsPage.controls.clear}
                </button>
              }
              description={messages.connectionsPage.noResultsDescription}
              title={messages.connectionsPage.noResultsTitle}
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-[1.35rem] border border-slate-900/10 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <div className="divide-y divide-slate-900/8">
                  {items.map((item) => (
                    <article key={item.id} className="px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                              {item.name}
                            </h3>
                            <span className="app-chip px-3 py-1 text-xs font-semibold">
                              {connectionTypeLabels[item.type]}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-900/8 bg-slate-50/70 px-3.5 py-3">
                              <p className="muted-label">
                                {messages.connectionsPage.typeSummaryLabel}
                              </p>
                              <p className="mt-1.5 font-semibold text-slate-900">
                                {connectionTypeLabels[item.type]}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-900/8 bg-slate-50/70 px-3.5 py-3">
                              <p className="muted-label">
                                {messages.connectionsPage.usageCountLabel}
                              </p>
                              <p className="mt-1.5 font-semibold text-slate-900">
                                {formatNumber(item.usageCount)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-900/8 bg-slate-50/70 px-3.5 py-3">
                              <p className="muted-label">
                                {messages.connectionsPage.credentialFieldCountLabel}
                              </p>
                              <p className="mt-1.5 font-semibold text-slate-900">
                                {formatNumber(item.credentialFieldCount)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-900/8 bg-slate-50/70 px-3.5 py-3">
                              <p className="muted-label">
                                {messages.connectionsPage.updatedLabel}
                              </p>
                              <p className="mt-1.5 font-semibold text-slate-900">
                                {formatDateTime(item.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="workflow-action-stack lg:ml-4 lg:mt-1">
                          <button
                            className="workflow-action-secondary"
                            disabled={controlsDisabled}
                            onClick={() => void handleEditClick(item)}
                            type="button"
                          >
                            {editLoadingId === item.id
                              ? messages.connectionsPage.editLoading
                              : messages.connectionsPage.editConnection}
                          </button>
                          <button
                            className="workflow-action-danger"
                            disabled={deletePending}
                            onClick={() => setDeleteTarget(item)}
                            type="button"
                          >
                            {messages.connectionsPage.deleteConnection}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    {messages.connectionsPage.pageSummary(page, totalPages)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="dashboard-filter-reset"
                      disabled={page === 1 || controlsDisabled}
                      onClick={() => setPage((currentPage) => currentPage - 1)}
                      type="button"
                    >
                      {messages.connectionsPage.previousPage}
                    </button>
                    <button
                      className="dashboard-filter-reset"
                      disabled={page >= totalPages || controlsDisabled}
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      type="button"
                    >
                      {messages.connectionsPage.nextPage}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

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
