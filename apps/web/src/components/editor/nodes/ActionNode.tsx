import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import { useLocale } from '../../../locale/LocaleProvider';
import { getNodeDefinition, type WorkflowEditorNodeData } from '../editor-definitions';

export function ActionNode({
  id,
  data,
  selected,
}: NodeProps<WorkflowEditorNodeData>) {
  const { messages } = useLocale();
  const definition = getNodeDefinition(data.nodeKind, data.nodeType);
  const copy = definition ? messages.editorDefinitions[definition.id] : undefined;

  return (
    <div
      data-node-id={id}
      data-node-kind={data.nodeKind}
      data-node-label={data.label}
      data-node-type={data.nodeType}
      data-testid="editor-node"
      className={`min-w-[200px] rounded-xl border bg-white shadow-lg transition ${
        selected
          ? 'border-sky-500 shadow-sky-900/20'
          : 'border-slate-900/10 shadow-slate-900/10'
      }`}
    >
      <Handle
        className="h-3 w-3 border-2 border-white bg-sky-500"
        data-testid={`${id}-target-handle`}
        position={Position.Top}
        type="target"
      />

      <div className="rounded-t-xl bg-sky-600 px-3 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/18 text-xs font-black tracking-[0.24em]">
            {definition?.icon ?? 'AC'}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-50/80">
              {messages.editorNodes.actionBadge}
            </p>
            <p className="text-sm font-semibold">{copy?.label ?? data.label}</p>
          </div>
        </div>
      </div>

      <Handle
        className="h-3 w-3 border-2 border-white bg-sky-500"
        data-testid={`${id}-source-handle`}
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}
