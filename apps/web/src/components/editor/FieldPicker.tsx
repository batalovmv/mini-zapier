import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import { getAvailableFields } from '../../lib/api/executions';
import type { AvailableFieldsResponse, FieldTreeNode } from '../../lib/api/types';
import {
  computeChainPosition,
  computeStructuralFingerprint,
} from '../../lib/editor-chain';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import type { ConfigUpdater } from './ConfigPanel';

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
          // Assistive-only — silently fail.
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

  const { data, loading, refetch } = useAvailableFields(workflowId);
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
  const hasUnsavedChanges =
    savedFingerprint !== null && currentFingerprint !== savedFingerprint;

  const versionMismatch =
    data !== null &&
    data.sourceWorkflowVersion !== null &&
    workflowVersion !== null &&
    data.sourceWorkflowVersion !== workflowVersion;

  const positionData = data?.positions.find(
    (p) => p.position === chainPosition,
  );
  const tree = positionData?.tree ?? [];
  const fields = positionData?.fields ?? [];

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
