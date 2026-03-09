import { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { Link } from 'react-router-dom';

import { WorkflowCard, WorkflowCardAction } from './WorkflowCard';

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
    <section className="app-panel p-8">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Workflow list</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Manage existing workflow definitions
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          {refreshing && !loading
            ? 'Refreshing workflow cards and latest executions...'
            : `${workflows.length} workflow${workflows.length === 1 ? '' : 's'} loaded`}
        </p>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-6 text-sm text-slate-600">
            Loading workflows from the API...
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No workflows yet
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Create the first workflow definition to start receiving triggers and
              running actions.
            </p>
            <Link
              className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              to="/workflows/new/edit"
            >
              Create Workflow
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
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
