import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import { useLocale } from '../../../locale/LocaleProvider';
import { getNodeDefinition, type WorkflowEditorNodeData } from '../editor-definitions';

export function TriggerNode({
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
          ? 'border-emerald-500 shadow-emerald-900/20'
          : 'border-emerald-900/10 shadow-slate-900/10'
      }`}
    >
      <div className="rounded-xl bg-emerald-600 px-3 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/18 text-xs font-black tracking-[0.24em]">
            {definition?.icon ?? 'TR'}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50/80">
              {messages.editorNodes.triggerBadge}
            </p>
            <p className="text-sm font-semibold">{copy?.label ?? data.label}</p>
          </div>
        </div>
      </div>

      <Handle
        className="h-3 w-3 border-2 border-white bg-emerald-500"
        data-testid={`${id}-source-handle`}
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}
