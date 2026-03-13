import { Outlet } from 'react-router-dom';

import { AppHeader } from '../components/AppHeader';

export function EditorLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex min-h-0 flex-1 flex-col px-4 py-6 xl:px-6">
        <Outlet />
      </main>
    </div>
  );
}
