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
    },
    {
      label: 'Active Workflows',
      value: loading ? null : formatValue(stats?.activeWorkflows ?? null),
      description: 'Workflows ready to receive webhook, cron or email triggers.',
      tone: 'bg-gradient-to-br from-emerald-50/95 via-white to-white',
      valueTone: 'text-emerald-700',
    },
    {
      label: 'Total Executions',
      value: loading ? null : formatValue(stats?.totalExecutions ?? null),
      description: 'Manual and trigger-driven runs recorded by the backend.',
      tone: 'bg-gradient-to-br from-sky-50/95 via-white to-white',
      valueTone: 'text-sky-700',
    },
    {
      label: 'Success Rate',
      value: loading ? null : formatValue(stats?.successRate ?? null, '%'),
      description: 'Calculated from successful versus failed completed executions.',
      tone: 'bg-gradient-to-br from-white via-white to-slate-50',
      valueTone: 'text-slate-900',
    },
  ];

  return (
    <section className="app-panel p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Stats overview</p>
          <h2 className="mt-2 text-[1.9rem] font-semibold tracking-tight text-slate-900 sm:text-[2.15rem]">
            Platform health at a glance
          </h2>
        </div>

        <p className="inline-flex w-fit items-center rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
          {refreshing && !loading
            ? 'Refreshing latest workflow and execution data...'
            : `Paused workflows: ${stats?.pausedWorkflows ?? '—'}`}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`rounded-[1.75rem] border border-slate-900/10 p-5 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.45)] ${card.tone}`}
          >
            <p className="muted-label">{card.label}</p>
            <div className="mt-4 min-h-12">
              {card.value === null ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <Spinner size="sm" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : (
                <p className={`text-[2.2rem] font-semibold tracking-tight ${card.valueTone}`}>
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
