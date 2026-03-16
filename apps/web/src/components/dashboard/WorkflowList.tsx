import { WorkflowDto, WorkflowExecutionDto } from '@mini-zapier/shared';
import { Link } from 'react-router-dom';

import { useLocale } from '../../locale/LocaleProvider';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
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
  const { messages } = useLocale();

  return (
    <section className="app-panel overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col gap-3 border-b border-slate-900/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">{messages.workflowList.eyebrow}</p>
          <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
            {messages.workflowList.title}
          </h2>
        </div>

        <p className="app-chip w-fit">
          {refreshing && !loading
            ? messages.workflowList.refreshing
            : messages.workflowList.loadedCount(workflows.length)}
        </p>
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingState
            compact
            description={messages.workflowList.loadingDescription}
            title={messages.workflowList.loadingTitle}
          />
        ) : workflows.length === 0 ? (
          <EmptyState
            action={
              <Link
                className="inline-flex rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                to="/workflows/new"
              >
                {messages.workflowList.createWorkflow}
              </Link>
            }
            description={messages.workflowList.emptyDescription}
            title={messages.workflowList.emptyTitle}
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
