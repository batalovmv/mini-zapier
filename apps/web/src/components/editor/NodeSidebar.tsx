import type { DragEvent } from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

interface NodeSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

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

export function NodeSidebar({ collapsed, onToggle }: NodeSidebarProps) {
  const { messages } = useLocale();
  const sections = createNodeSections();

  if (collapsed) {
    return (
      <aside className="flex h-full min-h-0 items-start justify-center pt-3">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-900/10 bg-white/90 text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-800 hover:shadow-md"
          onClick={onToggle}
          title={messages.nodeSidebar.expandToolbox}
          type="button"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M12 4v16m-8-8h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-900/10 px-4 py-3">
        <p className="muted-label">{messages.nodeSidebar.eyebrow}</p>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          onClick={onToggle}
          title={messages.nodeSidebar.collapseToolbox}
          type="button"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M11 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3">
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
