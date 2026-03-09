import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="app-panel p-8">
      <p className="muted-label">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        Route not found
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
        This frontend slice only registers the dashboard, editor placeholder and
        history placeholder routes.
      </p>
      <Link
        className="mt-8 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        to="/"
      >
        Return to dashboard
      </Link>
    </section>
  );
}
