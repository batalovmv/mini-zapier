import type { WorkflowDto } from '@mini-zapier/shared';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ConfigPanel } from '../components/editor/ConfigPanel';
import { FlowCanvas } from '../components/editor/FlowCanvas';
import { NodeSidebar } from '../components/editor/NodeSidebar';
import { LoadingState } from '../components/ui/LoadingState';
import { getApiErrorMessage } from '../lib/api/client';
import { executeWorkflow } from '../lib/api/executions';
import {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  updateWorkflowStatus,
} from '../lib/api/workflows';
import { useWorkflowEditorStore } from '../stores/workflow-editor.store';

const ACTIVE_STATUS = 'ACTIVE' as WorkflowDto['status'];
const PAUSED_STATUS = 'PAUSED' as WorkflowDto['status'];

function getStatusClasses(status: WorkflowDto['status']): string {
  switch (status) {
    case ACTIVE_STATUS:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case PAUSED_STATUS:
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-900/10 bg-white text-slate-600';
  }
}

export function WorkflowEditorPage() {
  const { id = 'new' } = useParams();
  const navigate = useNavigate();

  const workflowId = useWorkflowEditorStore((state) => state.workflowId);
  const workflowName = useWorkflowEditorStore((state) => state.workflowName);
  const workflowStatus = useWorkflowEditorStore((state) => state.workflowStatus);
  const workflowVersion = useWorkflowEditorStore((state) => state.workflowVersion);
  const setWorkflowName = useWorkflowEditorStore((state) => state.setWorkflowName);
  const resetEditor = useWorkflowEditorStore((state) => state.resetEditor);
  const loadWorkflow = useWorkflowEditorStore((state) => state.loadWorkflow);
  const validateWorkflow = useWorkflowEditorStore(
    (state) => state.validateWorkflow,
  );
  const saveWorkflowPayload = useWorkflowEditorStore(
    (state) => state.saveWorkflow,
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [running, setRunning] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEditor() {
      setPageError(null);

      if (id === 'new') {
        setLoading(false);
        resetEditor();
        return;
      }

      setLoading(true);
      resetEditor();

      try {
        const workflow = await getWorkflow(id);

        if (!cancelled) {
          loadWorkflow(workflow);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEditor();

    return () => {
      cancelled = true;
    };
  }, [id, loadWorkflow, resetEditor]);

  async function handleSave() {
    const validationErrors = validateWorkflow();

    if (validationErrors.length > 0) {
      setPageError(validationErrors.map((e) => e.message).join(' '));
      return;
    }

    setSaving(true);
    setPageError(null);

    try {
      const payload = saveWorkflowPayload();
      const workflow =
        workflowId === null
          ? await createWorkflow(payload)
          : await updateWorkflow(workflowId, payload);

      loadWorkflow(workflow);
      toast.success(
        workflowId === null
          ? 'Workflow created successfully.'
          : `Workflow saved. Version ${workflow.version}.`,
      );

      if (workflowId === null) {
        navigate(`/workflows/${workflow.id}/edit`, {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!workflowId) {
      return;
    }

    setStatusUpdating(true);
    setPageError(null);

    const nextStatus =
      workflowStatus === ACTIVE_STATUS ? PAUSED_STATUS : ACTIVE_STATUS;

    try {
      const workflow = await updateWorkflowStatus(workflowId, {
        status: nextStatus,
      });

      loadWorkflow(workflow);
      toast.success(`Workflow is now ${nextStatus}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleRun() {
    if (!workflowId) {
      return;
    }

    setRunning(true);
    setPageError(null);

    try {
      await executeWorkflow(workflowId, {});

      toast.success('Execution started.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <section className="app-panel app-panel-strong shrink-0 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between xl:py-6">
          <div className="flex flex-1 items-center gap-4">
            <Link
              className="rounded-full border border-slate-900/10 bg-white/88 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white"
              to="/"
            >
              &larr; Back
            </Link>
            <label className="block min-w-0 max-w-2xl flex-1">
              <span className="muted-label">Workflow name</span>
              <input
                className="mt-1 w-full rounded-[1.4rem] border border-slate-900/12 bg-white/92 px-4 py-3 text-base font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition focus:border-amber-500"
                data-testid="workflow-name-input"
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder="Untitled workflow"
                type="text"
                value={workflowName}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`status-pill ${getStatusClasses(workflowStatus)}`}>
              {workflowStatus ?? 'DRAFT'}
            </span>
            <span className="app-chip font-semibold text-slate-700">
              {workflowVersion === null ? 'Unsaved' : `v${workflowVersion}`}
            </span>

            <button
              className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_32px_-20px_rgba(141,69,20,0.62)] transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
              data-testid="save-workflow-button"
              disabled={saving}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="rounded-full border border-slate-900/10 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              data-testid="toggle-workflow-status-button"
              disabled={!workflowId || statusUpdating}
              onClick={() => void handleToggleStatus()}
              title={!workflowId ? 'Save the workflow first' : undefined}
              type="button"
            >
              {statusUpdating
                ? 'Updating...'
                : workflowStatus === ACTIVE_STATUS
                  ? 'Pause'
                  : 'Activate'}
            </button>
            <button
              className="rounded-full border border-slate-900/10 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-500/40 hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              data-testid="run-workflow-button"
              disabled={!workflowId || running}
              onClick={() => void handleRun()}
              title={!workflowId ? 'Save the workflow first' : undefined}
              type="button"
            >
              {running ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        {pageError ? (
          <div className="px-6 pb-5">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-rows-[1fr] 2xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <div className="min-h-0 xl:overflow-y-auto">
          <NodeSidebar />
        </div>

        <div className="min-h-0">
          {loading ? (
            <LoadingState
              description="The saved workflow graph is loading into the editor."
              title="Loading workflow editor..."
            />
          ) : (
            <FlowCanvas />
          )}
        </div>

        <div className="min-h-0 xl:overflow-y-auto">
          <ConfigPanel workflowId={workflowId} />
        </div>
      </section>
    </div>
  );
}
