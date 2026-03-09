import { Link, useParams } from 'react-router-dom';

export function ExecutionHistoryPage() {
  const { id = 'new' } = useParams();

  return (
    <section className="app-panel p-8">
      <p className="muted-label">History route</p>
      <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Execution history placeholder
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Route registration is complete. Execution tables, step log viewer
            and polling remain in TASK-016.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-900/10 bg-sky-50 px-5 py-4">
          <p className="muted-label">Workflow id</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{id}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <p className="muted-label">Route</p>
          <p className="mt-2 text-sm text-slate-600">/workflows/:id/history</p>
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-white p-5">
          <p className="muted-label">Next task</p>
          <p className="mt-2 text-sm text-slate-600">
            Execution table and step logs arrive in TASK-016.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          to="/"
        >
          Back to dashboard
        </Link>
        <Link
          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-500/50 hover:bg-amber-50"
          to={`/workflows/${id}/edit`}
        >
          Open editor route
        </Link>
      </div>
    </section>
  );
}
