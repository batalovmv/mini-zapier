import { Link } from 'react-router-dom';

import { useLocale } from '../../locale/LocaleProvider';
import {
  DashboardExecutionSummary,
  DashboardWorkflowSummary,
} from '../../lib/api/types';
import { Spinner } from '../ui/Spinner';

export type WorkflowCardAction = 'run' | 'status' | 'delete';

interface WorkflowCardProps {
  workflow: DashboardWorkflowSummary;
  executionLoading: boolean;
  pendingAction: WorkflowCardAction | null;
  onRun: (workflow: DashboardWorkflowSummary) => void;
  onToggleStatus: (workflow: DashboardWorkflowSummary) => void;
  onDelete: (workflow: DashboardWorkflowSummary) => void;
}

type WorkflowStatus = DashboardWorkflowSummary['status'];
type ExecutionStatus = DashboardExecutionSummary['status'];
type RowAttentionReasonKey = 'failed' | 'activeWithoutRuns';

const workflowStatusClassNames = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
} as Record<WorkflowStatus, string>;

const executionDotClassNames = {
  PENDING: 'bg-slate-400',
  RUNNING: 'bg-sky-500',
  SUCCESS: 'bg-emerald-500',
  FAILED: 'bg-rose-500',
} as Record<ExecutionStatus, string>;

const executionTextClassNames = {
  PENDING: 'text-slate-600',
  RUNNING: 'text-sky-700',
  SUCCESS: 'text-emerald-700',
  FAILED: 'text-rose-700',
} as Record<ExecutionStatus, string>;

const attentionReasonClassNames = {
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  activeWithoutRuns: 'border-sky-200 bg-sky-50 text-sky-700',
} as Record<RowAttentionReasonKey, string>;

function getExecutionDisplayTime(execution: DashboardExecutionSummary): string {
  return execution.completedAt ?? execution.startedAt ?? execution.createdAt;
}

function getRowAttentionReason(
  workflow: DashboardWorkflowSummary,
  messages: ReturnType<typeof useLocale>['messages'],
): { key: RowAttentionReasonKey; label: string } | null {
  if (workflow.lastExecution?.status === 'FAILED') {
    return {
      key: 'failed',
      label: messages.workflowCard.attentionReasons.failed,
    };
  }

  if (workflow.status === 'ACTIVE' && workflow.lastExecution === null) {
    return {
      key: 'activeWithoutRuns',
      label: messages.workflowCard.attentionReasons.activeWithoutRuns,
    };
  }

  return null;
}

export function WorkflowCard({
  workflow,
  executionLoading,
  pendingAction,
  onRun,
  onToggleStatus,
  onDelete,
}: WorkflowCardProps) {
  const { messages, formatDateTime, formatNumber } = useLocale();
  const isBusy = pendingAction !== null;
  const attentionReason = getRowAttentionReason(workflow, messages);
  const statusActionLabel =
    workflow.status === 'ACTIVE'
      ? messages.common.pause
      : messages.common.activate;
  const primaryActionLabel =
    workflow.status === 'DRAFT' ? messages.common.edit : messages.common.open;
  const lastExecution = workflow.lastExecution;

  return (
    <article
      className="workflow-list-row lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-5"
      data-attention-reason={attentionReason?.key ?? 'none'}
      data-testid={`dashboard-workflow-row-${workflow.id}`}
      data-workflow-status={workflow.status}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="workflow-heading-row">
              <h3
                className="break-words text-[1rem] font-semibold leading-tight text-slate-950 sm:text-[1.08rem]"
                data-testid={`dashboard-workflow-name-${workflow.id}`}
              >
                {workflow.name}
              </h3>

              <span
                className={`status-pill ${workflowStatusClassNames[workflow.status]}`}
              >
                {messages.common.workflowStatusLabels[workflow.status]}
              </span>

              {attentionReason ? (
                <span
                  className={`workflow-attention-pill ${attentionReasonClassNames[attentionReason.key]}`}
                >
                  {attentionReason.label}
                </span>
              ) : null}
            </div>

            <p className="workflow-summary-clamp mt-1.5 max-w-3xl text-[13px] leading-5 text-slate-600">
              {workflow.description?.trim() || messages.workflowCard.noDescription}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          <div className="workflow-last-run-row">
            <span className="workflow-inline-label">
              {messages.workflowCard.lastExecutionEyebrow}
            </span>
            {executionLoading ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {messages.workflowCard.syncing}
              </span>
            ) : null}

            {executionLoading && !lastExecution ? (
              <span className="workflow-last-run-loading">
                <Spinner size="sm" />
                <span>{messages.workflowCard.loadingLatestExecution}</span>
              </span>
            ) : lastExecution ? (
              <>
                <span
                  className={`inline-flex items-center gap-2 text-sm font-medium ${executionTextClassNames[lastExecution.status]}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${executionDotClassNames[lastExecution.status]}`}
                  />
                  {messages.common.executionStatusLabels[lastExecution.status]}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {formatDateTime(getExecutionDisplayTime(lastExecution))}
                </span>
                <span className="text-xs text-slate-500">
                  {messages.workflowCard.workflowVersion(
                    lastExecution.workflowVersion,
                  )}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">
                {messages.workflowCard.noExecutions}
              </span>
            )}
          </div>

          <div className="workflow-meta-list">
            <span className="workflow-meta-item">
              v{formatNumber(workflow.version)}
            </span>
            <span className="workflow-meta-item">
              {workflow.timezone}
            </span>
            <span className="workflow-meta-item">
              {messages.workflowCard.nodesMeta(workflow.nodeCount)}
            </span>
            <span className="workflow-meta-item">
              {messages.workflowCard.updatedMeta(formatDateTime(workflow.updatedAt))}
            </span>
          </div>
        </div>
      </div>

      <div
        className="workflow-action-stack mt-4 lg:mt-0"
        data-testid={`dashboard-workflow-actions-${workflow.id}`}
      >
        <Link
          className={[
            'workflow-action-primary',
            isBusy ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
          data-testid={`workflow-${workflow.id}-edit`}
          to={`/workflows/${workflow.id}/edit`}
        >
          {primaryActionLabel}
        </Link>

        <button
          className="workflow-action-secondary disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={`workflow-${workflow.id}-run`}
          disabled={isBusy}
          onClick={() => onRun(workflow)}
          type="button"
        >
          {pendingAction === 'run'
            ? messages.workflowCard.running
            : messages.workflowCard.runManually}
        </button>

        <Link
          className="workflow-action-quiet"
          data-testid={`workflow-${workflow.id}-history`}
          to={`/workflows/${workflow.id}/history`}
        >
          {messages.common.history}
        </Link>

        <button
          className="workflow-action-muted disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={`workflow-${workflow.id}-status`}
          disabled={isBusy}
          onClick={() => onToggleStatus(workflow)}
          type="button"
        >
          {pendingAction === 'status'
            ? messages.workflowCard.updating
            : statusActionLabel}
        </button>

        <button
          className="workflow-action-danger disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={`workflow-${workflow.id}-delete`}
          disabled={isBusy}
          onClick={() => onDelete(workflow)}
          type="button"
        >
          {pendingAction === 'delete'
            ? messages.workflowCard.deleting
            : messages.common.delete}
        </button>
      </div>
    </article>
  );
}
