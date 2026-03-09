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
      tone: 'bg-amber-50/80',
    },
    {
      label: 'Active Workflows',
      value: loading ? null : formatValue(stats?.activeWorkflows ?? null),
      description: 'Workflows ready to receive webhook, cron or email triggers.',
      tone: 'bg-emerald-50/80',
    },
    {
      label: 'Total Executions',
      value: loading ? null : formatValue(stats?.totalExecutions ?? null),
      description: 'Manual and trigger-driven runs recorded by the backend.',
      tone: 'bg-sky-50/80',
    },
    {
      label: 'Success Rate',
      value: loading ? null : formatValue(stats?.successRate ?? null, '%'),
      description: 'Calculated from successful versus failed completed executions.',
      tone: 'bg-white',
    },
  ];

  return (
    <section className="app-panel p-8">
      <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted-label">Stats overview</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Platform health at a glance
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          {refreshing && !loading
            ? 'Refreshing latest workflow and execution data...'
            : `Paused workflows: ${stats?.pausedWorkflows ?? '—'}`}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border border-slate-900/10 p-5 ${card.tone}`}
          >
            <p className="muted-label">{card.label}</p>
            <div className="mt-3 min-h-10">
              {card.value === null ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <Spinner size="sm" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-semibold text-slate-900">
                  {card.value}
                </p>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
