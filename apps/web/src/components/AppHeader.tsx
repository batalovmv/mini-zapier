import toast from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';

import { logout } from '../lib/api/auth';
import { getApiErrorMessage } from '../lib/api/client';

const navigationItems = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
  },
  {
    to: '/workflows/new/edit',
    label: 'Create Workflow',
  },
];

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

  async function handleLogout() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
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
              Mini-Zapier
            </span>
            <span className="block text-sm text-slate-500">
              Workflow control center
            </span>
          </span>
        </NavLink>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
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
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-full border border-slate-900/10 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
