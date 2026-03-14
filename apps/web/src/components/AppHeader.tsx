import toast from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';

import { useLocale } from '../locale/LocaleProvider';
import { logout } from '../lib/api/auth';
import { getApiErrorMessage } from '../lib/api/client';

function getNavLinkClassName(isActive: boolean): string {
  return [
    'min-w-0 flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold whitespace-nowrap transition-all duration-150 sm:flex-none',
    isActive
      ? 'bg-slate-950 text-white shadow-[0_16px_28px_-18px_rgba(15,23,42,0.72)]'
      : 'text-slate-600 hover:bg-white hover:text-slate-950',
  ].join(' ');
}

export function AppHeader() {
  const navigate = useNavigate();
  const { locale, setLocale, messages } = useLocale();

  const navigationItems = [
    {
      to: '/',
      label: messages.header.navigation.dashboard,
      end: true,
    },
    {
      to: '/workflows/new/edit',
      label: messages.header.navigation.createWorkflow,
    },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, messages.errors));
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-900/12 bg-[#fcfaf6]/72 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.55)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 xl:px-6">
        <NavLink
          className="flex min-w-0 items-center gap-3 rounded-full pr-2 transition hover:opacity-95"
          to="/"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(180deg,#d97706_0%,#b45309_100%)] text-sm font-black uppercase tracking-[0.28em] text-white shadow-[0_18px_30px_-18px_rgba(141,69,20,0.58)] ring-1 ring-white/30">
            MZ
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
              {messages.header.brandTitle}
            </span>
            <span className="block text-sm text-slate-500">
              {messages.header.brandSubtitle}
            </span>
          </span>
        </NavLink>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <nav className="app-subpanel flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-1.5 py-1.5 sm:flex-none sm:gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) => getNavLinkClassName(isActive)}
                end={item.end}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div
              aria-label={messages.common.languageLabel}
              className="app-subpanel flex items-center gap-1 rounded-full px-1.5 py-1.5"
              role="group"
            >
              {(['en', 'ru'] as const).map((option) => {
                const active = option === locale;

                return (
                  <button
                    key={option}
                    aria-pressed={active}
                    className={[
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      active
                        ? 'bg-slate-950 text-white shadow-[0_10px_18px_-12px_rgba(15,23,42,0.7)]'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950',
                    ].join(' ')}
                    onClick={() => setLocale(option)}
                    type="button"
                  >
                    {messages.common.localeOptions[option]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              {messages.header.logout}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
