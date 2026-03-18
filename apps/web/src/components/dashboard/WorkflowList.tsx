import { useLocale } from '../../locale/LocaleProvider';
import { DashboardWorkflowSummary } from '../../lib/api/types';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { WorkflowCard, WorkflowCardAction } from './WorkflowCard';

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
    <section className="app-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-900/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">{messages.workflowList.eyebrow}</p>
          <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
            {messages.workflowList.title}
          </h2>
        </div>

        <p className="app-chip w-fit">{countLabel}</p>
      </div>

      {loading || totalCount > 0 ? (
        <div className="dashboard-controls-grid mt-4">
          <label className="dashboard-control-field">
            <span className="dashboard-control-label">
              {messages.workflowList.controls.searchLabel}
            </span>
            <input
              className="dashboard-control-input"
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
        <div className="dashboard-controls-footer mt-3">
          <p className="text-sm text-slate-600">
            {messages.workflowList.filteredCount(workflows.length, totalCount)}
          </p>
          <button
            className="dashboard-filter-reset"
            disabled={controlsDisabled}
            onClick={onResetFilters}
            type="button"
          >
            {messages.workflowList.controls.clear}
          </button>
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <LoadingState
            compact
            description={messages.workflowList.loadingDescription}
            title={messages.workflowList.loadingTitle}
          />
        ) : totalCount === 0 ? (
          <EmptyState
            description={messages.workflowList.emptyDescription}
            title={messages.workflowList.emptyTitle}
          />
        ) : workflows.length === 0 ? (
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
        ) : (
          <div className="workflow-list-shell">
            {workflows.map((workflow) => (
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
        )}
      </div>
    </section>
  );
}
