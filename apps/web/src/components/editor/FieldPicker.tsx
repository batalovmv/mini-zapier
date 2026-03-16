import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from 'react';

import type { StepTestResponse } from '@mini-zapier/shared';

import { useLocale } from '../../locale/LocaleProvider';
import { getApiErrorMessage } from '../../lib/api/client';
import { getAvailableFields } from '../../lib/api/executions';
import type { AvailableFieldsResponse, FieldTreeNode } from '../../lib/api/types';
import {
  computeChainOrder,
  computeChainPosition,
  computeStructuralFingerprint,
  flattenTreePaths,
} from '../../lib/editor-chain';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import type { ConfigUpdater } from './ConfigPanel';

interface OverlayResult {
  data: AvailableFieldsResponse | null;
  /** Set of chain positions where test results contributed data */
  testPositions: Set<number>;
}

function applyTestResultOverlay(
  apiResponse: AvailableFieldsResponse | null,
  stepTestResults: Record<string, StepTestResponse>,
  nodes: { id: string; data: { nodeKind: string; nodeType: string } }[],
  edges: { source: string; target: string }[],
): OverlayResult {
  const emptyResult: OverlayResult = { data: apiResponse, testPositions: new Set() };
  const hasAnyTestResults = Object.keys(stepTestResults).length > 0;

  if (!hasAnyTestResults) {
    return emptyResult;
  }

  const chainOrder = computeChainOrder(
    nodes as Parameters<typeof computeChainOrder>[0],
    edges as Parameters<typeof computeChainOrder>[1],
  );

  if (chainOrder.length === 0) {
    return emptyResult;
  }

  const positions: { position: number; fields: string[]; tree: FieldTreeNode[] }[] = [];
  const testPositions = new Set<number>();
  let hasOverlayData = false;

  // Position 0: trigger data — from API only
  const apiPos0 = apiResponse?.positions.find((p) => p.position === 0);
  positions.push({
    position: 0,
    fields: apiPos0?.fields ?? [],
    tree: apiPos0?.tree ?? [],
  });

  // Positions 1..N: action outputs
  for (let i = 1; i < chainOrder.length; i++) {
    const actionNodeId = chainOrder[i]!;
    const testResult = stepTestResults[actionNodeId];

    if (testResult?.status === 'SUCCESS' && testResult.outputDataSchema) {
      const tree = testResult.outputDataSchema;
      const fields = flattenTreePaths(tree);
      positions.push({ position: i, fields, tree });
      testPositions.add(i);
      hasOverlayData = true;
    } else {
      const apiPos = apiResponse?.positions.find((p) => p.position === i);
      positions.push({
        position: i,
        fields: apiPos?.fields ?? [],
        tree: apiPos?.tree ?? [],
      });
    }
  }

  if (!hasOverlayData) {
    return emptyResult;
  }

  return {
    data: {
      sourceExecutionId: apiResponse?.sourceExecutionId ?? null,
      sourceWorkflowVersion: apiResponse?.sourceWorkflowVersion ?? null,
      hasExecutions: apiResponse?.hasExecutions ?? false,
      emptyState: null,
      positions,
    },
    testPositions,
  };
}

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

interface UseAvailableFieldsResult {
  data: AvailableFieldsResponse | null;
  loading: boolean;
  errorMessage: string | null;
  refetch: () => void;
}

function useAvailableFields(
  workflowId: string | null,
): UseAvailableFieldsResult {
  const { messages } = useLocale();
  const [data, setData] = useState<AvailableFieldsResponse | null>(
    workflowId ? (cache.get(workflowId) ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const workflowIdRef = useRef(workflowId);
  workflowIdRef.current = workflowId;

  const doFetch = useCallback(
    (force: boolean) => {
      if (!workflowId) {
        setData(null);
        setErrorMessage(null);

        return;
      }

      if (!force && cache.has(workflowId)) {
        setData(cache.get(workflowId)!);
        setErrorMessage(null);

        return;
      }

      if (force) {
        cache.delete(workflowId);
      }

      setLoading(true);
      setErrorMessage(null);

      fetchWithDedup(workflowId)
        .then((result) => {
          cache.set(workflowId, result);

          if (workflowIdRef.current === workflowId) {
            setData(result);
          }
        })
        .catch((error) => {
          if (workflowIdRef.current === workflowId) {
            setErrorMessage(getApiErrorMessage(error, messages.errors));
          }
        })
        .finally(() => {
          if (workflowIdRef.current === workflowId) {
            setLoading(false);
          }
        });
    },
    [workflowId, messages.errors],
  );

  useEffect(() => {
    setData(workflowId ? (cache.get(workflowId) ?? null) : null);
    setErrorMessage(null);
  }, [workflowId]);

  useEffect(() => {
    doFetch(false);
  }, [doFetch]);

  const refetch = useCallback(() => {
    doFetch(true);
  }, [doFetch]);

  return { data, loading, errorMessage, refetch };
}

export function insertAtCursor(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
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

const TYPE_LABELS: Record<string, string> = {
  object: 'typeObject',
  array: 'typeArray',
  string: 'typeString',
  number: 'typeNumber',
  boolean: 'typeBoolean',
  null: 'typeNull',
};

function getTypeLabel(
  type: string,
  messages: Record<string, string>,
): string {
  const key = TYPE_LABELS[type];

  return key ? (messages[key] ?? type) : type;
}

interface TreeNodeItemProps {
  node: FieldTreeNode;
  depth: number;
  onSelect: (path: string) => void;
  messages: Record<string, string>;
}

function TreeNodeItem({ node, depth, onSelect, messages }: TreeNodeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isBranch = node.children && node.children.length > 0;
  const typeLabel = getTypeLabel(node.type, messages);

  return (
    <li>
      <div
        className="flex items-center gap-1 pr-2"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        {isBranch ? (
          <button
            className="flex h-5 w-5 shrink-0 items-center justify-center text-xs text-slate-400"
            onClick={() => setExpanded((v) => !v)}
            type="button"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}

        <button
          className={
            isBranch
              ? 'flex-1 truncate py-1 text-left font-mono text-xs text-slate-500 transition hover:text-slate-700'
              : 'flex-1 truncate py-1 text-left font-mono text-xs text-slate-700 transition hover:bg-amber-50'
          }
          onClick={() => {
            if (isBranch) {
              setExpanded((v) => !v);
            } else {
              onSelect(node.path);
            }
          }}
          type="button"
        >
          {node.key}
          <span className="ml-1.5 font-sans text-[10px] text-slate-400">
            {typeLabel}
          </span>
        </button>

        {isBranch ? (
          <button
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-amber-600 transition hover:bg-amber-50"
            onClick={() => onSelect(node.path)}
            title={messages.insertFieldReference ?? ''}
            type="button"
          >
            <span className="text-[10px]">⚡</span>
          </button>
        ) : null}
      </div>

      {isBranch && expanded ? (
        <ul>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.path}
              depth={depth + 1}
              messages={messages}
              node={child}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

interface FieldPickerProps {
  onSelect: (field: string) => void;
  /** Controlled open state. When provided, FieldPicker delegates open/close to parent. */
  open?: boolean;
  /** Called when FieldPicker wants to change open state. Required when `open` is provided. */
  onOpenChange?: (open: boolean) => void;
}

export function FieldPicker({ onSelect, open: controlledOpen, onOpenChange }: FieldPickerProps) {
  const { messages } = useLocale();
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const workflowVersion = useWorkflowEditorStore((s) => s.workflowVersion);
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const savedFingerprint = useWorkflowEditorStore(
    (s) => s.savedStructuralFingerprint,
  );
  const stepTestResults = useWorkflowEditorStore((s) => s.stepTestResults);

  const {
    data: rawData,
    loading,
    errorMessage,
    refetch,
  } = useAvailableFields(workflowId);
  const overlay = applyTestResultOverlay(rawData, stepTestResults, nodes, edges);
  const data = overlay.data;
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  // Refetch on controlled open transition (moved to useEffect to avoid side-effects during render)
  useEffect(() => {
    if (isControlled && open && !prevOpenRef.current) {
      refetch();
    }

    prevOpenRef.current = open;
  }, [open, isControlled, refetch]);

  const chainPosition =
    selectedNodeId !== null
      ? computeChainPosition(nodes, edges, selectedNodeId)
      : -1;

  if (chainPosition < 0) {
    return null;
  }

  const currentFingerprint = computeStructuralFingerprint(nodes, edges);

  const positionData = data?.positions.find(
    (p) => p.position === chainPosition,
  );
  const tree = positionData?.tree ?? [];
  const fields = positionData?.fields ?? [];
  const hasCurrentPositionData = tree.length > 0 || fields.length > 0;

  // Bypass unsaved-changes warning only when test results (not stale API data) provide data for this position
  const hasTestOverlayForPosition = overlay.testPositions.has(chainPosition);
  const hasUnsavedChanges =
    savedFingerprint !== null &&
    currentFingerprint !== savedFingerprint &&
    !hasTestOverlayForPosition;

  const versionMismatch =
    data !== null &&
    data.sourceWorkflowVersion !== null &&
    workflowVersion !== null &&
    data.sourceWorkflowVersion !== workflowVersion;

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      if (!isControlled) {
        // In uncontrolled mode, refetch here (controlled mode refetches via transition above)
        refetch();
      }

      setOpen(true);
    }
  }

  function handleSelect(path: string) {
    onSelect(`{{input.${path}}}`);
    setOpen(false);
  }

  function handleBlur(event: FocusEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.relatedTarget as Node)
    ) {
      setOpen(false);
    }
  }

  const fpMessages = messages.fieldPicker as unknown as Record<string, string>;

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      ref={containerRef}
      tabIndex={-1}
    >
      <button
        className="rounded-lg px-2 py-0.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
        onClick={handleToggle}
        title={messages.fieldPicker.insertFieldReference}
        type="button"
      >
        {messages.fieldPicker.insertField}
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-xs text-slate-400">{messages.fieldPicker.loading}</div>
          ) : hasUnsavedChanges ? (
            <div className="px-4 py-3 text-xs text-amber-600">
              {messages.fieldPicker.saveWorkflowToUpdate}
            </div>
          ) : errorMessage !== null && !hasCurrentPositionData ? (
            <div className="px-4 py-3 text-xs text-rose-700">
              <p>{messages.fieldPicker.loadError(errorMessage)}</p>
              <button
                className="mt-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-50"
                onClick={() => refetch()}
                type="button"
              >
                {messages.fieldPicker.retry}
              </button>
            </div>
          ) : data === null || data.positions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400">
              {data?.emptyState === 'INCOMPATIBLE_EXECUTIONS'
                ? messages.fieldPicker.incompatibleExecutions
                : data?.emptyState === 'NO_FIELDS'
                  ? messages.fieldPicker.noFieldsFromRun
                  : messages.fieldPicker.runAtLeastOnce}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {versionMismatch ? (
                <div className="border-b border-slate-100 px-4 py-2 text-xs text-amber-600">
                  {messages.fieldPicker.versionMismatch(
                    data.sourceWorkflowVersion ?? 0,
                    workflowVersion,
                  )}
                </div>
              ) : null}
              {tree.length > 0 ? (
                <ul className="py-1">
                  {tree.map((node) => (
                    <TreeNodeItem
                      key={node.path}
                      depth={0}
                      messages={fpMessages}
                      node={node}
                      onSelect={handleSelect}
                    />
                  ))}
                </ul>
              ) : fields.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400">
                  {messages.fieldPicker.noFieldsForPosition}
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
