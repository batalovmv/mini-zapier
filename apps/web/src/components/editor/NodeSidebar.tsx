import { useEffect, useState, type DragEvent } from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';
import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

const sectionTone = {
  Triggers: {
    rule: 'bg-emerald-500',
    count: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    item: 'hover:border-emerald-300/90 hover:shadow-emerald-900/10',
    icon: 'bg-emerald-600',
  },
  Actions: {
    rule: 'bg-sky-500',
    count: 'border-sky-200 bg-sky-50 text-sky-700',
    item: 'hover:border-sky-300/90 hover:shadow-sky-900/10',
    icon: 'bg-sky-600',
  },
} as const;

function handleDragStart(
  event: DragEvent<HTMLButtonElement>,
  item: EditorPaletteItem,
) {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(
    DRAG_DATA_KEY,
    JSON.stringify({
      nodeKind: item.nodeKind,
      nodeType: item.nodeType,
    }),
  );
}

export function NodeSidebar() {
  const { messages } = useLocale();
  const sections = createNodeSections();
  const nodeCount = useWorkflowEditorStore((state) => state.nodes.length);
  const [flowHintCollapsed, setFlowHintCollapsed] = useState(nodeCount > 0);
  const flowOrderSummary = `1. ${messages.common.nodeKindLabels.trigger} -> 2. ${messages.common.nodeKindLabels.action}`;

  useEffect(() => {
    if (nodeCount > 0) {
      setFlowHintCollapsed(true);
    }
  }, [nodeCount]);

  return (
    <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-4 py-4">
        <p className="muted-label">{messages.nodeSidebar.eyebrow}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-slate-900">
              {messages.nodeSidebar.title}
            </h2>
            <p className="mt-2 max-w-xs text-[13px] leading-5 text-slate-600">
              {messages.nodeSidebar.description}
            </p>
          </div>
          <span className="app-pill shrink-0 px-3 py-1 text-[10px] tracking-[0.16em]">
            {messages.nodeSidebar.flowOrderLabel}
          </span>
        </div>

        <div className="mt-4 rounded-[1.1rem] border border-slate-900/10 bg-white/70 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="muted-label">{messages.nodeSidebar.flowOrderLabel}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500">
                {flowOrderSummary}
              </p>
            </div>
            <button
              aria-expanded={!flowHintCollapsed}
              className="shrink-0 rounded-full border border-slate-900/10 bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-amber-500/30 hover:text-slate-900"
              onClick={() => setFlowHintCollapsed((value) => !value)}
              type="button"
            >
              {flowHintCollapsed
                ? messages.nodeSidebar.showFlowHint
                : messages.nodeSidebar.hideFlowHint}
            </button>
          </div>

          {!flowHintCollapsed ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white/92 px-3 py-1 text-xs font-semibold text-emerald-700">
                1. {messages.common.nodeKindLabels.trigger}
              </span>
              <span className="h-px w-4 bg-slate-300" />
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/92 px-3 py-1 text-xs font-semibold text-sky-700">
                2. {messages.common.nodeKindLabels.action}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {sections.map((section) => {
          const tone = sectionTone[section.title];
          const sectionMeta = messages.nodeSidebar.sectionMeta[section.title];

          return (
            <section key={section.title}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tone.rule}`} />
                    <p className="muted-label">{sectionMeta.badge}</p>
                  </div>
                  <h3 className="mt-1.5 text-[1rem] font-semibold tracking-tight text-slate-900">
                    {sectionMeta.title}
                  </h3>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    {sectionMeta.description}
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold ${tone.count}`}
                >
                  {section.items.length}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const copy = messages.editorDefinitions[item.id];

                  return (
                    <button
                      key={item.id}
                      className={`group flex w-full cursor-grab items-start gap-3 rounded-[18px] border border-slate-900/10 bg-white/94 px-3.5 py-3 text-left shadow-[0_12px_24px_-24px_rgba(15,23,42,0.2)] transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:cursor-grabbing ${tone.item}`}
                      data-testid={`palette-item-${item.id}`}
                      draggable
                      onDragStart={(event) => handleDragStart(event, item)}
                      type="button"
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] text-[11px] font-black tracking-[0.18em] text-white ${tone.icon}`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="block text-sm font-semibold text-slate-900">
                            {copy.label}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition group-hover:text-slate-500">
                            {messages.nodeSidebar.dragHint}
                          </span>
                        </span>
                        <span className="mt-1 block text-[12px] leading-5 text-slate-600">
                          {copy.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

export { DRAG_DATA_KEY };
