import type { WorkflowDto } from '@mini-zapier/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ConfigPanel } from '../components/editor/ConfigPanel';
import { FlowCanvas } from '../components/editor/FlowCanvas';
import { NodeSidebar } from '../components/editor/NodeSidebar';
import { getApiErrorMessage } from '../lib/api/client';
import { executeWorkflow } from '../lib/api/executions';
import {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  updateWorkflowStatus,
} from '../lib/api/workflows';
import { useWorkflowEditorStore } from '../stores/workflow-editor.store';

interface EditorNotice {
  tone: 'success' | 'error';
  message: string;
}

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
  const saveWorkflowPayload = useWorkflowEditorStore(
    (state) => state.saveWorkflow,
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [running, setRunning] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<EditorNotice | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEditor() {
      setPageError(null);
      setNotice(null);

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
    setSaving(true);
    setPageError(null);
    setNotice(null);

    try {
      const payload = saveWorkflowPayload();
      const workflow =
        workflowId === null
          ? await createWorkflow(payload)
          : await updateWorkflow(workflowId, payload);

      loadWorkflow(workflow);
      setNotice({
        tone: 'success',
        message:
          workflowId === null
            ? `Workflow created: ${workflow.id}.`
            : `Workflow saved. Version ${workflow.version}.`,
      });

      if (workflowId === null) {
        navigate(`/workflows/${workflow.id}/edit`, {
          replace: true,
        });
      }
    } catch (error) {
      setPageError(getApiErrorMessage(error));
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
    setNotice(null);

    const nextStatus =
      workflowStatus === ACTIVE_STATUS ? PAUSED_STATUS : ACTIVE_STATUS;

    try {
      const workflow = await updateWorkflowStatus(workflowId, {
        status: nextStatus,
      });

      loadWorkflow(workflow);
      setNotice({
        tone: 'success',
        message: `Workflow is now ${nextStatus}.`,
      });
    } catch (error) {
      setPageError(getApiErrorMessage(error));
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
    setNotice(null);

    try {
      const response = await executeWorkflow(workflowId, {});

      setNotice({
        tone: 'success',
        message: `Execution queued: ${response.executionId}.`,
      });
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="app-panel overflow-hidden">
        <div className="border-b border-slate-900/10 px-8 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="muted-label">Workflow Editor</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                Visual React Flow editor for linear workflows.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Drag nodes from the sidebar, connect them in a single chain and
                configure each step from the right panel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`status-pill ${getStatusClasses(workflowStatus)}`}>
                {workflowStatus}
              </span>
              <span className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {workflowVersion === null ? 'Unsaved' : `v${workflowVersion}`}
              </span>
              <Link
                className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
                to="/"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-8 py-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1">
            <label className="block">
              <span className="muted-label">Workflow name</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-amber-500"
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder="Untitled workflow"
                type="text"
                value={workflowName}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={saving}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={!workflowId || statusUpdating}
              onClick={() => void handleToggleStatus()}
              type="button"
            >
              {statusUpdating
                ? 'Updating...'
                : workflowStatus === ACTIVE_STATUS
                  ? 'Pause'
                  : 'Activate'}
            </button>
            <button
              className="rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={!workflowId || running}
              onClick={() => void handleRun()}
              type="button"
            >
              {running ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        {(notice || pageError) && (
          <div className="space-y-3 px-8 pb-8">
            {notice ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  notice.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {notice.message}
              </div>
            ) : null}

            {pageError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pageError}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <div className="min-h-[720px]">
          <NodeSidebar />
        </div>

        <div className="min-h-[720px]">
          {loading ? (
            <div className="app-panel flex h-full items-center justify-center px-6 text-sm text-slate-600">
              Loading workflow editor...
            </div>
          ) : (
            <FlowCanvas />
          )}
        </div>

        <div className="min-h-[720px]">
          <ConfigPanel workflowId={workflowId} />
        </div>
      </section>
    </div>
  );
}
