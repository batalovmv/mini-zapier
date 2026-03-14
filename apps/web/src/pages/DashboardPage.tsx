import type { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WorkflowCardAction } from '../components/dashboard/WorkflowCard';
import { WorkflowList } from '../components/dashboard/WorkflowList';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { getApiErrorMessage } from '../lib/api/client';
import {
  executeWorkflow,
  listWorkflowExecutions,
} from '../lib/api/executions';
import { updateWorkflowStatus } from '../lib/api/workflows';
import { useDashboardStore } from '../stores/dashboard.store';

type LastExecutionsByWorkflowId = Record<string, WorkflowExecutionDto | undefined>;
const ACTIVE_STATUS = 'ACTIVE' as WorkflowDto['status'];
const PAUSED_STATUS = 'PAUSED' as WorkflowDto['status'];

async function fetchLastExecutions(
  workflows: WorkflowDto[],
): Promise<LastExecutionsByWorkflowId> {
  if (workflows.length === 0) {
    return {};
  }

  const results = await Promise.allSettled(
    workflows.map(async (workflow) => {
      const response = await listWorkflowExecutions(workflow.id, {
        page: 1,
        limit: 1,
      });

      return [workflow.id, response.items[0]] as const;
    }),
  );

  const lastExecutions: LastExecutionsByWorkflowId = {};

  for (const result of results) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    const [workflowId, execution] = result.value;
    lastExecutions[workflowId] = execution;
  }

  return lastExecutions;
}

export function DashboardPage() {
  const workflows = useDashboardStore((state) => state.workflows);
  const stats = useDashboardStore((state) => state.stats);
  const loading = useDashboardStore((state) => state.loading);
  const fetchWorkflows = useDashboardStore((state) => state.fetchWorkflows);
  const fetchStats = useDashboardStore((state) => state.fetchStats);
  const deleteWorkflow = useDashboardStore((state) => state.deleteWorkflow);

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [lastExecutions, setLastExecutions] =
    useState<LastExecutionsByWorkflowId>({});
  const [lastExecutionsLoading, setLastExecutionsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    workflowId: string;
    action: WorkflowCardAction;
  } | null>(null);
  const [workflowPendingDelete, setWorkflowPendingDelete] =
    useState<WorkflowDto | null>(null);

  async function refreshDashboardData() {
    setDashboardError(null);
    setLastExecutionsLoading(true);

    try {
      const [loadedWorkflows] = await Promise.all([
        fetchWorkflows(),
        fetchStats(),
      ]);
      const nextLastExecutions = await fetchLastExecutions(loadedWorkflows);

      setLastExecutions(nextLastExecutions);
    } catch (error) {
      setDashboardError(getApiErrorMessage(error));
      setLastExecutions({});
    } finally {
      setLastExecutionsLoading(false);
    }
  }

  useEffect(() => {
    void refreshDashboardData();
  }, []);

  async function handleRun(workflow: WorkflowDto) {
    setPendingAction({
      workflowId: workflow.id,
      action: 'run',
    });

    try {
      await executeWorkflow(workflow.id, {});

      await refreshDashboardData();

      toast.success(`Workflow "${workflow.name}" execution started.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggleStatus(workflow: WorkflowDto) {
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

      await refreshDashboardData();

      toast.success(`Workflow "${workflow.name}" is now ${nextStatus}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  function handleDelete(workflow: WorkflowDto) {
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

      await refreshDashboardData();

      setWorkflowPendingDelete(null);
      toast.success(`Workflow "${workflow.name}" deleted.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  const statsLoading = stats === null && (loading || lastExecutionsLoading);
  const workflowsLoading =
    workflows.length === 0 && (loading || lastExecutionsLoading);
  const refreshing =
    (loading || lastExecutionsLoading) && !(statsLoading || workflowsLoading);

  return (
    <div className="space-y-7 xl:space-y-8">
      <section className="app-panel app-panel-strong overflow-hidden">
        <div className="border-b border-slate-900/10 px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="muted-label">Workflow operations</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.45rem] sm:leading-[1.06]">
                Operate workflows, monitor execution health and launch manual runs.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Monitor workflow health, launch manual runs and manage your automations.
              </p>
            </div>

            <Link
              className="inline-flex self-start rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_32px_-20px_rgba(141,69,20,0.62)] transition hover:bg-amber-700 lg:self-end"
              data-testid="create-workflow-link"
              to="/workflows/new/edit"
            >
              Create Workflow
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

      <StatsOverview
        loading={statsLoading}
        refreshing={refreshing}
        stats={stats}
      />

      <WorkflowList
        lastExecutionsByWorkflowId={lastExecutions}
        loading={workflowsLoading}
        onDelete={handleDelete}
        onRun={handleRun}
        onToggleStatus={handleToggleStatus}
        pendingAction={pendingAction}
        refreshing={refreshing || lastExecutionsLoading}
        workflows={workflows}
      />

      {workflowPendingDelete ? (
        <ConfirmationDialog
          confirmLabel="Delete workflow"
          confirmTone="danger"
          description={`Delete workflow "${workflowPendingDelete.name}"? This action cannot be undone.`}
          onCancel={() => setWorkflowPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
          pending={pendingAction?.action === 'delete'}
          title="Delete workflow?"
        />
      ) : null}
    </div>
  );
}
