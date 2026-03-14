import { Link } from 'react-router-dom';

import { useLocale } from '../locale/LocaleProvider';

export function NotFoundPage() {
  const { messages } = useLocale();

  return (
    <section className="app-panel p-8">
      <p className="muted-label">{messages.notFoundPage.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        {messages.notFoundPage.title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
        {messages.notFoundPage.description}
      </p>
      <Link
        className="mt-8 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        to="/"
      >
        {messages.notFoundPage.action}
      </Link>
    </section>
  );
}
