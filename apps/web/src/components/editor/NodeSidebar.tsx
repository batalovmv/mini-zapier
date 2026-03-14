import type { DragEvent } from 'react';

import { useLocale } from '../../locale/LocaleProvider';

import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

const sectionTone = {
  Triggers: {
    shell: 'border-emerald-200/80 bg-emerald-50/65',
    count: 'bg-emerald-600 text-white',
    item: 'border-l-[3px] border-l-emerald-500 hover:border-emerald-300/90',
    icon: 'bg-emerald-600',
  },
  Actions: {
    shell: 'border-sky-200/80 bg-sky-50/60',
    count: 'bg-sky-600 text-white',
    item: 'border-l-[3px] border-l-sky-500 hover:border-sky-300/90',
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

  return (
    <aside className="app-panel editor-rail flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-4 py-4">
        <p className="muted-label">{messages.nodeSidebar.eyebrow}</p>
        <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-slate-900">
          {messages.nodeSidebar.title}
        </h2>
        <p className="mt-2.5 text-sm leading-6 text-slate-600">
          {messages.nodeSidebar.description}
        </p>

        <ol className="mt-4 space-y-3">
          {messages.nodeSidebar.steps.map((item, index) => (
            <li
              key={item.step}
              className="flex items-start gap-3 border-b border-slate-900/8 pb-3 last:border-b-0 last:pb-0"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                {item.step}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <span className="rounded-full border border-slate-900/8 bg-white/78 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {index === 0
                      ? messages.common.nodeKindLabels.trigger
                      : messages.common.nodeKindLabels.action}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {sections.map((section) => {
          const tone = sectionTone[section.title];
          const sectionMeta = messages.nodeSidebar.sectionMeta[section.title];

          return (
            <section
              key={section.title}
              className={`rounded-[28px] border px-4 py-4 shadow-[0_18px_34px_-32px_rgba(15,23,42,0.32)] ${tone.shell}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="muted-label">{sectionMeta.badge}</p>
                  <h3 className="mt-1.5 text-[1.02rem] font-semibold tracking-tight text-slate-900">
                    {sectionMeta.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                    {sectionMeta.description}
                  </p>
                </div>
                <span
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold shadow-sm ${tone.count}`}
                >
                  {section.items.length}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {section.items.map((item) => {
                  const copy = messages.editorDefinitions[item.id];

                  return (
                    <button
                      key={item.id}
                      className={`group flex w-full cursor-grab items-start gap-3 rounded-[20px] border border-slate-900/10 bg-white/96 px-3.5 py-3 text-left shadow-[0_14px_28px_-24px_rgba(15,23,42,0.28)] transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:cursor-grabbing ${tone.item}`}
                      data-testid={`palette-item-${item.id}`}
                      draggable
                      onDragStart={(event) => handleDragStart(event, item)}
                      type="button"
                    >
                      <span
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] text-[11px] font-black tracking-[0.2em] text-white ${tone.icon}`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {copy.label}
                        </span>
                        <span className="mt-1 block text-[13px] leading-5 text-slate-600">
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
