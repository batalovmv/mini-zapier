import {
  createNodeSections,
  type EditorPaletteItem,
} from './editor-definitions';

const DRAG_DATA_KEY = 'application/x-mini-zapier-node';

const buildSteps = [
  {
    step: '1',
    title: 'Add one trigger',
    description: 'Choose how the workflow starts: webhook, cron, or inbound email.',
  },
  {
    step: '2',
    title: 'Chain actions after it',
    description: 'Drop follow-up steps that run in order after the trigger.',
  },
];

const sectionMeta = {
  Triggers: {
    title: 'Starting nodes',
    description: 'Pick exactly one node that kicks off the workflow.',
    badge: 'Step 1',
    tone: 'border-emerald-200/80 bg-emerald-50/65',
  },
  Actions: {
    title: 'Follow-up steps',
    description: 'Add actions that continue the chain after the trigger.',
    badge: 'Step 2',
    tone: 'border-sky-200/80 bg-sky-50/50',
  },
} as const;

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
    <aside className="app-panel editor-rail flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-900/10 px-5 py-5">
        <p className="muted-label">Node Library</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Start with a trigger
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The left rail is your toolbox. Drop one trigger first, then add
          actions to build the rest of the workflow.
        </p>

        <div className="mt-4 rounded-[28px] border border-slate-900/10 bg-slate-50/80 px-4 py-4 shadow-sm">
          <div className="space-y-3">
            {buildSteps.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 px-3 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {sections.map((section) => (
          <section
            key={section.title}
            className={`rounded-[30px] border px-4 py-4 shadow-sm ${sectionMeta[section.title].tone}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="muted-label">{section.title}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                  {sectionMeta[section.title].title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sectionMeta[section.title].description}
                </p>
              </div>
              <span className="rounded-full border border-slate-900/10 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                {sectionMeta[section.title].badge}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="group flex w-full cursor-grab items-start gap-3 rounded-[24px] border border-slate-900/10 bg-white/95 px-4 py-4 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-white hover:shadow-md active:cursor-grabbing"
                  data-testid={`palette-item-${item.id}`}
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
                    <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-slate-500">
                      {section.title === 'Triggers'
                        ? 'Starts the workflow'
                        : 'Runs after the trigger'}
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
