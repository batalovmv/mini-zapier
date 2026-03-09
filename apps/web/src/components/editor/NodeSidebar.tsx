import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

function handleDragStart(
  event: React.DragEvent<HTMLButtonElement>,
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
  const sections = createNodeSections();

  return (
    <aside className="app-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-5 py-5">
        <p className="muted-label">Node Library</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Drag into canvas
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          TASK-015 scope stays linear: one trigger, then a single action chain.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {sections.map((section) => (
          <section key={section.title}>
            <p className="muted-label">{section.title}</p>
            <div className="mt-3 space-y-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full cursor-grab items-start gap-3 rounded-2xl border border-slate-900/10 bg-white px-4 py-4 text-left transition hover:border-amber-500/40 hover:bg-amber-50 active:cursor-grabbing"
                  draggable
                  onDragStart={(event) => handleDragStart(event, item)}
                  type="button"
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black tracking-[0.24em] text-white ${
                      item.accent === 'emerald' ? 'bg-emerald-600' : 'bg-sky-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

export { DRAG_DATA_KEY };
