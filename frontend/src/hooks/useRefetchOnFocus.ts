import { useEffect, useRef } from 'react';

const FOCUS_EVENT = 'focus';

/**
 * Refetches when the tab regains focus, so a booking's status reflects what the
 * server decided while the tab was in the background.
 *
 * The no-show release and the completion sweep both run on a node-cron tick
 * (Phase 9) and emit no socket event — Phase 13 shipped no `NO_SHOW_RELEASED`
 * type on purpose — so a poll or a refetch is the only way a client can learn
 * about them. Refetching on focus is the cheap half of that: no recurring
 * traffic, and the list is correct the moment you look at it again.
 *
 * `onRefetch` is held in a ref so a caller can pass an inline arrow function
 * without re-subscribing on every render.
 */
export const useRefetchOnFocus = (onRefetch: () => void) => {
  const handler = useRef(onRefetch);
  handler.current = onRefetch;

  useEffect(() => {
    const listener = () => handler.current();
    window.addEventListener(FOCUS_EVENT, listener);
    return () => window.removeEventListener(FOCUS_EVENT, listener);
  }, []);
};
