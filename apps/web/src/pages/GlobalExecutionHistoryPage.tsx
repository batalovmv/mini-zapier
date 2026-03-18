import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import { listAllExecutions } from '../lib/api/executions';
import { listWorkflows } from '../lib/api/workflows';
import type {
  ExecutionCounts,
  ExecutionHistoryStatusFilter,
  GlobalExecutionItem,
  GlobalExecutionListResponse,
} from '../lib/api/types';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

const EXECUTIONS_PER_PAGE = 20;
const DEFAULT_STATUS_FILTER: ExecutionHistoryStatusFilter = 'ALL';

interface WorkflowOption {
  id: string;
  name: string;
}

function createEmptyResponse(page = 1): GlobalExecutionListResponse {
  return {
    items: [],
    total: 0,
    page,
    limit: EXECUTIONS_PER_PAGE,
    counts: { all: 0, success: 0, failed: 0, inProgress: 0 },
  };
}

function getExecutionStatusClasses(status: string): string {
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

function truncateId(id: string): string {
  return id.length <= 14 ? id : `${id.slice(0, 8)}...${id.slice(-4)}`;
}

export function GlobalExecutionHistoryPage() {
  const { messages, formatDateTime, formatDurationMs, formatNumber } = useLocale();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] =
    useState<ExecutionHistoryStatusFilter>(DEFAULT_STATUS_FILTER);
  const [workflowFilter, setWorkflowFilter] = useState<string>('');
  const [response, setResponse] = useState<GlobalExecutionListResponse>(
    () => createEmptyResponse(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);

  const requestRef = useRef(0);

  useEffect(() => {
    listWorkflows({ limit: 200 })
      .then((res) =>
        setWorkflows(res.items.map((w) => ({ id: w.id, name: w.name }))),
      )
      .catch(() => {});
  }, []);

  async function loadExecutions(
    targetPage: number,
    targetStatus: ExecutionHistoryStatusFilter,
    targetWorkflow: string,
    background = false,
  ): Promise<void> {
    const requestId = ++requestRef.current;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const res = await listAllExecutions({
        page: targetPage,
        limit: EXECUTIONS_PER_PAGE,
        status: targetStatus === 'ALL' ? undefined : targetStatus,
        workflowId: targetWorkflow || undefined,
      });

      if (requestId !== requestRef.current) return;
      setResponse(res);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(getApiErrorMessage(err, messages.errors));
      if (!background) {
        setResponse(createEmptyResponse(targetPage));
      }
    } finally {
      if (requestId !== requestRef.current) return;
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadExecutions(page, statusFilter, workflowFilter);
  }, [page, statusFilter, workflowFilter]);

  function handleStatusChange(next: ExecutionHistoryStatusFilter): void {
    if (next === statusFilter) return;
    setStatusFilter(next);
    setPage(1);
  }

  function handleWorkflowChange(id: string): void {
    setWorkflowFilter(id);
    setPage(1);
  }

  function getDurationLabel(execution: GlobalExecutionItem): string {
    if (!execution.startedAt) {
      return execution.status === 'PENDING'
        ? messages.executionTable.queued
        : messages.common.emptyValue;
    }

    const startedAt = new Date(execution.startedAt).getTime();
    const finishedAt = execution.completedAt
      ? new Date(execution.completedAt).getTime()
      : Date.now();

    if (Number.isNaN(startedAt) || Number.isNaN(finishedAt) || finishedAt < startedAt) {
      return execution.status === 'RUNNING'
        ? messages.executionTable.running
        : messages.common.emptyValue;
    }

    return formatDurationMs(finishedAt - startedAt);
  }

  const { items, total, counts } = response;
  const totalPages = total === 0 ? 1 : Math.ceil(total / EXECUTIONS_PER_PAGE);
  const hasExecutions = items.length > 0;
  const hasAnyExecutions = counts.all > 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * EXECUTIONS_PER_PAGE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, page * EXECUTIONS_PER_PAGE);

  const filterOptions: Array<{
    value: ExecutionHistoryStatusFilter;
    label: string;
    countKey: keyof ExecutionCounts;
  }> = [
    { value: 'ALL', label: messages.executionTable.filters.all, countKey: 'all' },
    { value: 'SUCCESS', label: messages.executionTable.filters.success, countKey: 'success' },
    { value: 'FAILED', label: messages.executionTable.filters.failed, countKey: 'failed' },
    { value: 'IN_PROGRESS', label: messages.executionTable.filters.inProgress, countKey: 'inProgress' },
  ];

  return (
    <div className="space-y-8">
      <section className="app-panel overflow-hidden">
        <div className="border-b border-slate-900/10 px-8 py-8">
          <p className="muted-label">{messages.globalExecutionHistoryPage.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            {messages.globalExecutionHistoryPage.title}
          </h1>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="app-panel overflow-hidden">
        <div className="border-b border-slate-900/10 px-6 py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="muted-label">{messages.executionTable.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {messages.globalExecutionHistoryPage.tableTitle}
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

            <div className="flex flex-wrap items-center gap-3">
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
                      onClick={() => handleStatusChange(option.value)}
                      type="button"
                    >
                      {option.label} ({formatNumber(counts[option.countKey])})
                    </button>
                  );
                })}
              </div>

              {workflows.length > 0 ? (
                <select
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40"
                  data-testid="execution-workflow-filter"
                  onChange={(e) => handleWorkflowChange(e.target.value)}
                  value={workflowFilter}
                >
                  <option value="">{messages.globalExecutionHistoryPage.allWorkflows}</option>
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              ) : null}
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
              description={messages.globalExecutionHistoryPage.emptyDescription}
              title={messages.globalExecutionHistoryPage.emptyTitle}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-900/10">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    <th className="px-6 py-4">{messages.globalExecutionHistoryPage.columns.workflow}</th>
                    <th className="px-6 py-4">{messages.executionTable.columns.status}</th>
                    <th className="px-6 py-4">{messages.executionTable.columns.id}</th>
                    <th className="px-6 py-4">{messages.executionTable.columns.started}</th>
                    <th className="px-6 py-4">{messages.executionTable.columns.duration}</th>
                    <th className="px-6 py-4">{messages.executionTable.columns.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 bg-white/80 text-sm text-slate-700">
                  {items.map((execution) => (
                    <tr
                      key={execution.id}
                      data-testid={`execution-row-${execution.id}`}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <Link
                          className="font-semibold text-slate-900 hover:text-amber-700"
                          to={`/workflows/${execution.workflowId}/history`}
                        >
                          {execution.workflowName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getExecutionStatusClasses(execution.status)}`}
                        >
                          {messages.common.executionStatusLabels[execution.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {truncateId(execution.id)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(execution.startedAt ?? execution.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getDurationLabel(execution)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
                          to={`/workflows/${execution.workflowId}/history`}
                        >
                          {messages.executionTable.view}
                        </Link>
                      </td>
                    </tr>
                  ))}
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
                  onClick={() => setPage(page - 1)}
                  type="button"
                >
                  {messages.executionTable.previous}
                </button>
                <button
                  className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  type="button"
                >
                  {messages.executionTable.next}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
