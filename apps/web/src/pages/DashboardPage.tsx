import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WorkflowCardAction } from '../components/dashboard/WorkflowCard';
import {
  WorkflowList,
  WorkflowListAttentionFilter,
  WorkflowListSort,
  WorkflowListStatusFilter,
} from '../components/dashboard/WorkflowList';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { LoadingState } from '../components/ui/LoadingState';
import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import { executeWorkflow } from '../lib/api/executions';
import {
  DashboardRecentExecutionSummary,
  DashboardWorkflowSummary,
} from '../lib/api/types';
import { updateWorkflowStatus } from '../lib/api/workflows';
import { useDashboardStore } from '../stores/dashboard.store';

const ACTIVE_STATUS = 'ACTIVE' as DashboardWorkflowSummary['status'];
const DRAFT_STATUS = 'DRAFT' as DashboardWorkflowSummary['status'];
const PAUSED_STATUS = 'PAUSED' as DashboardWorkflowSummary['status'];
const DEFAULT_WORKFLOW_SORT: WorkflowListSort = 'attention';

type AttentionReasonKey = Exclude<WorkflowListAttentionFilter, 'ALL'>;
type RecentExecutionStatus = DashboardRecentExecutionSummary['status'];

const recentExecutionStatusClassNames = {
  PENDING: 'border-slate-200 bg-slate-100 text-slate-700',
  RUNNING: 'border-sky-200 bg-sky-50 text-sky-700',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
} as Record<RecentExecutionStatus, string>;

const attentionPriority = {
  failed: 0,
  paused: 1,
  draft: 2,
  activeWithoutRuns: 3,
} as const satisfies Record<AttentionReasonKey, number>;

function getExecutionDisplayTime(execution: {
  completedAt?: string | null;
  startedAt?: string | null;
  createdAt: string;
}): string {
  return execution.completedAt ?? execution.startedAt ?? execution.createdAt;
}

function getAttentionReasonKey(
  workflow: DashboardWorkflowSummary,
): AttentionReasonKey | null {
  if (workflow.lastExecution?.status === 'FAILED') {
    return 'failed';
  }

  if (workflow.status === PAUSED_STATUS) {
    return 'paused';
  }

  if (workflow.status === DRAFT_STATUS) {
    return 'draft';
  }

  if (workflow.status === ACTIVE_STATUS && workflow.lastExecution === null) {
    return 'activeWithoutRuns';
  }

  return null;
}

function getUpdatedTimestamp(value: string): number {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function truncateText(value: string, maxLength = 96): string {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function DashboardPage() {
  const { messages, formatDateTime, formatNumber, localeTag } = useLocale();
  const workflows = useDashboardStore((state) => state.workflows);
  const recentExecutions = useDashboardStore((state) => state.recentExecutions);
  const stats = useDashboardStore((state) => state.stats);
  const loading = useDashboardStore((state) => state.loading);
  const fetchDashboardSummary = useDashboardStore(
    (state) => state.fetchDashboardSummary,
  );
  const deleteWorkflow = useDashboardStore((state) => state.deleteWorkflow);

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    workflowId: string;
    action: WorkflowCardAction;
  } | null>(null);
  const [workflowPendingDelete, setWorkflowPendingDelete] =
    useState<DashboardWorkflowSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<WorkflowListStatusFilter>('ALL');
  const [attentionFilter, setAttentionFilter] =
    useState<WorkflowListAttentionFilter>('ALL');
  const [sortBy, setSortBy] = useState<WorkflowListSort>(DEFAULT_WORKFLOW_SORT);

  async function refreshDashboardDataAfterAction(): Promise<void> {
    try {
      await refreshDashboardData();
    } catch {
      // Action already succeeded; refresh errors are shown via page-level state.
    }
  }

  async function refreshDashboardData() {
    setDashboardError(null);

    try {
      await fetchDashboardSummary();
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, messages.errors));
    }
  }

  useEffect(() => {
    void refreshDashboardData();
  }, []);

  async function handleRun(workflow: DashboardWorkflowSummary) {
    setPendingAction({
      workflowId: workflow.id,
      action: 'run',
    });

    try {
      await executeWorkflow(workflow.id, {});
      toast.success(messages.dashboardPage.executionStartedToast(workflow.name));

      await refreshDashboardDataAfterAction();
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggleStatus(workflow: DashboardWorkflowSummary) {
    setPendingAction({
      workflowId: workflow.id,
      action: 'status',
    });

    const nextStatus =
      workflow.status === ACTIVE_STATUS ? PAUSED_STATUS : ACTIVE_STATUS;

    try {
      await updateWorkflowStatus(workflow.id, {
        status: nextStatus,
      });
      toast.success(
        messages.dashboardPage.statusUpdatedToast(
          workflow.name,
          messages.common.workflowStatusLabels[nextStatus],
        ),
      );

      await refreshDashboardDataAfterAction();
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setPendingAction(null);
    }
  }

  function handleDelete(workflow: DashboardWorkflowSummary) {
    setWorkflowPendingDelete(workflow);
  }

  async function confirmDelete(): Promise<void> {
    if (!workflowPendingDelete) {
      return;
    }

    const workflow = workflowPendingDelete;

    setPendingAction({
      workflowId: workflow.id,
      action: 'delete',
    });

    try {
      await deleteWorkflow(workflow.id);
      setWorkflowPendingDelete(null);
      toast.success(messages.dashboardPage.deletedToast(workflow.name));

      await refreshDashboardDataAfterAction();
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setPendingAction(null);
    }
  }

  function resetWorkflowFilters() {
    setSearchQuery('');
    setStatusFilter('ALL');
    setAttentionFilter('ALL');
  }

  const workflowListRef = useRef<HTMLDivElement>(null);

  const handleAttentionCardClick = useCallback(
    (key: AttentionReasonKey) => {
      const isAlreadyActive = isAttentionCardActive(key);

      if (isAlreadyActive) {
        setStatusFilter('ALL');
        setAttentionFilter('ALL');
      } else {
        setSearchQuery('');
        switch (key) {
          case 'failed':
            setStatusFilter('ALL');
            setAttentionFilter('failed');
            break;
          case 'paused':
            setStatusFilter(PAUSED_STATUS);
            setAttentionFilter('ALL');
            break;
          case 'activeWithoutRuns':
            setStatusFilter(ACTIVE_STATUS);
            setAttentionFilter('activeWithoutRuns');
            break;
          case 'draft':
            setStatusFilter(DRAFT_STATUS);
            setAttentionFilter('ALL');
            break;
        }
        workflowListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [statusFilter, attentionFilter],
  );

  function isAttentionCardActive(key: AttentionReasonKey): boolean {
    switch (key) {
      case 'failed':
        return attentionFilter === 'failed';
      case 'paused':
        return statusFilter === PAUSED_STATUS && attentionFilter === 'ALL';
      case 'activeWithoutRuns':
        return statusFilter === ACTIVE_STATUS && attentionFilter === 'activeWithoutRuns';
      case 'draft':
        return statusFilter === DRAFT_STATUS && attentionFilter === 'ALL';
      default:
        return false;
    }
  }

  function getRecentExecutionSummary(
    execution: DashboardRecentExecutionSummary,
  ): string {
    if (execution.status === 'FAILED' && execution.errorMessage?.trim()) {
      return truncateText(execution.errorMessage);
    }

    return messages.dashboardPage.recentActivity.statusDescriptions[
      execution.status
    ];
  }

  const statsLoading = stats === null && loading;
  const workflowsLoading = workflows.length === 0 && loading;
  const refreshing = loading && !(statsLoading || workflowsLoading);
  const hasDashboardData = stats !== null;
  const controlsDisabled = workflowsLoading;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const failedWorkflowCount = workflows.filter(
    (workflow) => workflow.lastExecution?.status === 'FAILED',
  ).length;
  const pausedWorkflowCount = workflows.filter(
    (workflow) => workflow.status === PAUSED_STATUS,
  ).length;
  const activeWithoutRunsCount = workflows.filter(
    (workflow) =>
      workflow.status === ACTIVE_STATUS && workflow.lastExecution === null,
  ).length;
  const draftWorkflowCount = workflows.filter(
    (workflow) => workflow.status === DRAFT_STATUS,
  ).length;
  const workflowsNeedingAttention = workflows.filter(
    (workflow) => getAttentionReasonKey(workflow) !== null,
  ).length;
  const filteredWorkflows = workflows
    .filter((workflow) => {
      if (statusFilter !== 'ALL' && workflow.status !== statusFilter) {
        return false;
      }

      const attentionReason = getAttentionReasonKey(workflow);

      if (attentionFilter !== 'ALL' && attentionReason !== attentionFilter) {
        return false;
      }

      if (normalizedSearchQuery.length === 0) {
        return true;
      }

      const searchableText = `${workflow.name} ${workflow.description ?? ''}`
        .trim()
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    })
    .sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name, localeTag, {
          sensitivity: 'base',
        });
      }

      if (sortBy === 'updated') {
        const updatedDiff =
          getUpdatedTimestamp(right.updatedAt) -
          getUpdatedTimestamp(left.updatedAt);

        return updatedDiff !== 0
          ? updatedDiff
          : left.name.localeCompare(right.name, localeTag, {
              sensitivity: 'base',
            });
      }

      const leftAttentionReason = getAttentionReasonKey(left);
      const rightAttentionReason = getAttentionReasonKey(right);
      const attentionDiff =
        (leftAttentionReason === null
          ? Number.POSITIVE_INFINITY
          : attentionPriority[leftAttentionReason]) -
        (rightAttentionReason === null
          ? Number.POSITIVE_INFINITY
          : attentionPriority[rightAttentionReason]);

      if (attentionDiff !== 0) {
        return attentionDiff;
      }

      const updatedDiff =
        getUpdatedTimestamp(right.updatedAt) -
        getUpdatedTimestamp(left.updatedAt);

      return updatedDiff !== 0
        ? updatedDiff
        : left.name.localeCompare(right.name, localeTag, {
            sensitivity: 'base',
          });
    });
  const recentActivityLoading =
    loading && recentExecutions.length === 0 && dashboardError === null;
  const recentActivityItems = recentExecutions.slice(0, 6);
  const featuredRecentExecution =
    recentActivityItems.length === 1 ? recentActivityItems[0] : null;
  const recentFailuresCount = recentExecutions.filter(
    (execution) => execution.status === 'FAILED',
  ).length;

  const allAttentionItems = [
    {
      key: 'failed',
      count: failedWorkflowCount,
      label: messages.dashboardPage.attentionItems.failed.label,
      description: messages.dashboardPage.attentionItems.failed.description,
      activeClass: 'border-rose-200/80 bg-rose-50/90',
      dotClass: 'bg-rose-500',
      badgeClass: 'border border-rose-200 bg-rose-100 text-rose-700',
    },
    {
      key: 'paused',
      count: pausedWorkflowCount,
      label: messages.dashboardPage.attentionItems.paused.label,
      description: messages.dashboardPage.attentionItems.paused.description,
      activeClass: 'border-amber-200/80 bg-amber-50/90',
      dotClass: 'bg-amber-500',
      badgeClass: 'border border-amber-200 bg-amber-100 text-amber-700',
    },
    {
      key: 'activeWithoutRuns',
      count: activeWithoutRunsCount,
      label: messages.dashboardPage.attentionItems.activeWithoutRuns.label,
      description:
        messages.dashboardPage.attentionItems.activeWithoutRuns.description,
      activeClass: 'border-sky-200/80 bg-sky-50/90',
      dotClass: 'bg-sky-500',
      badgeClass: 'border border-sky-200 bg-sky-100 text-sky-700',
    },
    {
      key: 'draft',
      count: draftWorkflowCount,
      label: messages.dashboardPage.attentionItems.draft.label,
      description: messages.dashboardPage.attentionItems.draft.description,
      activeClass: 'border-slate-200/90 bg-slate-100/90',
      dotClass: 'bg-slate-500',
      badgeClass: 'border border-slate-200 bg-white text-slate-700',
    },
  ];
  const visibleAttentionItems = hasDashboardData
    ? allAttentionItems.filter((item) => item.count > 0)
    : allAttentionItems;
  const allAttentionClear =
    hasDashboardData && visibleAttentionItems.length === 0;

  const workflowSummaryLabel = hasDashboardData
    ? messages.dashboardPage.workflowCount(stats.totalWorkflows)
    : loading
      ? messages.dashboardPage.loadingSummary
      : dashboardError
        ? messages.dashboardPage.summaryUnavailable
        : messages.dashboardPage.workflowCount(0);

  const attentionSummaryLabel = hasDashboardData
    ? refreshing
      ? messages.dashboardPage.attentionRefreshing
      : workflowsNeedingAttention > 0
        ? messages.dashboardPage.needsAttentionSummary(workflowsNeedingAttention)
        : messages.dashboardPage.allClearSummary
    : loading
      ? messages.dashboardPage.attentionLoading
      : dashboardError
        ? messages.dashboardPage.summaryUnavailable
        : messages.dashboardPage.allClearSummary;

  const recentActivityLabel =
    recentActivityLoading && recentExecutions.length === 0
      ? messages.dashboardPage.recentActivity.loading
      : refreshing
        ? messages.dashboardPage.recentActivity.refreshing
        : recentExecutions.length > 0
          ? messages.dashboardPage.recentActivity.summary(
              recentExecutions.length,
              recentFailuresCount,
            )
          : messages.dashboardPage.recentActivity.emptySummary;

  return (
    <div className="space-y-4 sm:space-y-5 xl:space-y-5" data-testid="dashboard-page">
      <section
        className="dashboard-panel dashboard-operational-panel app-panel overflow-hidden"
        data-testid="dashboard-operational-header"
      >
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="muted-label">{messages.dashboardPage.eyebrow}</p>
              <h1 className="mt-1.5 text-[1.9rem] font-semibold tracking-tight text-slate-900 sm:text-[2.05rem] sm:leading-[1.06]">
                {messages.dashboardPage.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-[1.35rem] text-slate-600">
                {messages.dashboardPage.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="dashboard-chip max-w-full whitespace-normal">
                  {workflowSummaryLabel}
                </span>
                <span className="dashboard-chip max-w-full whitespace-normal">
                  {attentionSummaryLabel}
                </span>
              </div>
            </div>

            <Link
              className="inline-flex w-full justify-center self-stretch rounded-full bg-amber-600 px-[1.125rem] py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-22px_rgba(141,69,20,0.54)] transition hover:bg-amber-700 sm:w-auto sm:self-start"
              data-testid="create-workflow-link"
              to="/workflows/new"
            >
              {messages.dashboardPage.createWorkflow}
            </Link>
          </div>
        </div>

        {dashboardError ? (
          <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
            <div
              className="rounded-[1.35rem] border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
              data-testid="dashboard-error"
            >
              {dashboardError}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`dashboard-panel dashboard-panel-strong app-panel app-panel-strong overflow-hidden ${allAttentionClear ? 'px-4 py-3 sm:px-5 sm:py-3.5' : 'p-4 sm:p-5'}`}
        data-testid="dashboard-attention-strip"
      >
        {allAttentionClear ? (
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <p className="text-sm font-medium text-slate-600">
              {messages.dashboardPage.allClearSummary}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 border-b border-slate-900/10 pb-3.5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="muted-label">
                  {messages.dashboardPage.attentionEyebrow}
                </p>
                <h2 className="mt-1.5 text-[1.25rem] font-semibold tracking-tight text-slate-900 sm:text-[1.45rem]">
                  {messages.dashboardPage.attentionTitle}
                </h2>
              </div>

              <p className="dashboard-chip w-fit max-w-full whitespace-normal">
                {attentionSummaryLabel}
              </p>
            </div>

            <div className={`mt-3.5 grid gap-2.5 md:grid-cols-2 ${visibleAttentionItems.length >= 4 ? 'xl:grid-cols-4' : visibleAttentionItems.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
              {visibleAttentionItems.map((item) => {
                const active = isAttentionCardActive(item.key as AttentionReasonKey);
                return (
                <article
                  key={item.key}
                  className={`dashboard-attention-card cursor-pointer transition-shadow hover:shadow-md ${active ? 'ring-2 ring-offset-1 ring-slate-900/20 shadow-md' : ''} ${item.activeClass}`}
                  data-active={active}
                  data-testid={`dashboard-attention-${item.key}`}
                  onClick={() => handleAttentionCardClick(item.key as AttentionReasonKey)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAttentionCardClick(item.key as AttentionReasonKey);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`}
                        />
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                          {item.label}
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`inline-flex min-w-[3rem] justify-center rounded-full px-3 py-1.5 text-lg font-semibold tracking-tight ${item.badgeClass}`}
                    >
                      {formatNumber(item.count)}
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div ref={workflowListRef} className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(18rem,0.9fr)] xl:items-start xl:gap-5">
        <WorkflowList
          attentionFilter={attentionFilter}
          controlsDisabled={controlsDisabled}
          loading={workflowsLoading}
          onAttentionFilterChange={setAttentionFilter}
          onDelete={handleDelete}
          onResetFilters={resetWorkflowFilters}
          onRun={handleRun}
          onSearchQueryChange={setSearchQuery}
          onSortChange={setSortBy}
          onStatusFilterChange={setStatusFilter}
          onToggleStatus={handleToggleStatus}
          pendingAction={pendingAction}
          refreshing={refreshing}
          searchQuery={searchQuery}
          sortBy={sortBy}
          statusFilter={statusFilter}
          totalCount={workflows.length}
          workflows={filteredWorkflows}
        />

        <section
          className="dashboard-panel dashboard-aside-panel app-panel overflow-hidden p-4 sm:p-5 xl:sticky xl:top-6"
          data-testid="dashboard-recent-activity"
        >
          <div className="flex flex-col gap-2.5 border-b border-slate-900/10 pb-3.5">
            <div>
              <p className="muted-label">
                {messages.dashboardPage.recentActivity.eyebrow}
              </p>
              <h2 className="mt-1.5 text-[1.2rem] font-semibold tracking-tight text-slate-900 sm:text-[1.3rem]">
                {messages.dashboardPage.recentActivity.title}
              </h2>
            </div>

            <p className="dashboard-chip w-fit max-w-full whitespace-normal">
              {recentActivityLabel}
            </p>
          </div>

          <div className="mt-3.5">
            {recentActivityLoading ? (
              <div data-testid="dashboard-recent-loading">
                <LoadingState
                  compact
                  description={
                    messages.dashboardPage.recentActivity.loadingDescription
                  }
                  title={messages.dashboardPage.recentActivity.loadingTitle}
                />
              </div>
            ) : recentActivityItems.length === 0 ? (
              <div
                className="dashboard-empty-compact"
                data-testid="dashboard-recent-empty"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {messages.dashboardPage.recentActivity.emptyTitle}
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  {workflows.length > 0
                    ? messages.dashboardPage.recentActivity.emptyDescription
                    : messages.dashboardPage.recentActivity
                        .emptyDescriptionNoWorkflows}
                </p>
              </div>
            ) : featuredRecentExecution ? (
              <Link
                className="dashboard-activity-featured"
                data-status={featuredRecentExecution.status}
                data-testid={`dashboard-recent-execution-${featuredRecentExecution.id}`}
                to={`/workflows/${featuredRecentExecution.workflowId}/history`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`status-pill ${recentExecutionStatusClassNames[featuredRecentExecution.status]}`}
                      >
                        {
                          messages.common.executionStatusLabels[
                            featuredRecentExecution.status
                          ]
                        }
                      </span>
                      <p className="text-base font-semibold text-slate-950">
                        {featuredRecentExecution.workflowName}
                      </p>
                    </div>

                    <p className="mt-2.5 text-sm leading-6 text-slate-600">
                      {getRecentExecutionSummary(featuredRecentExecution)}
                    </p>
                  </div>

                  <div className="dashboard-activity-meta flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="text-xs font-medium text-slate-500">
                      {formatDateTime(
                        getExecutionDisplayTime(featuredRecentExecution),
                      )}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {messages.dashboardPage.recentActivity.openHistory}
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="dashboard-activity-list" data-testid="dashboard-recent-list">
                {recentActivityItems.map((execution) => (
                  <Link
                    key={execution.id}
                    className="dashboard-activity-row"
                    data-status={execution.status}
                    data-testid={`dashboard-recent-execution-${execution.id}`}
                    to={`/workflows/${execution.workflowId}/history`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${recentExecutionStatusClassNames[execution.status]}`}
                        >
                          {messages.common.executionStatusLabels[execution.status]}
                        </span>
                        <p className="text-sm font-semibold text-slate-950 sm:truncate">
                          {execution.workflowName}
                        </p>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {getRecentExecutionSummary(execution)}
                      </p>
                    </div>

                    <div className="dashboard-activity-meta ml-3 flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="text-xs font-medium text-slate-500">
                        {formatDateTime(getExecutionDisplayTime(execution))}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        {messages.dashboardPage.recentActivity.openHistory}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <StatsOverview
        loading={statsLoading}
        refreshing={refreshing}
        stats={stats}
      />

      {workflowPendingDelete ? (
        <ConfirmationDialog
          confirmLabel={messages.dashboardPage.deleteDialogConfirm}
          confirmTone="danger"
          description={messages.dashboardPage.deleteDialogDescription(
            workflowPendingDelete.name,
          )}
          pendingDescription={messages.dashboardPage.deleteDialogPendingDescription(
            workflowPendingDelete.name,
          )}
          pendingLabel={messages.dashboardPage.deleteDialogPendingLabel}
          pendingTitle={messages.dashboardPage.deleteDialogPendingTitle}
          onCancel={() => setWorkflowPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
          pending={pendingAction?.action === 'delete'}
          title={messages.dashboardPage.deleteDialogTitle}
        />
      ) : null}
    </div>
  );
}
