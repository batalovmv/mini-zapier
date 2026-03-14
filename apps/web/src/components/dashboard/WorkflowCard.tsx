import type { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { Link } from 'react-router-dom';

import { Spinner } from '../ui/Spinner';

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

const workflowStatusDescriptions = {
  ACTIVE: 'Ready to receive triggers',
  DRAFT: 'Not active yet',
  PAUSED: 'Temporarily paused',
} as Record<WorkflowStatus, string>;

const executionStatusClassNames = {
  PENDING: 'border-slate-200 bg-slate-100 text-slate-600',
  RUNNING: 'border-sky-200 bg-sky-50 text-sky-700',
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
} as Record<ExecutionStatus, string>;

const executionStatusDescriptions = {
  PENDING: 'Queued for processing',
  RUNNING: 'Currently running',
  SUCCESS: 'Finished successfully',
  FAILED: 'Needs attention',
} as Record<ExecutionStatus, string>;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getExecutionDisplayTime(execution: WorkflowExecutionDto): string {
  return execution.completedAt ?? execution.startedAt ?? execution.createdAt;
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
    <article
      className="workflow-card-shell"
      data-workflow-status={workflow.status}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="muted-label">Workflow</p>
              <h3 className="mt-2 text-[1.15rem] font-semibold leading-tight text-slate-950 sm:text-[1.3rem]">
                {workflow.name}
              </h3>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-sm ${workflowStatusClassNames[workflow.status]}`}
            >
              {workflow.status}
            </span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {workflow.description?.trim() || 'No workflow description provided.'}
          </p>

          <dl className="app-subpanel-muted mt-4 grid gap-x-4 gap-y-3 px-4 py-4 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Version
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-700">
                v{workflow.version}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Timezone
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-700">
                {workflow.timezone}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Nodes
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-700">
                {workflow.nodes.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Updated
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-700">
                {formatDateTime(workflow.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="workflow-card-operational">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <section className="workflow-card-metric">
              <p className="muted-label">Workflow status</p>
              <div className="mt-3 flex items-start gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-sm ${workflowStatusClassNames[workflow.status]}`}
                >
                  {workflow.status}
                </span>
                <p className="pt-0.5 text-sm font-medium text-slate-600">
                  {workflowStatusDescriptions[workflow.status]}
                </p>
              </div>
            </section>

            <section className="workflow-card-metric">
              <div className="flex items-center justify-between gap-3">
                <p className="muted-label">Last execution</p>
                {executionLoading ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Syncing
                  </span>
                ) : null}
              </div>

              {executionLoading && !lastExecution ? (
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                  <Spinner size="sm" />
                  <span>Loading latest execution...</span>
                </div>
              ) : lastExecution ? (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-sm ${executionStatusClassNames[lastExecution.status]}`}
                    >
                      {lastExecution.status}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {executionStatusDescriptions[lastExecution.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-950">
                    {formatDateTime(getExecutionDisplayTime(lastExecution))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Workflow version {lastExecution.workflowVersion}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No executions recorded yet.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-900/12 pt-4">
        <Link
          className={[
            'rounded-full border border-slate-900/10 bg-white/88 px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-900/20 hover:bg-white',
            isBusy ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
          data-testid={`workflow-${workflow.id}-edit`}
          to={`/workflows/${workflow.id}/edit`}
        >
          Edit
        </Link>

        <Link
          className="rounded-full border border-slate-900/10 bg-white/88 px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-sky-400/40 hover:bg-sky-50"
          data-testid={`workflow-${workflow.id}-history`}
          to={`/workflows/${workflow.id}/history`}
        >
          History
        </Link>

        <button
          className="rounded-full bg-slate-950 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_18px_28px_-18px_rgba(15,23,42,0.75)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          data-testid={`workflow-${workflow.id}-run`}
          disabled={isBusy}
          onClick={() => onRun(workflow)}
          type="button"
        >
          {pendingAction === 'run' ? 'Running...' : 'Run'}
        </button>

        <button
          className="rounded-full border border-amber-200 bg-amber-50/90 px-3.5 py-2 text-[13px] font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={`workflow-${workflow.id}-status`}
          disabled={isBusy}
          onClick={() => onToggleStatus(workflow)}
          type="button"
        >
          {pendingAction === 'status'
            ? 'Updating...'
            : getStatusActionLabel(workflow.status)}
        </button>

        <button
          className="rounded-full border border-rose-200 bg-rose-50/90 px-3.5 py-2 text-[13px] font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={`workflow-${workflow.id}-delete`}
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
