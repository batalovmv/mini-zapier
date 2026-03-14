import { Outlet } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="relative mx-auto max-w-[1700px] px-4 py-6 sm:px-5 sm:py-7 xl:px-6 xl:py-8">
        <Outlet />
      </main>
    </div>
  );
}
