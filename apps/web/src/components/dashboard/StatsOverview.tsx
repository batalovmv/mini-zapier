import { StatsResponse } from '../../lib/api/types';
import { Spinner } from '../ui/Spinner';

interface StatsOverviewProps {
  stats: StatsResponse | null;
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

function formatValue(value: number | null, suffix = ''): string {
  if (value === null) {
    return '—';
  }

  return `${value}${suffix}`;
}

export function StatsOverview({
  stats,
  loading,
  refreshing,
}: StatsOverviewProps) {
  const cards: StatCardDefinition[] = [
    {
      label: 'Total Workflows',
      value: loading ? null : formatValue(stats?.totalWorkflows ?? null),
      description: 'All workflow definitions currently stored in the system.',
      tone: 'bg-gradient-to-br from-amber-50/95 via-white to-white',
      valueTone: 'text-amber-700',
      accent: 'bg-amber-500/70',
    },
    {
      label: 'Active Workflows',
      value: loading ? null : formatValue(stats?.activeWorkflows ?? null),
      description: 'Workflows ready to receive webhook, cron or email triggers.',
      tone: 'bg-gradient-to-br from-emerald-50/95 via-white to-white',
      valueTone: 'text-emerald-700',
      accent: 'bg-emerald-500/70',
    },
    {
      label: 'Total Executions',
      value: loading ? null : formatValue(stats?.totalExecutions ?? null),
      description: 'Manual and trigger-driven runs recorded by the backend.',
      tone: 'bg-gradient-to-br from-sky-50/95 via-white to-white',
      valueTone: 'text-sky-700',
      accent: 'bg-sky-500/70',
    },
    {
      label: 'Success Rate',
      value: loading ? null : formatValue(stats?.successRate ?? null, '%'),
      description: 'Calculated from successful versus failed completed executions.',
      tone: 'bg-gradient-to-br from-white via-white to-slate-50',
      valueTone: 'text-slate-900',
      accent: 'bg-slate-500/60',
    },
  ];

  return (
    <section className="app-panel overflow-hidden p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Stats overview</p>
          <h2 className="mt-2 text-[1.95rem] font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">
            Platform health at a glance
          </h2>
        </div>

        <p className="app-chip w-fit">
          {refreshing && !loading
            ? 'Refreshing latest workflow and execution data...'
            : `Paused workflows: ${stats?.pausedWorkflows ?? '—'}`}
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
                  <span className="text-sm font-medium">Loading...</span>
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
