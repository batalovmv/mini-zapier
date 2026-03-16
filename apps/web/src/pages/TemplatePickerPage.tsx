import { Link, useNavigate } from 'react-router-dom';

import { useLocale } from '../locale/LocaleProvider';
import {
  WORKFLOW_TEMPLATE_DEFINITIONS,
  type WorkflowTemplateDefinition,
} from '../lib/workflow-templates';

const TEMPLATE_ACCENT_STYLES: Record<
  WorkflowTemplateDefinition['accent'],
  {
    card: string;
    icon: string;
    tag: string;
  }
> = {
  emerald: {
    card:
      'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.98)_100%)] hover:border-emerald-300 hover:shadow-[0_24px_42px_-26px_rgba(5,150,105,0.34)]',
    icon: 'bg-emerald-600 text-white',
    tag: 'text-emerald-700',
  },
  amber: {
    card:
      'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(255,255,255,0.98)_100%)] hover:border-amber-300 hover:shadow-[0_24px_42px_-26px_rgba(217,119,6,0.34)]',
    icon: 'bg-amber-600 text-white',
    tag: 'text-amber-700',
  },
};

export function TemplatePickerPage() {
  const navigate = useNavigate();
  const { messages } = useLocale();

  function handleTemplateClick(templateId: WorkflowTemplateDefinition['id']) {
    navigate('/workflows/new/edit', {
      state: { templateId },
    });
  }

  function handleBlankClick() {
    navigate('/workflows/new/edit');
  }

  return (
    <div className="space-y-7 xl:space-y-8">
      <section className="app-panel app-panel-strong overflow-hidden">
        <div className="border-b border-slate-900/10 px-6 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="muted-label">{messages.dashboardPage.eyebrow}</p>
              <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.45rem] sm:leading-[1.06]">
                {messages.templatePickerPage.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                {messages.templatePickerPage.subtitle}
              </p>
            </div>

            <Link
              className="inline-flex self-start rounded-full border border-slate-900/10 bg-white/88 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white lg:self-end"
              to="/"
            >
              &larr; {messages.common.back}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {WORKFLOW_TEMPLATE_DEFINITIONS.map((template) => {
          const accentStyles = TEMPLATE_ACCENT_STYLES[template.accent];

          return (
            <button
              key={template.id}
              className={`group app-panel overflow-hidden border p-0 text-left transition ${accentStyles.card}`}
              data-testid={`template-card-${template.id}`}
              onClick={() => handleTemplateClick(template.id)}
              type="button"
            >
              <div className="flex h-full flex-col px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] text-sm font-black uppercase tracking-[0.28em] shadow-[0_18px_30px_-20px_rgba(15,23,42,0.4)] ${accentStyles.icon}`}
                  >
                    {template.icon}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${accentStyles.tag}`}
                  >
                    {messages.templatePickerPage.templateBadge}
                  </span>
                </div>

                <h2 className="mt-5 text-[1.45rem] font-semibold tracking-tight text-slate-900">
                  {messages.templatePickerPage[template.nameKey]}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {messages.templatePickerPage[template.descriptionKey]}
                </p>
              </div>
            </button>
          );
        })}

        <button
          className="group app-panel overflow-hidden border border-slate-900/10 bg-[linear-gradient(180deg,rgba(248,250,252,0.94)_0%,rgba(255,255,255,0.98)_100%)] p-0 text-left transition hover:border-slate-300 hover:shadow-[0_24px_42px_-26px_rgba(15,23,42,0.22)]"
          data-testid="template-card-blank"
          onClick={handleBlankClick}
          type="button"
        >
          <div className="flex h-full flex-col px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-slate-900 text-sm font-black uppercase tracking-[0.28em] text-white shadow-[0_18px_30px_-20px_rgba(15,23,42,0.4)]">
                BL
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {messages.templatePickerPage.blankBadge}
              </span>
            </div>

            <h2 className="mt-5 text-[1.45rem] font-semibold tracking-tight text-slate-900">
              {messages.templatePickerPage.blankTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {messages.templatePickerPage.blankDescription}
            </p>
          </div>
        </button>
      </section>
    </div>
  );
}
