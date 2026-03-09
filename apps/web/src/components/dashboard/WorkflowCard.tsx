import type { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { Link } from 'react-router-dom';

export type WorkflowCardAction = 'run' | 'status' | 'delete';

interface WorkflowCardProps {
  workflow: WorkflowDto;
  lastExecution?: WorkflowExecutionDto;
  executionLoading: boolean;
  pendingAction: WorkflowCardAction | null;
  onRun: (workflow: WorkflowDto) => void;
  onToggleStatus: (workflow: WorkflowDto) => void;
  onDelete: (workflow: WorkflowDto) => void;
}

type WorkflowStatus = WorkflowDto['status'];
type ExecutionStatus = WorkflowExecutionDto['status'];

const workflowStatusClassNames = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
} as Record<WorkflowStatus, string>;

const executionStatusClassNames = {
  PENDING: 'border-slate-200 bg-slate-100 text-slate-600',
  RUNNING: 'border-sky-200 bg-sky-50 text-sky-700',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
} as Record<ExecutionStatus, string>;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusActionLabel(status: WorkflowStatus): string {
  return status === 'ACTIVE' ? 'Pause' : 'Activate';
}

export function WorkflowCard({
  workflow,
  lastExecution,
  executionLoading,
  pendingAction,
  onRun,
  onToggleStatus,
  onDelete,
}: WorkflowCardProps) {
  const isBusy = pendingAction !== null;

  return (
    <article className="rounded-3xl border border-slate-900/10 bg-white/90 p-6 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-900">{workflow.name}</h3>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${workflowStatusClassNames[workflow.status]}`}
            >
              {workflow.status}
            </span>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {workflow.description?.trim() || 'No workflow description provided.'}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>Version {workflow.version}</span>
            <span>{workflow.timezone}</span>
            <span>{workflow.nodes.length} nodes</span>
            <span>Updated {formatDateTime(workflow.updatedAt)}</span>
          </div>
        </div>

        <div className="min-w-[14rem] rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4">
          <p className="muted-label">Last execution</p>

          {executionLoading && !lastExecution ? (
            <p className="mt-3 text-sm text-slate-500">Loading latest execution...</p>
          ) : lastExecution ? (
            <div className="mt-3 space-y-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${executionStatusClassNames[lastExecution.status]}`}
              >
                {lastExecution.status}
              </span>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Started {formatDateTime(lastExecution.createdAt)}</p>
                <p>Workflow version {lastExecution.workflowVersion}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No executions recorded yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className={[
            'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700',
            isBusy ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
          to={`/workflows/${workflow.id}/edit`}
        >
          Edit
        </Link>

        <Link
          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
          to={`/workflows/${workflow.id}/history`}
        >
          History
        </Link>

        <button
          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onRun(workflow)}
          type="button"
        >
          {pendingAction === 'run' ? 'Running...' : 'Run'}
        </button>

        <button
          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onToggleStatus(workflow)}
          type="button"
        >
          {pendingAction === 'status'
            ? 'Updating...'
            : getStatusActionLabel(workflow.status)}
        </button>

        <button
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onDelete(workflow)}
          type="button"
        >
          {pendingAction === 'delete' ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
}
