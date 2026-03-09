import { NavLink, Outlet } from 'react-router-dom';

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
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
  ].join(' ');
}

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-900/10 bg-[#fcfaf6]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <NavLink
            className="flex items-center gap-3"
            to="/"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-sm font-black uppercase tracking-[0.28em] text-white shadow-lg shadow-amber-900/20">
              MZ
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                Mini-Zapier
              </span>
              <span className="block text-sm text-slate-500">
                Frontend scaffold
              </span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 p-1 shadow-lg shadow-slate-900/5">
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
