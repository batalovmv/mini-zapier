import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { getMe } from '../../lib/api/auth';

export function ProtectedRoute() {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    getMe()
      .then(() => setState('authenticated'))
      .catch(() => setState('unauthenticated'));
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
