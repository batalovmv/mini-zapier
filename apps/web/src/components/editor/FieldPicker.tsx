import { useCallback, useEffect, useRef, useState } from 'react';

import { getAvailableFields } from '../../lib/api/executions';
import type { AvailableFieldsResponse } from '../../lib/api/types';
import {
  computeChainPosition,
  computeStructuralFingerprint,
} from '../../lib/editor-chain';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import type { ConfigUpdater } from './ConfigPanel';

// ---------------------------------------------------------------------------
// Module-level shared cache + deduplication
// ---------------------------------------------------------------------------

const cache = new Map<string, AvailableFieldsResponse>();
const inflight = new Map<string, Promise<AvailableFieldsResponse>>();

function fetchWithDedup(
  workflowId: string,
): Promise<AvailableFieldsResponse> {
  const existing = inflight.get(workflowId);

  if (existing) {
    return existing;
  }

  const promise = getAvailableFields(workflowId).finally(() => {
    inflight.delete(workflowId);
  });

  inflight.set(workflowId, promise);

  return promise;
}

// ---------------------------------------------------------------------------
// useAvailableFields hook
// ---------------------------------------------------------------------------

interface UseAvailableFieldsResult {
  data: AvailableFieldsResponse | null;
  loading: boolean;
  refetch: () => void;
}

function useAvailableFields(
  workflowId: string | null,
): UseAvailableFieldsResult {
  const [data, setData] = useState<AvailableFieldsResponse | null>(
    workflowId ? (cache.get(workflowId) ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const workflowIdRef = useRef(workflowId);
  workflowIdRef.current = workflowId;

  const doFetch = useCallback(
    (force: boolean) => {
      if (!workflowId) {
        setData(null);

        return;
      }

      if (!force && cache.has(workflowId)) {
        setData(cache.get(workflowId)!);

        return;
      }

      if (force) {
        cache.delete(workflowId);
      }

      setLoading(true);

      fetchWithDedup(workflowId)
        .then((result) => {
          cache.set(workflowId, result);

          if (workflowIdRef.current === workflowId) {
            setData(result);
          }
        })
        .catch(() => {
          // Assistive-only — silently fail
        })
        .finally(() => {
          if (workflowIdRef.current === workflowId) {
            setLoading(false);
          }
        });
    },
    [workflowId],
  );

  useEffect(() => {
    doFetch(false);
  }, [doFetch]);

  const refetch = useCallback(() => {
    doFetch(true);
  }, [doFetch]);

  return { data, loading, refetch };
}

// ---------------------------------------------------------------------------
// insertAtCursor utility
// ---------------------------------------------------------------------------

export function insertAtCursor(
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  fieldString: string,
  configKey: string,
  config: Record<string, unknown>,
  onChange: ConfigUpdater,
): void {
  const el = ref.current;
  const currentValue =
    typeof config[configKey] === 'string'
      ? (config[configKey] as string)
      : '';
  const start = el?.selectionStart ?? currentValue.length;
  const end = el?.selectionEnd ?? currentValue.length;
  const newValue =
    currentValue.slice(0, start) + fieldString + currentValue.slice(end);

  onChange((prev) => ({ ...prev, [configKey]: newValue }));

  requestAnimationFrame(() => {
    if (el) {
      const cursorPos = start + fieldString.length;
      el.setSelectionRange(cursorPos, cursorPos);
      el.focus();
    }
  });
}

/**
 * Insert a field string into a Record<string, string> value at cursor position.
 * Used for mapping values and header values.
 */
export function insertAtCursorRecord(
  refEl: HTMLInputElement | null,
  fieldString: string,
  configKey: string,
  entryKey: string,
  config: Record<string, unknown>,
  onChange: ConfigUpdater,
  toStringRecord: (value: unknown) => Record<string, string>,
): void {
  const record = toStringRecord(config[configKey]);
  const currentValue = record[entryKey] ?? '';
  const start = refEl?.selectionStart ?? currentValue.length;
  const end = refEl?.selectionEnd ?? currentValue.length;
  const newValue =
    currentValue.slice(0, start) + fieldString + currentValue.slice(end);

  onChange((prev) => ({
    ...prev,
    [configKey]: { ...toStringRecord(prev[configKey]), [entryKey]: newValue },
  }));

  requestAnimationFrame(() => {
    if (refEl) {
      const cursorPos = start + fieldString.length;
      refEl.setSelectionRange(cursorPos, cursorPos);
      refEl.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// FieldPicker component
// ---------------------------------------------------------------------------

interface FieldPickerProps {
  onSelect: (field: string) => void;
}

export function FieldPicker({ onSelect }: FieldPickerProps) {
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const workflowVersion = useWorkflowEditorStore((s) => s.workflowVersion);
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const savedFingerprint = useWorkflowEditorStore(
    (s) => s.savedStructuralFingerprint,
  );

  const { data, loading, refetch } = useAvailableFields(workflowId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute chain position
  const chainPosition =
    selectedNodeId !== null
      ? computeChainPosition(nodes, edges, selectedNodeId)
      : -1;

  // Don't render for trigger nodes or unknown positions
  if (chainPosition < 0) {
    return null;
  }

  // Structural fingerprint check
  const currentFingerprint = computeStructuralFingerprint(nodes, edges);
  const hasUnsavedChanges =
    savedFingerprint !== null && currentFingerprint !== savedFingerprint;

  // Version mismatch check
  const versionMismatch =
    data !== null &&
    data.sourceWorkflowVersion !== null &&
    workflowVersion !== null &&
    data.sourceWorkflowVersion !== workflowVersion;

  // Fields for current position
  const positionData = data?.positions.find(
    (p) => p.position === chainPosition,
  );
  const fields = positionData?.fields ?? [];

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      refetch();
      setOpen(true);
    }
  }

  function handleSelect(field: string) {
    onSelect(`{{input.${field}}}`);
    setOpen(false);
  }

  // Close on outside click
  function handleBlur(event: React.FocusEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.relatedTarget as Node)
    ) {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      ref={containerRef}
      tabIndex={-1}
    >
      <button
        className="flex h-6 w-6 items-center justify-center rounded-lg text-amber-600 transition hover:bg-amber-50"
        onClick={handleToggle}
        title="Insert field reference"
        type="button"
      >
        <span className="text-sm">⚡</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-xs text-slate-400">Loading…</div>
          ) : hasUnsavedChanges ? (
            <div className="px-4 py-3 text-xs text-amber-600">
              Save workflow to update available fields.
            </div>
          ) : data === null || data.positions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400">
              {data?.emptyState === 'INCOMPATIBLE_EXECUTIONS'
                ? 'Run the workflow again after saving to refresh available fields.'
                : data?.emptyState === 'NO_FIELDS'
                  ? 'Run the workflow again with sample data to capture available fields.'
                  : 'Run the workflow at least once to see available fields.'}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {versionMismatch ? (
                <div className="border-b border-slate-100 px-4 py-2 text-xs text-amber-600">
                  Fields from v{data.sourceWorkflowVersion}, current v
                  {workflowVersion}
                </div>
              ) : null}
              {fields.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400">
                  No fields available for this position.
                </div>
              ) : (
                <ul>
                  {fields.map((field) => (
                    <li key={field}>
                      <button
                        className="w-full px-4 py-1.5 text-left font-mono text-xs text-slate-700 transition hover:bg-amber-50"
                        onClick={() => handleSelect(field)}
                        type="button"
                      >
                        {field}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

