import { Outlet } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';

export function EditorLayout() {
  return (
    <div className="flex min-h-screen flex-col xl:h-screen">
      <AppHeader />

      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 xl:overflow-hidden xl:px-6 xl:py-5">
        <Outlet />
      </main>
    </div>
  );
}
