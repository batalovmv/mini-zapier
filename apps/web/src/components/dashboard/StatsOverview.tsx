import { DashboardSummaryStats } from '../../lib/api/types';
import { useLocale } from '../../locale/LocaleProvider';
import { Spinner } from '../ui/Spinner';

interface StatsOverviewProps {
  stats: DashboardSummaryStats | null;
  loading: boolean;
  refreshing: boolean;
}

interface StatCardDefinition {
  label: string;
  value: string | null;
  description: string;
  tone: string;
  valueTone: string;
  accent: string;
}

export function StatsOverview({
  stats,
  loading,
  refreshing,
}: StatsOverviewProps) {
  const { messages, formatNumber } = useLocale();

  function formatValue(value: number | null, suffix = ''): string {
    if (value === null) {
      return messages.common.emptyValue;
    }

    return `${formatNumber(value)}${suffix}`;
  }

  const cards: StatCardDefinition[] = [
    {
      label: messages.statsOverview.cards.totalWorkflows.label,
      value: loading ? null : formatValue(stats?.totalWorkflows ?? null),
      description: messages.statsOverview.cards.totalWorkflows.description,
      tone: 'bg-gradient-to-br from-amber-50/95 via-white to-white',
      valueTone: 'text-amber-700',
      accent: 'bg-amber-500/70',
    },
    {
      label: messages.statsOverview.cards.activeWorkflows.label,
      value: loading ? null : formatValue(stats?.activeWorkflows ?? null),
      description: messages.statsOverview.cards.activeWorkflows.description,
      tone: 'bg-gradient-to-br from-emerald-50/95 via-white to-white',
      valueTone: 'text-emerald-700',
      accent: 'bg-emerald-500/70',
    },
    {
      label: messages.statsOverview.cards.totalExecutions.label,
      value: loading ? null : formatValue(stats?.totalExecutions ?? null),
      description: messages.statsOverview.cards.totalExecutions.description,
      tone: 'bg-gradient-to-br from-sky-50/95 via-white to-white',
      valueTone: 'text-sky-700',
      accent: 'bg-sky-500/70',
    },
    {
      label: messages.statsOverview.cards.successRate.label,
      value: loading ? null : formatValue(stats?.successRate ?? null, '%'),
      description: messages.statsOverview.cards.successRate.description,
      tone: 'bg-gradient-to-br from-white via-white to-slate-50',
      valueTone: 'text-slate-900',
      accent: 'bg-slate-500/60',
    },
  ];

  return (
    <section className="app-panel overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">{messages.statsOverview.eyebrow}</p>
          <h2 className="mt-2 text-[1.95rem] font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">
            {messages.statsOverview.title}
          </h2>
        </div>

        <p className="app-chip w-fit">
          {refreshing && !loading
            ? messages.statsOverview.refreshing
            : messages.statsOverview.pausedWorkflows(stats?.pausedWorkflows ?? null)}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`relative overflow-hidden rounded-[1.85rem] border border-slate-900/12 p-5 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.38)] ring-1 ring-white/50 ${card.tone}`}
          >
            <p className="muted-label">{card.label}</p>
            <span className={`mt-3 block h-1.5 w-14 rounded-full ${card.accent}`} />
            <div className="mt-4 min-h-12">
              {card.value === null ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <Spinner size="sm" />
                  <span className="text-sm font-medium">{messages.statsOverview.loading}</span>
                </div>
              ) : (
                <p className={`text-[2.25rem] font-semibold tracking-tight ${card.valueTone}`}>
                  {card.value}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
