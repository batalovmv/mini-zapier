import type { DragEvent } from 'react';

import { useLocale } from '../../locale/LocaleProvider';

import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

const sectionTone = {
  Triggers: 'border-emerald-200/80 bg-emerald-50/70',
  Actions: 'border-sky-200/80 bg-sky-50/60',
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
        <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-slate-900">
          {messages.nodeSidebar.title}
        </h2>
        <p className="mt-2.5 text-sm leading-6 text-slate-600">
          {messages.nodeSidebar.description}
        </p>

        <div className="app-subpanel-muted mt-4 px-3.5 py-3.5">
          <div className="space-y-2.5">
            {messages.nodeSidebar.steps.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/70 bg-white/88 px-3 py-2.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className={`rounded-[28px] border px-3.5 py-3.5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.3)] ${sectionTone[section.title]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="muted-label">{messages.nodeSidebar.sectionMeta[section.title].title}</p>
                <h3 className="mt-1.5 text-base font-semibold tracking-tight text-slate-900">
                  {messages.nodeSidebar.sectionMeta[section.title].title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                  {messages.nodeSidebar.sectionMeta[section.title].description}
                </p>
              </div>
              <span className="app-pill">
                {messages.nodeSidebar.sectionMeta[section.title].badge}
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {section.items.map((item) => {
                const copy = messages.editorDefinitions[item.id];

                return (
                  <button
                    key={item.id}
                    className="group flex w-full cursor-grab items-start gap-3 rounded-[22px] border border-slate-900/10 bg-white/96 px-3.5 py-3.5 text-left shadow-[0_18px_34px_-30px_rgba(15,23,42,0.3)] transition duration-150 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-white hover:shadow-md active:cursor-grabbing"
                    data-testid={`palette-item-${item.id}`}
                    draggable
                    onDragStart={(event) => handleDragStart(event, item)}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] text-[11px] font-black tracking-[0.2em] text-white ${
                        item.accent === 'emerald' ? 'bg-emerald-600' : 'bg-sky-600'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="block text-sm font-semibold text-slate-900">
                          {copy.label}
                        </span>
                        <span className="shrink-0 rounded-full border border-slate-900/8 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {section.title === 'Triggers'
                            ? messages.common.nodeKindLabels.trigger
                            : messages.common.nodeKindLabels.action}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[13px] leading-5 text-slate-600">
                        {copy.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

export { DRAG_DATA_KEY };

