import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import { getNodeDefinition, type WorkflowEditorNodeData } from '../editor-definitions';

export function ActionNode({
  data,
  selected,
}: NodeProps<WorkflowEditorNodeData>) {
  const definition = getNodeDefinition(data.nodeKind, data.nodeType);

  return (
    <div
      className={`min-w-[240px] rounded-3xl border bg-white shadow-lg transition ${
        selected
          ? 'border-sky-500 shadow-sky-900/20'
          : 'border-slate-900/10 shadow-slate-900/10'
      }`}
    >
      <Handle
        className="h-3 w-3 border-2 border-white bg-sky-500"
        position={Position.Top}
        type="target"
      />

      <div className="rounded-t-3xl bg-sky-600 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/18 text-xs font-black tracking-[0.24em]">
            {definition?.icon ?? 'AC'}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-50/80">
              Action
            </p>
            <p className="text-sm font-semibold">{data.label}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          {data.nodeType}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {definition?.description ?? 'Workflow action node.'}
        </p>
      </div>

      <Handle
        className="h-3 w-3 border-2 border-white bg-sky-500"
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}
