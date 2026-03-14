import type { WorkflowExecutionDto } from '@mini-zapier/shared';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ExecutionTable } from '../components/execution/ExecutionTable';
import { StepLogViewer } from '../components/execution/StepLogViewer';
import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import { getExecution, listWorkflowExecutions } from '../lib/api/executions';
import type {
  ExecutionHistoryStatusFilter,
  ExecutionListResponse,
} from '../lib/api/types';

const EXECUTIONS_PER_PAGE = 8;
const POLLING_INTERVAL_MS = 5000;
const DEFAULT_STATUS_FILTER: ExecutionHistoryStatusFilter = 'ALL';
const PENDING_STATUS = 'PENDING' as WorkflowExecutionDto['status'];
const RUNNING_STATUS = 'RUNNING' as WorkflowExecutionDto['status'];
const IN_PROGRESS_STATUSES = new Set<WorkflowExecutionDto['status']>([
  PENDING_STATUS,
  RUNNING_STATUS,
]);

function createEmptyExecutionResponse(page = 1): ExecutionListResponse {
  return {
    items: [],
    total: 0,
    page,
    limit: EXECUTIONS_PER_PAGE,
    counts: {
      all: 0,
      success: 0,
      failed: 0,
      inProgress: 0,
    },
  };
}

export function ExecutionHistoryPage() {
  const { id = 'new' } = useParams();
  const { messages } = useLocale();
  const workflowId = id;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] =
    useState<ExecutionHistoryStatusFilter>(DEFAULT_STATUS_FILTER);
  const [executionsResponse, setExecutionsResponse] = useState<ExecutionListResponse>(
    () => createEmptyExecutionResponse(),
  );
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecutionDto | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);

  async function loadExecutionList(
    targetPage: number,
    targetFilter: ExecutionHistoryStatusFilter,
    background = false,
  ): Promise<void> {
    const requestId = ++listRequestRef.current;

    if (background) {
      setListRefreshing(true);
    } else {
      setListLoading(true);
    }

    setPageError(null);

    try {
      const response = await listWorkflowExecutions(workflowId, {
        page: targetPage,
        limit: EXECUTIONS_PER_PAGE,
        status: targetFilter === 'ALL' ? undefined : targetFilter,
      });

      if (requestId !== listRequestRef.current) {
        return;
      }

      setExecutionsResponse(response);
      setSelectedExecutionId((current) => {
        if (response.items.length === 0) {
          return null;
        }

        if (current && response.items.some((item) => item.id === current)) {
          return current;
        }

        return response.items[0].id;
      });
    } catch (error) {
      if (requestId !== listRequestRef.current) {
        return;
      }

      setPageError(getApiErrorMessage(error, messages.errors));

      if (!background) {
        setExecutionsResponse(createEmptyExecutionResponse(targetPage));
        setSelectedExecutionId(null);
      }
    } finally {
      if (requestId !== listRequestRef.current) {
        return;
      }

      if (background) {
        setListRefreshing(false);
      } else {
        setListLoading(false);
      }
    }
  }

  async function loadExecutionDetail(
    executionId: string,
    background = false,
  ): Promise<void> {
    const requestId = ++detailRequestRef.current;

    if (background) {
      setDetailRefreshing(true);
    } else {
      setDetailLoading(true);
    }

    setDetailError(null);

    try {
      const execution = await getExecution(executionId);

      if (requestId !== detailRequestRef.current) {
        return;
      }

      setSelectedExecution(execution);
    } catch (error) {
      if (requestId !== detailRequestRef.current) {
        return;
      }

      setDetailError(getApiErrorMessage(error, messages.errors));

      if (!background) {
        setSelectedExecution(null);
      }
    } finally {
      if (requestId !== detailRequestRef.current) {
        return;
      }

      if (background) {
        setDetailRefreshing(false);
      } else {
        setDetailLoading(false);
      }
    }
  }

  useEffect(() => {
    listRequestRef.current += 1;
    detailRequestRef.current += 1;
    setPage(1);
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setExecutionsResponse(createEmptyExecutionResponse(1));
    setSelectedExecutionId(null);
    setSelectedExecution(null);
    setPageError(null);
    setDetailError(null);
    setListLoading(true);
    setDetailLoading(false);
    setListRefreshing(false);
    setDetailRefreshing(false);
  }, [workflowId]);

  useEffect(() => {
    if (workflowId === 'new') {
      setListLoading(false);
      setExecutionsResponse(createEmptyExecutionResponse(1));
      setPageError(messages.executionHistoryPage.savedOnlyError);
      return;
    }

    void loadExecutionList(page, statusFilter);
  }, [page, statusFilter, workflowId]);

  useEffect(() => {
    if (!selectedExecutionId) {
      detailRequestRef.current += 1;
      setSelectedExecution(null);
      setDetailLoading(false);
      setDetailRefreshing(false);
      setDetailError(null);
      return;
    }

    void loadExecutionDetail(selectedExecutionId);
  }, [selectedExecutionId]);

  const selectedExecutionStatus =
    selectedExecution?.status ??
    executionsResponse.items.find((execution) => execution.id === selectedExecutionId)
      ?.status;
  const selectedExecutionInProgress =
    selectedExecutionStatus !== undefined &&
    IN_PROGRESS_STATUSES.has(selectedExecutionStatus);
  const hasInProgressExecutions =
    executionsResponse.counts.inProgress > 0 || selectedExecutionInProgress;

  useEffect(() => {
    if (workflowId === 'new' || !hasInProgressExecutions) {
      return;
    }

    const intervalHandle = window.setInterval(() => {
      void loadExecutionList(page, statusFilter, true);

      if (selectedExecutionId && selectedExecutionInProgress) {
        void loadExecutionDetail(selectedExecutionId, true);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalHandle);
    };
  }, [
    hasInProgressExecutions,
    page,
    selectedExecutionId,
    selectedExecutionInProgress,
    statusFilter,
    workflowId,
  ]);

  function handleSelectExecution(executionId: string): void {
    if (executionId === selectedExecutionId) {
      void loadExecutionDetail(executionId, true);
      return;
    }

    setSelectedExecutionId(executionId);
  }

  function handleStatusFilterChange(
    nextFilter: ExecutionHistoryStatusFilter,
  ): void {
    if (nextFilter === statusFilter) {
      return;
    }

    setStatusFilter(nextFilter);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <section className="app-panel overflow-hidden">
        <div className="border-b border-slate-900/10 px-8 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="muted-label">{messages.executionHistoryPage.eyebrow}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {messages.executionHistoryPage.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 px-8 py-6">
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            to="/"
          >
            {messages.executionHistoryPage.backToDashboard}
          </Link>
          <Link
            className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/50 hover:bg-amber-50"
            to={`/workflows/${workflowId}/edit`}
          >
            {messages.executionHistoryPage.openEditor}
          </Link>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <ExecutionTable
          counts={executionsResponse.counts}
          executions={executionsResponse.items}
          limit={executionsResponse.limit}
          loading={listLoading}
          onPageChange={setPage}
          onSelectExecution={handleSelectExecution}
          onStatusFilterChange={handleStatusFilterChange}
          page={executionsResponse.page}
          refreshing={listRefreshing}
          selectedExecutionId={selectedExecutionId}
          statusFilter={statusFilter}
          total={executionsResponse.total}
        />

        <StepLogViewer
          error={detailError}
          execution={selectedExecution}
          loading={detailLoading}
          refreshing={detailRefreshing}
        />
      </section>
    </div>
  );
}
