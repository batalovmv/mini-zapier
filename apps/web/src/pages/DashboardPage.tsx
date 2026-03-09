import { WorkflowDto } from '@mini-zapier/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getApiErrorMessage } from '../lib/api/client';
import { listWorkflows } from '../lib/api/workflows';
import { getStats } from '../lib/api/stats';
import { PaginatedResponse, StatsResponse } from '../lib/api/types';

interface DashboardState {
  stats: StatsResponse | null;
  workflows: PaginatedResponse<WorkflowDto> | null;
  error: string | null;
}

export function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    stats: null,
    workflows: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [stats, workflows] = await Promise.all([
          getStats(),
          listWorkflows({ page: 1, limit: 5 }),
        ]);

        if (!isActive) {
          return;
        }

        setState({
          stats,
          workflows,
          error: null,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: getApiErrorMessage(error),
        }));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="app-panel overflow-hidden">
          <div className="border-b border-slate-900/10 px-8 py-8">
            <p className="muted-label">Dashboard</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900">
              React frontend scaffold is wired to the existing API.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              This placeholder page stays inside TASK-013 scope: routing,
              layout, Tailwind and the API client are ready for the next
              frontend slices.
            </p>
          </div>

          <div className="grid gap-4 p-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-900/10 bg-amber-50/80 p-5">
              <p className="muted-label">API</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {isLoading ? 'Checking...' : state.error ? 'Unavailable' : 'Connected'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                GET /api/workflows and GET /api/stats go through the Vite proxy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <p className="muted-label">Workflows</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {state.stats?.totalWorkflows ?? '—'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Total workflows reported by `/api/stats`.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <p className="muted-label">Active</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {state.stats?.activeWorkflows ?? '—'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Ready for TASK-014 dashboard actions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/10 bg-white p-5">
              <p className="muted-label">Success Rate</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {state.stats ? `${state.stats.successRate}%` : '—'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Stats endpoint is already typed in the client layer.
              </p>
            </div>
          </div>
        </div>

        <aside className="app-panel p-8">
          <p className="muted-label">Routes</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Frontend skeleton routes
          </h2>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 transition hover:border-amber-500/50 hover:bg-amber-50"
              to="/"
            >
              <span>Dashboard</span>
              <span className="status-pill">/</span>
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 transition hover:border-amber-500/50 hover:bg-amber-50"
              to="/workflows/new/edit"
            >
              <span>Workflow Editor</span>
              <span className="status-pill">/workflows/:id/edit</span>
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 transition hover:border-amber-500/50 hover:bg-amber-50"
              to="/workflows/new/history"
            >
              <span>Execution History</span>
              <span className="status-pill">/workflows/:id/history</span>
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="app-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="muted-label">Workflow API</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                Latest workflows
              </h2>
            </div>
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              to="/workflows/new/edit"
            >
              Create workflow
            </Link>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <p className="text-sm text-slate-600">
                Loading API data through the shared axios client...
              </p>
            ) : state.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {state.error}
              </div>
            ) : state.workflows && state.workflows.items.length > 0 ? (
              <ul className="space-y-3">
                {state.workflows.items.map((workflow) => (
                  <li
                    key={workflow.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-900/10 bg-white px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {workflow.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Version {workflow.version} · {workflow.timezone}
                      </p>
                    </div>
                    <span className="status-pill">{workflow.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">
                API request succeeded, but no workflows exist yet.
              </p>
            )}
          </div>
        </div>

        <div className="app-panel p-8">
          <p className="muted-label">Next slices</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            What TASK-013 leaves for later
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <li>Dashboard widgets and actions move to TASK-014.</li>
            <li>React Flow editor and node forms move to TASK-015.</li>
            <li>Execution list, step logs and polling move to TASK-016.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
