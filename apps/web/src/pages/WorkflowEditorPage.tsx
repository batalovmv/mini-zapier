import type { WorkflowDto } from '@mini-zapier/shared';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ConfigPanel } from '../components/editor/ConfigPanel';
import { getNodeDefinition } from '../components/editor/editor-definitions';
import { FlowCanvas } from '../components/editor/FlowCanvas';
import { NodeSidebar } from '../components/editor/NodeSidebar';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { LoadingState } from '../components/ui/LoadingState';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { useLocale } from '../locale/LocaleProvider';
import { getApiErrorMessage } from '../lib/api/client';
import { executeWorkflow } from '../lib/api/executions';
import {
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  updateWorkflowStatus,
} from '../lib/api/workflows';
import {
  hasUnsavedWorkflowChanges,
  useWorkflowEditorStore,
} from '../stores/workflow-editor.store';

const ACTIVE_STATUS = 'ACTIVE' as WorkflowDto['status'];
const PAUSED_STATUS = 'PAUSED' as WorkflowDto['status'];
const TOOLBOX_COLLAPSED_KEY = 'mini-zapier:toolbox-collapsed';

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

function getDirtyStateClasses(hasUnsavedChanges: boolean): string {
  return hasUnsavedChanges
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-slate-900/10 bg-white/78 text-slate-600';
}

export function WorkflowEditorPage() {
  const { id = 'new' } = useParams();
  const navigate = useNavigate();
  const { messages } = useLocale();

  const workflowId = useWorkflowEditorStore((state) => state.workflowId);
  const workflowName = useWorkflowEditorStore((state) => state.workflowName);
  const workflowStatus = useWorkflowEditorStore((state) => state.workflowStatus);
  const workflowVersion = useWorkflowEditorStore((state) => state.workflowVersion);
  const hasUnsavedChanges = useWorkflowEditorStore(hasUnsavedWorkflowChanges);
  const setWorkflowName = useWorkflowEditorStore((state) => state.setWorkflowName);
  const resetEditor = useWorkflowEditorStore((state) => state.resetEditor);
  const loadWorkflow = useWorkflowEditorStore((state) => state.loadWorkflow);
  const validateWorkflow = useWorkflowEditorStore(
    (state) => state.validateWorkflow,
  );
  const saveWorkflowPayload = useWorkflowEditorStore(
    (state) => state.saveWorkflow,
  );

  const selectedNodeId = useWorkflowEditorStore((state) => state.selectedNodeId);
  const removeNode = useWorkflowEditorStore((state) => state.removeNode);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [running, setRunning] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toolboxCollapsed, setToolboxCollapsed] = useState(() =>
    localStorage.getItem(TOOLBOX_COLLAPSED_KEY) === 'true',
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteNodeLabel, setDeleteNodeLabel] = useState('');

  function toggleToolbox() {
    setToolboxCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(TOOLBOX_COLLAPSED_KEY, String(next));
      return next;
    });
  }
  const { allowNextNavigation } = useUnsavedChangesGuard({
    when: hasUnsavedChanges,
    message: messages.workflowEditorPage.unsavedChangesConfirm,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadEditor() {
      setPageError(null);

      if (id === 'new') {
        setLoading(false);
        resetEditor(messages.workflowEditorPage.untitledWorkflow);
        return;
      }

      setLoading(true);
      resetEditor(messages.workflowEditorPage.untitledWorkflow);

      try {
        const workflow = await getWorkflow(id);

        if (!cancelled) {
          loadWorkflow(workflow);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(getApiErrorMessage(error, messages.errors));
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
  }, [
    id,
    loadWorkflow,
    messages.workflowEditorPage.untitledWorkflow,
    resetEditor,
  ]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isModKey = event.metaKey || event.ctrlKey;

      if (isModKey && event.key === 's') {
        event.preventDefault();
        if (!saving) {
          void handleSaveRef.current();
        }
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable
        ) {
          return;
        }

        const currentSelectedNodeId = useWorkflowEditorStore.getState().selectedNodeId;
        if (currentSelectedNodeId) {
          event.preventDefault();
          const state = useWorkflowEditorStore.getState();
          const node = state.nodes.find((n) => n.id === currentSelectedNodeId);
          if (node) {
            const def = getNodeDefinition(node.data.nodeKind, node.data.nodeType);
            const defCopy = def ? messages.editorDefinitions[def.id] : undefined;
            setDeleteNodeLabel(defCopy?.label ?? node.data.label ?? '');
          }
          setDeleteDialogOpen(true);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, messages.editorDefinitions]);

  function handleDeleteSelectedNode() {
    const nodeId = useWorkflowEditorStore.getState().selectedNodeId;
    if (!nodeId) return;
    removeNode(nodeId);
    setDeleteDialogOpen(false);
    toast.success(messages.configPanel.nodeDeletedToast(deleteNodeLabel));
  }

  async function handleSave() {
    const validationErrors = validateWorkflow();

    if (validationErrors.length > 0) {
      setPageError(
        validationErrors
          .map((error) => messages.workflowValidation[error.code])
          .join(' '),
      );
      return;
    }

    setSaving(true);
    setPageError(null);

    try {
      const payload = saveWorkflowPayload(messages.workflowEditorPage.untitledWorkflow);
      const workflow =
        workflowId === null
          ? await createWorkflow(payload)
          : await updateWorkflow(workflowId, payload);

      loadWorkflow(workflow);
      toast.success(
        workflowId === null
          ? messages.workflowEditorPage.workflowCreatedToast
          : messages.workflowEditorPage.workflowSavedToast(workflow.version),
      );

      if (workflowId === null) {
        allowNextNavigation();
        navigate(`/workflows/${workflow.id}/edit`, {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
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
      toast.success(
        messages.workflowEditorPage.statusUpdatedToast(
          messages.common.workflowStatusLabels[nextStatus],
        ),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
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

      toast.success(messages.workflowEditorPage.executionStartedToast);
    } catch (error) {
      toast.error(getApiErrorMessage(error, messages.errors));
    } finally {
      setRunning(false);
    }
  }

  const toggleStatusLabel =
    workflowStatus === ACTIVE_STATUS ? messages.common.pause : messages.common.activate;
  const dirtyStateLabel = hasUnsavedChanges
    ? messages.workflowEditorPage.unsavedChanges
    : messages.workflowEditorPage.noUnsavedChanges;
  const workflowVersionLabel =
    workflowVersion === null
      ? messages.workflowEditorPage.notSavedYet
      : `v${workflowVersion}`;

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col gap-3 xl:overflow-hidden">
      <section className="editor-command-bar mx-auto w-full max-w-[1740px] shrink-0 overflow-hidden">
        <div className="editor-command-bar__inner">
          <div className="editor-command-bar__main">
            <div className="editor-command-bar__topline">
              <Link className="editor-command-back" to="/">
                &larr; {messages.common.back}
              </Link>
              <div className="editor-command-meta">
                <span
                  className={`editor-command-meta-chip editor-command-status-chip ${getStatusClasses(workflowStatus)}`}
                >
                  {messages.common.workflowStatusLabels[workflowStatus]}
                </span>
                <span
                  className={`editor-command-meta-chip ${getDirtyStateClasses(hasUnsavedChanges)}`}
                >
                  {dirtyStateLabel}
                </span>
                <span className="editor-command-meta-chip border-slate-900/10 bg-white/78 text-slate-600">
                  {workflowVersionLabel}
                </span>
              </div>
            </div>

            <label className="editor-command-name-field">
              <span className="muted-label">{messages.workflowEditorPage.workflowName}</span>
              <input
                className="editor-command-name-input"
                data-testid="workflow-name-input"
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder={messages.workflowEditorPage.untitledWorkflow}
                type="text"
                value={workflowName}
              />
            </label>
          </div>

          <div className="editor-command-actions">
            <button
              className="editor-command-action editor-command-action-primary w-full sm:w-auto"
              data-testid="save-workflow-button"
              disabled={saving}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? messages.workflowEditorPage.saving : messages.common.save}
            </button>
            <button
              className="editor-command-action editor-command-action-secondary"
              data-testid="toggle-workflow-status-button"
              disabled={!workflowId || statusUpdating}
              onClick={() => void handleToggleStatus()}
              title={!workflowId ? messages.workflowEditorPage.saveFirst : undefined}
              type="button"
            >
              {statusUpdating
                ? messages.workflowEditorPage.updating
                : toggleStatusLabel}
            </button>
            <button
              className="editor-command-action editor-command-action-secondary"
              data-testid="run-workflow-button"
              disabled={!workflowId || running}
              onClick={() => void handleRun()}
              title={!workflowId ? messages.workflowEditorPage.saveFirst : undefined}
              type="button"
            >
              {running ? messages.workflowEditorPage.running : messages.common.run}
            </button>
          </div>
        </div>

        {pageError ? (
          <div className="editor-command-bar__error">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`mx-auto grid min-h-0 w-full max-w-[1740px] flex-1 gap-3 overflow-hidden xl:grid-rows-[minmax(0,1fr)] ${
          toolboxCollapsed
            ? 'xl:grid-cols-[48px_minmax(0,1fr)_380px] 2xl:grid-cols-[48px_minmax(0,1fr)_400px]'
            : 'xl:grid-cols-[300px_minmax(0,1fr)_320px] 2xl:grid-cols-[312px_minmax(0,1fr)_336px]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <NodeSidebar collapsed={toolboxCollapsed} onToggle={toggleToolbox} />
        </div>

        <div className="min-h-0 overflow-hidden">
          {loading ? (
            <LoadingState
              description={messages.workflowEditorPage.loadingDescription}
              title={messages.workflowEditorPage.loadingTitle}
            />
          ) : (
            <FlowCanvas />
          )}
        </div>

        <div className="min-h-0 overflow-hidden">
          <ConfigPanel workflowId={workflowId} />
        </div>
      </section>
    </div>

    {deleteDialogOpen ? (
      <ConfirmationDialog
        confirmLabel={messages.configPanel.deleteNodeDialogConfirm}
        confirmTone="danger"
        description={messages.configPanel.deleteNodeDialogDescription(deleteNodeLabel)}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelectedNode}
        title={messages.configPanel.deleteNodeDialogTitle}
      />
    ) : null}
    </>
  );
}
