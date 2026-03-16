import { useCallback, useEffect, useRef } from 'react';
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
} from 'react-router-dom';

interface UseUnsavedChangesGuardOptions {
  when: boolean;
  message: string;
}

function hasLocationChanged(
  currentPathname: string,
  currentSearch: string,
  currentHash: string,
  nextPathname: string,
  nextSearch: string,
  nextHash: string,
): boolean {
  return (
    currentPathname !== nextPathname ||
    currentSearch !== nextSearch ||
    currentHash !== nextHash
  );
}

export function useUnsavedChangesGuard({
  when,
  message,
}: UseUnsavedChangesGuardOptions) {
  const location = useLocation();
  const allowNextNavigationRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      !allowNextNavigationRef.current &&
      hasLocationChanged(
        currentLocation.pathname,
        currentLocation.search,
        currentLocation.hash,
        nextLocation.pathname,
        nextLocation.search,
        nextLocation.hash,
      ),
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    const shouldDiscard = window.confirm(message);

    if (shouldDiscard) {
      allowNextNavigationRef.current = true;
      blocker.proceed();
      return;
    }

    blocker.reset();
  }, [blocker, message]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!when) {
          return;
        }

        event.preventDefault();
        event.returnValue = '';
      },
      [when],
    ),
  );

  useEffect(() => {
    allowNextNavigationRef.current = false;
  }, [location.pathname, location.search, location.hash]);

  const allowNextNavigation = useCallback(() => {
    allowNextNavigationRef.current = true;
  }, []);

  return { allowNextNavigation };
}
