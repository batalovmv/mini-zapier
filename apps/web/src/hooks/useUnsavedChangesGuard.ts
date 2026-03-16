import { useCallback, useEffect, useRef } from 'react';
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
} from 'react-router-dom';

const UNSAVED_CHANGES_BYPASS_KEY = '__miniZapierBypassUnsavedChangesGuard';

interface UseUnsavedChangesGuardOptions {
  when: boolean;
  message: string;
}

interface UnsavedChangesBypassState {
  [UNSAVED_CHANGES_BYPASS_KEY]: true;
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

function hasUnsavedChangesBypass(state: unknown): state is UnsavedChangesBypassState {
  return (
    typeof state === 'object' &&
    state !== null &&
    UNSAVED_CHANGES_BYPASS_KEY in state &&
    (state as Record<string, unknown>)[UNSAVED_CHANGES_BYPASS_KEY] === true
  );
}

export function getUnsavedChangesBypassState(): UnsavedChangesBypassState {
  return {
    [UNSAVED_CHANGES_BYPASS_KEY]: true,
  };
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
      !hasUnsavedChangesBypass(nextLocation.state) &&
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
