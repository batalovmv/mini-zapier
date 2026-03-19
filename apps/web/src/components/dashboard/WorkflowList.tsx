import { useEffect, useState } from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import { DashboardWorkflowSummary } from '../../lib/api/types';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { WorkflowCard, WorkflowCardAction } from './WorkflowCard';

const PAGE_SIZE = 10;

export type WorkflowListStatusFilter = DashboardWorkflowSummary['status'] | 'ALL';
export type WorkflowListAttentionFilter =
  | 'ALL'
  | 'failed'
  | 'paused'
  | 'draft'
  | 'activeWithoutRuns';
export type WorkflowListSort = 'attention' | 'updated' | 'name';

interface WorkflowListProps {
  workflows: DashboardWorkflowSummary[];
  totalCount: number;
  loading: boolean;
  refreshing: boolean;
  controlsDisabled: boolean;
  searchQuery: string;
  statusFilter: WorkflowListStatusFilter;
  attentionFilter: WorkflowListAttentionFilter;
  sortBy: WorkflowListSort;
  pendingAction: {
    workflowId: string;
    action: WorkflowCardAction;
  } | null;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: WorkflowListStatusFilter) => void;
  onAttentionFilterChange: (value: WorkflowListAttentionFilter) => void;
  onSortChange: (value: WorkflowListSort) => void;
  onResetFilters: () => void;
  onRun: (workflow: DashboardWorkflowSummary) => void;
  onToggleStatus: (workflow: DashboardWorkflowSummary) => void;
  onDelete: (workflow: DashboardWorkflowSummary) => void;
}

export function WorkflowList({
  workflows,
  totalCount,
  loading,
  refreshing,
  controlsDisabled,
  searchQuery,
  statusFilter,
  attentionFilter,
  sortBy,
  pendingAction,
  onSearchQueryChange,
  onStatusFilterChange,
  onAttentionFilterChange,
  onSortChange,
  onResetFilters,
  onRun,
  onToggleStatus,
  onDelete,
}: WorkflowListProps) {
  const { messages } = useLocale();
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, attentionFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(workflows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedWorkflows = workflows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'ALL' ||
    attentionFilter !== 'ALL';
  const countLabel =
    refreshing && !loading
      ? messages.workflowList.refreshing
      : hasActiveFilters
        ? messages.workflowList.filteredCount(workflows.length, totalCount)
        : messages.workflowList.loadedCount(workflows.length);

  return (
    <section
      className="dashboard-panel app-panel overflow-hidden p-4 sm:p-5"
      data-testid="dashboard-workflow-list"
    >
      <div className="flex flex-col gap-2.5 border-b border-slate-900/10 pb-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">{messages.workflowList.eyebrow}</p>
          <h2 className="mt-1.5 text-[1.3rem] font-semibold tracking-tight text-slate-900 sm:text-[1.45rem]">
            {messages.workflowList.title}
          </h2>
        </div>

        <p className="dashboard-chip w-fit max-w-full whitespace-normal">
          {countLabel}
        </p>
      </div>

      {loading || totalCount > 0 ? (
        <div className="dashboard-controls-grid mt-3.5" data-testid="dashboard-controls">
          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.workflowList.controls.searchLabel}
            </span>
            <input
              className="dashboard-control-input"
              data-testid="dashboard-search-input"
              disabled={controlsDisabled}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={messages.workflowList.controls.searchPlaceholder}
              type="search"
              value={searchQuery}
            />
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.workflowList.controls.statusLabel}
            </span>
            <select
              className="dashboard-control-input"
              data-testid="dashboard-status-filter"
              disabled={controlsDisabled}
              onChange={(event) =>
                onStatusFilterChange(
                  event.target.value as WorkflowListStatusFilter,
                )
              }
              value={statusFilter}
            >
              <option value="ALL">
                {messages.workflowList.controls.statusOptions.ALL}
              </option>
              <option value="ACTIVE">
                {messages.workflowList.controls.statusOptions.ACTIVE}
              </option>
              <option value="PAUSED">
                {messages.workflowList.controls.statusOptions.PAUSED}
              </option>
              <option value="DRAFT">
                {messages.workflowList.controls.statusOptions.DRAFT}
              </option>
            </select>
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.workflowList.controls.attentionLabel}
            </span>
            <select
              className="dashboard-control-input"
              data-testid="dashboard-attention-filter"
              disabled={controlsDisabled}
              onChange={(event) =>
                onAttentionFilterChange(
                  event.target.value as WorkflowListAttentionFilter,
                )
              }
              value={attentionFilter}
            >
              <option value="ALL">
                {messages.workflowList.controls.attentionOptions.ALL}
              </option>
              <option value="failed">
                {messages.workflowList.controls.attentionOptions.failed}
              </option>
              <option value="paused">
                {messages.workflowList.controls.attentionOptions.paused}
              </option>
              <option value="draft">
                {messages.workflowList.controls.attentionOptions.draft}
              </option>
              <option value="activeWithoutRuns">
                {
                  messages.workflowList.controls.attentionOptions
                    .activeWithoutRuns
                }
              </option>
            </select>
          </label>

          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.workflowList.controls.sortLabel}
            </span>
            <select
              className="dashboard-control-input"
              data-testid="dashboard-sort-select"
              disabled={controlsDisabled}
              onChange={(event) =>
                onSortChange(event.target.value as WorkflowListSort)
              }
              value={sortBy}
            >
              <option value="attention">
                {messages.workflowList.controls.sortOptions.attention}
              </option>
              <option value="updated">
                {messages.workflowList.controls.sortOptions.updated}
              </option>
              <option value="name">
                {messages.workflowList.controls.sortOptions.name}
              </option>
            </select>
          </label>
        </div>
      ) : null}

      {hasActiveFilters ? (
        <div className="dashboard-controls-footer mt-2.5">
          <p className="text-sm text-slate-600">
            {messages.workflowList.filteredCount(workflows.length, totalCount)}
          </p>
          <button
            className="dashboard-filter-reset"
            data-testid="dashboard-clear-filters"
            disabled={controlsDisabled}
            onClick={onResetFilters}
            type="button"
          >
            {messages.workflowList.controls.clear}
          </button>
        </div>
      ) : null}

      <div className="mt-3.5">
        {loading ? (
          <div data-testid="dashboard-workflow-list-loading">
            <LoadingState
              compact
              description={messages.workflowList.loadingDescription}
              title={messages.workflowList.loadingTitle}
            />
          </div>
        ) : totalCount === 0 ? (
          <div data-testid="dashboard-workflow-list-empty">
            <EmptyState
              description={messages.workflowList.emptyDescription}
              title={messages.workflowList.emptyTitle}
            />
          </div>
        ) : workflows.length === 0 ? (
          <div data-testid="dashboard-workflow-list-no-results">
            <EmptyState
              action={
                <button
                  className="dashboard-filter-reset"
                  onClick={onResetFilters}
                  type="button"
                >
                  {messages.workflowList.controls.clear}
                </button>
              }
              description={messages.workflowList.noResultsDescription}
              title={messages.workflowList.noResultsTitle}
            />
          </div>
        ) : (
          <>
            <div className="workflow-list-shell" data-testid="dashboard-workflow-rows">
              {paginatedWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  executionLoading={refreshing}
                  onDelete={onDelete}
                  onRun={onRun}
                  onToggleStatus={onToggleStatus}
                  pendingAction={
                    pendingAction?.workflowId === workflow.id
                      ? pendingAction.action
                      : null
                  }
                  workflow={workflow}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div
                className="mt-4 flex items-center justify-center gap-3"
                data-testid="dashboard-pagination"
              >
                <button
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="dashboard-pagination-prev"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  {messages.workflowList.pagination.prev}
                </button>
                <span
                  className="text-sm text-slate-600"
                  data-testid="dashboard-pagination-info"
                >
                  {messages.workflowList.pagination.pageOf(safePage, totalPages)}
                </span>
                <button
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="dashboard-pagination-next"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  {messages.workflowList.pagination.next}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
