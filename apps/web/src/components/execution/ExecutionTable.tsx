import type { WorkflowExecutionDto } from '@mini-zapier/shared';

import type {
  ExecutionCounts,
  ExecutionHistoryStatusFilter,
} from '../../lib/api/types';
import { useLocale } from '../../locale/LocaleProvider';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';

interface ExecutionTableProps {
  counts: ExecutionCounts;
  executions: WorkflowExecutionDto[];
  selectedExecutionId: string | null;
  statusFilter: ExecutionHistoryStatusFilter;
  page: number;
  total: number;
  limit: number;
  loading: boolean;
  refreshing: boolean;
  onPageChange: (page: number) => void;
  onSelectExecution: (executionId: string) => void;
  onStatusFilterChange: (status: ExecutionHistoryStatusFilter) => void;
  onRetry?: (executionId: string) => void;
  retryingExecutionId?: string | null;
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

function truncateExecutionId(id: string): string {
  if (id.length <= 14) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function getEmptyStateCopy(
  messages: ReturnType<typeof useLocale>['messages'],
  statusFilter: ExecutionHistoryStatusFilter,
  hasAnyExecutions: boolean,
): { title: string; description: string } {
  if (!hasAnyExecutions) {
    return {
      title: messages.executionTable.noExecutionsTitle,
      description: messages.executionTable.noExecutionsDescription,
    };
  }

  switch (statusFilter) {
    case 'SUCCESS':
      return {
        title: messages.executionTable.noSuccessTitle,
        description: messages.executionTable.noSuccessDescription,
      };
    case 'FAILED':
      return {
        title: messages.executionTable.noFailedTitle,
        description: messages.executionTable.noFailedDescription,
      };
    case 'IN_PROGRESS':
      return {
        title: messages.executionTable.nothingInProgressTitle,
        description: messages.executionTable.nothingInProgressDescription,
      };
    default:
      return {
        title: messages.executionTable.noExecutionsTitle,
        description: messages.executionTable.noExecutionsDescription,
      };
  }
}

export function ExecutionTable({
  counts,
  executions,
  selectedExecutionId,
  statusFilter,
  page,
  total,
  limit,
  loading,
  refreshing,
  onPageChange,
  onSelectExecution,
  onStatusFilterChange,
  onRetry,
  retryingExecutionId,
}: ExecutionTableProps) {
  const { messages, formatDateTime, formatDurationMs, formatNumber } = useLocale();

  const filterOptions: Array<{
    value: ExecutionHistoryStatusFilter;
    label: string;
    countKey: keyof ExecutionCounts;
  }> = [
    { value: 'ALL', label: messages.executionTable.filters.all, countKey: 'all' },
    {
      value: 'SUCCESS',
      label: messages.executionTable.filters.success,
      countKey: 'success',
    },
    {
      value: 'FAILED',
      label: messages.executionTable.filters.failed,
      countKey: 'failed',
    },
    {
      value: 'IN_PROGRESS',
      label: messages.executionTable.filters.inProgress,
      countKey: 'inProgress',
    },
  ];

  function summarizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return messages.executionTable.nullValue;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim();
      return normalizedValue.length > 0
        ? truncateText(normalizedValue, 28)
        : messages.executionTable.emptyString;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return messages.executionTable.arrayLabel(value.length);
    }

    if (typeof value === 'object') {
      return messages.executionTable.objectFallback;
    }

    return messages.executionTable.payloadFallback;
  }

  function getTriggerSummary(triggerData: unknown): string {
    if (triggerData === null || triggerData === undefined) {
      return messages.executionTable.manualEmptyPayload;
    }

    if (
      typeof triggerData === 'string' ||
      typeof triggerData === 'number' ||
      typeof triggerData === 'boolean'
    ) {
      return summarizeValue(triggerData);
    }

    if (Array.isArray(triggerData)) {
      return triggerData.length === 0
        ? messages.executionTable.arrayLabel(0)
        : truncateText(
            `${messages.executionTable.arrayLabel(triggerData.length)} ${summarizeValue(triggerData[0])}`,
            44,
          );
    }

    if (typeof triggerData === 'object') {
      const entries = Object.entries(triggerData as Record<string, unknown>);

      if (entries.length === 0) {
        return messages.executionTable.manualEmptyPayload;
      }

      return truncateText(
        entries
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${summarizeValue(value)}`)
          .join(' | '),
        44,
      );
    }

    return messages.executionTable.payloadFallback;
  }

  function getDurationLabel(execution: WorkflowExecutionDto): string {
    if (!execution.startedAt) {
      return execution.status === 'PENDING'
        ? messages.executionTable.queued
        : messages.common.emptyValue;
    }

    const startedAt = new Date(execution.startedAt).getTime();
    const finishedAt = execution.completedAt
      ? new Date(execution.completedAt).getTime()
      : Date.now();

    if (
      Number.isNaN(startedAt) ||
      Number.isNaN(finishedAt) ||
      finishedAt < startedAt
    ) {
      return execution.status === 'RUNNING'
        ? messages.executionTable.running
        : messages.common.emptyValue;
    }

    return formatDurationMs(finishedAt - startedAt);
  }

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  const hasExecutions = executions.length > 0;
  const hasAnyExecutions = counts.all > 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, page * limit);
  const emptyStateCopy = getEmptyStateCopy(messages, statusFilter, hasAnyExecutions);

  return (
    <section className="app-panel overflow-hidden">
      <div className="border-b border-slate-900/10 px-6 py-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="muted-label">{messages.executionTable.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                {messages.executionTable.title}
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {refreshing && hasAnyExecutions
                ? messages.executionTable.refreshing
                : total === 0
                  ? hasAnyExecutions
                    ? messages.executionTable.noMatches
                    : messages.executionTable.noneRecorded
                  : messages.executionTable.showingRange(rangeStart, rangeEnd, total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = option.value === statusFilter;

              return (
                <button
                  key={option.value}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-900/10 bg-white text-slate-700 hover:border-amber-500/40 hover:bg-amber-50'
                  }`}
                  data-testid={`execution-filter-${option.value.toLowerCase()}`}
                  onClick={() => onStatusFilterChange(option.value)}
                  type="button"
                >
                  {option.label} ({formatNumber(counts[option.countKey])})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && !hasExecutions ? (
        <div className="px-6 py-6">
          <LoadingState
            compact
            description={messages.executionTable.loadingDescription}
            title={messages.executionTable.loadingTitle}
          />
        </div>
      ) : !hasExecutions ? (
        <div className="px-6 py-10">
          <EmptyState
            description={emptyStateCopy.description}
            title={emptyStateCopy.title}
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-900/10">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <th className="px-6 py-4">{messages.executionTable.columns.id}</th>
                  <th className="px-6 py-4">{messages.executionTable.columns.status}</th>
                  <th className="px-6 py-4">{messages.executionTable.columns.trigger}</th>
                  <th className="px-6 py-4">{messages.executionTable.columns.started}</th>
                  <th className="px-6 py-4">{messages.executionTable.columns.duration}</th>
                  <th className="px-6 py-4">{messages.executionTable.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/10 bg-white/80 text-sm text-slate-700">
                {executions.map((execution) => {
                  const isSelected = selectedExecutionId === execution.id;

                  return (
                    <tr
                      key={execution.id}
                      data-testid={`execution-row-${execution.id}`}
                      className={
                        isSelected ? 'bg-amber-50/60' : 'transition hover:bg-slate-50/80'
                      }
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {truncateExecutionId(execution.id)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getExecutionStatusClasses(execution.status)}`}
                        >
                          {messages.common.executionStatusLabels[execution.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getTriggerSummary(execution.triggerData)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(execution.startedAt ?? execution.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getDurationLabel(execution)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
                            data-testid={`execution-view-${execution.id}`}
                            onClick={() => onSelectExecution(execution.id)}
                            type="button"
                          >
                            {isSelected ? messages.executionTable.viewing : messages.executionTable.view}
                          </button>
                          {execution.status === 'FAILED' && onRetry ? (
                            <button
                              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              data-testid={`execution-retry-${execution.id}`}
                              disabled={retryingExecutionId === execution.id}
                              onClick={() => onRetry(execution.id)}
                              type="button"
                            >
                              {retryingExecutionId === execution.id
                                ? messages.executionTable.retryingBtn
                                : messages.executionTable.retryBtn}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-900/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {messages.executionTable.pageOf(page, totalPages)}
            </p>

            <div className="flex gap-3">
              <button
                className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                type="button"
              >
                {messages.executionTable.previous}
              </button>
              <button
                className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                type="button"
              >
                {messages.executionTable.next}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
