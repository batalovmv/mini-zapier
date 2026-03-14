import type {
  ExecutionStepLogDto,
  WorkflowExecutionDto,
} from '@mini-zapier/shared';

import { useLocale } from '../../locale/LocaleProvider';
import type { EditorDefinitionId } from '../editor/editor-definitions';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';

interface StepLogViewerProps {
  execution: WorkflowExecutionDto | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

function getExecutionStatusClasses(status: WorkflowExecutionDto['status']): string {
  switch (status) {
    case 'RUNNING':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'SUCCESS':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'FAILED':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

function getStepStatusClasses(status: ExecutionStepLogDto['status']): string {
  switch (status) {
    case 'RUNNING':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'SUCCESS':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'FAILED':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'SKIPPED':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function truncateExecutionId(id: string): string {
  if (id.length <= 14) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function getStepDefinitionId(nodeType: string): EditorDefinitionId | null {
  switch (nodeType) {
    case 'WEBHOOK':
      return 'trigger:WEBHOOK';
    case 'CRON':
      return 'trigger:CRON';
    case 'HTTP_REQUEST':
      return 'action:HTTP_REQUEST';
    case 'EMAIL':
      return 'action:EMAIL';
    case 'TELEGRAM':
      return 'action:TELEGRAM';
    case 'DB_QUERY':
      return 'action:DB_QUERY';
    case 'DATA_TRANSFORM':
      return 'action:DATA_TRANSFORM';
    default:
      return null;
  }
}

function JsonDisclosure(props: { label: string; value: unknown }) {
  const { label, value } = props;

  return (
    <details
      className="rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4"
      data-json-label={label}
    >
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        {label}
      </summary>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
        {formatJson(value)}
      </pre>
    </details>
  );
}

function StepLogItem(props: {
  step: ExecutionStepLogDto;
  index: number;
  isLast: boolean;
}) {
  const { step, index, isLast } = props;
  const { messages, formatDateTime, formatDurationMs } = useLocale();
  const definitionId = getStepDefinitionId(step.nodeType);
  const stepLabel = definitionId
    ? messages.editorDefinitions[definitionId].label
    : step.nodeLabel;

  return (
    <li className="relative pl-10">
      {!isLast ? (
        <span className="absolute left-[9px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200" />
      ) : null}
      <span className="absolute left-0 top-7 flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-[11px] font-bold text-amber-700">
        {index + 1}
      </span>

      <article
        className="rounded-3xl border border-slate-900/10 bg-white/80 p-5 shadow-panel"
        data-step-label={stepLabel}
        data-testid="step-log-item"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {stepLabel}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getStepStatusClasses(step.status)}`}
              >
                {messages.common.stepStatusLabels[step.status]}
              </span>
              {step.truncated ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  {messages.stepLogViewer.truncated}
                </span>
              ) : null}
            </div>

            <p className="text-sm text-slate-500">{step.nodeType}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1">
              {step.durationMs === null || step.durationMs === undefined
                ? messages.stepLogViewer.durationEmpty
                : messages.stepLogViewer.duration(formatDurationMs(step.durationMs))}
            </span>
            <span className="rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1">
              {messages.stepLogViewer.retryAttempt(step.retryAttempt)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>
            {messages.stepLogViewer.started(
              formatDateTime(step.startedAt ?? step.createdAt),
            )}
          </span>
          <span>{messages.stepLogViewer.completed(formatDateTime(step.completedAt))}</span>
        </div>

        {step.errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {step.errorMessage}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4">
          {step.inputData !== undefined ? (
            <JsonDisclosure
              label={messages.stepLogViewer.inputData}
              value={step.inputData}
            />
          ) : null}
          {step.outputData !== undefined ? (
            <JsonDisclosure
              label={messages.stepLogViewer.outputData}
              value={step.outputData}
            />
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function StepLogViewer({
  execution,
  loading,
  refreshing,
  error,
}: StepLogViewerProps) {
  const { messages, formatDateTime } = useLocale();
  const stepLogs = execution?.stepLogs ?? [];

  return (
    <section className="app-panel overflow-hidden">
      <div className="border-b border-slate-900/10 px-6 py-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="muted-label">{messages.stepLogViewer.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {execution
                ? messages.stepLogViewer.executionTitle(
                    truncateExecutionId(execution.id),
                  )
                : messages.stepLogViewer.emptyTitle}
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            {refreshing && execution
              ? messages.stepLogViewer.refreshing
              : execution
                ? messages.stepLogViewer.loadedCount(stepLogs.length)
                : messages.stepLogViewer.chooseRow}
          </p>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !execution ? (
        <div className="px-6 py-6">
          <LoadingState
            compact
            description={messages.stepLogViewer.loadingDescription}
            title={messages.stepLogViewer.loadingTitle}
          />
        </div>
      ) : !execution ? (
        <div className="px-6 py-10">
          <EmptyState
            description={messages.stepLogViewer.noExecutionDescription}
            title={messages.stepLogViewer.noExecutionTitle}
          />
        </div>
      ) : (
        <div className="space-y-6 px-6 py-6">
          <div className="rounded-3xl border border-slate-900/10 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    data-testid="selected-execution-status"
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getExecutionStatusClasses(execution.status)}`}
                  >
                    {messages.common.executionStatusLabels[execution.status]}
                  </span>
                  <span className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                    {messages.stepLogViewer.workflowVersion(execution.workflowVersion)}
                  </span>
                </div>

                {execution.errorMessage ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {execution.errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 text-sm text-slate-500">
                <p>
                  {messages.stepLogViewer.started(
                    formatDateTime(execution.startedAt ?? execution.createdAt),
                  )}
                </p>
                <p>{messages.stepLogViewer.completed(formatDateTime(execution.completedAt))}</p>
              </div>
            </div>
          </div>

          {stepLogs.length === 0 ? (
            <EmptyState
              description={messages.stepLogViewer.noStepLogsDescription}
              title={messages.stepLogViewer.noStepLogsTitle}
            />
          ) : (
            <ol className="space-y-5">
              {stepLogs.map((step, index) => (
                <StepLogItem
                  key={step.id}
                  index={index}
                  isLast={index === stepLogs.length - 1}
                  step={step}
                />
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
