import { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { Link } from 'react-router-dom';

import { WorkflowCard, WorkflowCardAction } from './WorkflowCard';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';

interface WorkflowListProps {
  workflows: WorkflowDto[];
  lastExecutionsByWorkflowId: Record<string, WorkflowExecutionDto | undefined>;
  loading: boolean;
  refreshing: boolean;
  pendingAction: {
    workflowId: string;
    action: WorkflowCardAction;
  } | null;
  onRun: (workflow: WorkflowDto) => void;
  onToggleStatus: (workflow: WorkflowDto) => void;
  onDelete: (workflow: WorkflowDto) => void;
}

export function WorkflowList({
  workflows,
  lastExecutionsByWorkflowId,
  loading,
  refreshing,
  pendingAction,
  onRun,
  onToggleStatus,
  onDelete,
}: WorkflowListProps) {
  return (
    <section className="app-panel p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Workflow list</p>
          <h2 className="mt-2 text-[1.95rem] font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">
            Manage existing workflow definitions
          </h2>
        </div>

        <p className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
          {refreshing && !loading
            ? 'Refreshing workflow cards and latest executions...'
            : `${workflows.length} workflow${workflows.length === 1 ? '' : 's'} loaded`}
        </p>
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingState
            compact
            description="Loading workflows from the API."
            title="Loading workflows..."
          />
        ) : workflows.length === 0 ? (
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                to="/workflows/new/edit"
              >
                Create Workflow
              </Link>
            }
            description="Create the first workflow definition to start receiving triggers and running actions."
            title="Нет workflows"
          />
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                executionLoading={refreshing}
                lastExecution={lastExecutionsByWorkflowId[workflow.id]}
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
