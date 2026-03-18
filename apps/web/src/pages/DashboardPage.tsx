import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WorkflowCardAction } from '../components/dashboard/WorkflowCard';
import { WorkflowList } from '../components/dashboard/WorkflowList';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import { executeWorkflow } from '../lib/api/executions';
import { DashboardWorkflowSummary } from '../lib/api/types';
import { updateWorkflowStatus } from '../lib/api/workflows';
import { useDashboardStore } from '../stores/dashboard.store';

const ACTIVE_STATUS = 'ACTIVE' as DashboardWorkflowSummary['status'];
const DRAFT_STATUS = 'DRAFT' as DashboardWorkflowSummary['status'];
const PAUSED_STATUS = 'PAUSED' as DashboardWorkflowSummary['status'];

export function DashboardPage() {
  const { messages, formatNumber } = useLocale();
  const workflows = useDashboardStore((state) => state.workflows);
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

  const statsLoading = stats === null && loading;
  const workflowsLoading = workflows.length === 0 && loading;
  const refreshing = loading && !(statsLoading || workflowsLoading);
  const hasDashboardData = stats !== null;

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
    (workflow) =>
      workflow.lastExecution?.status === 'FAILED' ||
      workflow.status === PAUSED_STATUS ||
      (workflow.status === ACTIVE_STATUS && workflow.lastExecution === null) ||
      workflow.status === DRAFT_STATUS,
  ).length;

  const attentionItems = [
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
      key: 'drafts',
      count: draftWorkflowCount,
      label: messages.dashboardPage.attentionItems.drafts.label,
      description: messages.dashboardPage.attentionItems.drafts.description,
      activeClass: 'border-slate-200/90 bg-slate-100/90',
      dotClass: 'bg-slate-500',
      badgeClass: 'border border-slate-200 bg-white text-slate-700',
    },
  ];

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

  return (
    <div className="space-y-5 xl:space-y-6">
      <section className="dashboard-operational-panel app-panel overflow-hidden">
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="muted-label">{messages.dashboardPage.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2.15rem] sm:leading-[1.08]">
                {messages.dashboardPage.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {messages.dashboardPage.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="app-chip">{workflowSummaryLabel}</span>
                <span className="app-chip">{attentionSummaryLabel}</span>
              </div>
            </div>

            <Link
              className="inline-flex self-start rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(141,69,20,0.62)] transition hover:bg-amber-700"
              data-testid="create-workflow-link"
              to="/workflows/new"
            >
              {messages.dashboardPage.createWorkflow}
            </Link>
          </div>
        </div>

        {dashboardError ? (
          <div className="px-6 pb-6 pt-0 sm:px-7 sm:pb-7">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {dashboardError}
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-panel app-panel-strong overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-900/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="muted-label">
              {messages.dashboardPage.attentionEyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
              {messages.dashboardPage.attentionTitle}
            </h2>
          </div>

          <p className="app-chip w-fit">{attentionSummaryLabel}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => {
            const isActive = hasDashboardData && item.count > 0;

            return (
              <article
                key={item.key}
                className={`dashboard-attention-card ${
                  isActive ? item.activeClass : 'border-slate-200/80 bg-white/80'
                }`}
                data-active={isActive}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isActive ? item.dotClass : 'bg-slate-300'
                        }`}
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
                    className={`inline-flex min-w-[3rem] justify-center rounded-full px-3 py-1.5 text-lg font-semibold tracking-tight ${
                      isActive
                        ? item.badgeClass
                        : 'border border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {hasDashboardData
                      ? formatNumber(item.count)
                      : messages.common.emptyValue}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <StatsOverview
        loading={statsLoading}
        refreshing={refreshing}
        stats={stats}
      />

      <WorkflowList
        loading={workflowsLoading}
        onDelete={handleDelete}
        onRun={handleRun}
        onToggleStatus={handleToggleStatus}
        pendingAction={pendingAction}
        refreshing={refreshing}
        workflows={workflows}
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
