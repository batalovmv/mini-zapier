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
      valueTone: 'text-slate-900',
      accent: 'bg-amber-500/80',
    },
    {
      label: messages.statsOverview.cards.activeWorkflows.label,
      value: loading ? null : formatValue(stats?.activeWorkflows ?? null),
      description: messages.statsOverview.cards.activeWorkflows.description,
      valueTone: 'text-emerald-700',
      accent: 'bg-emerald-500/80',
    },
    {
      label: messages.statsOverview.cards.totalExecutions.label,
      value: loading ? null : formatValue(stats?.totalExecutions ?? null),
      description: messages.statsOverview.cards.totalExecutions.description,
      valueTone: 'text-slate-900',
      accent: 'bg-sky-500/80',
    },
    {
      label: messages.statsOverview.cards.successRate.label,
      value: loading ? null : formatValue(stats?.successRate ?? null, '%'),
      description: messages.statsOverview.cards.successRate.description,
      valueTone: 'text-slate-900',
      accent: 'bg-slate-500/70',
    },
  ];

  return (
    <section className="app-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-900/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">{messages.statsOverview.eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.6rem]">
            {messages.statsOverview.title}
          </h2>
        </div>

        <p className="app-chip w-fit">
          {refreshing && !loading
            ? messages.statsOverview.refreshing
            : messages.statsOverview.pausedWorkflows(stats?.pausedWorkflows ?? null)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="dashboard-stat-card">
            <span className={`block h-1.5 w-10 rounded-full ${card.accent}`} />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {card.label}
            </p>
            <div className="mt-3 min-h-10">
              {card.value === null ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <Spinner size="sm" />
                  <span className="text-sm font-medium">{messages.statsOverview.loading}</span>
                </div>
              ) : (
                <p className={`text-[1.9rem] font-semibold tracking-tight ${card.valueTone}`}>
                  {card.value}
                </p>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
