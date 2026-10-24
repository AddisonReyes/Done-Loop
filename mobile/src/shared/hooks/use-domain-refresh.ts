import { useEffect, useLayoutEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { subscribeToAppEvent, type AppEventName } from '@/shared/events/app-events';

/** Hidden screens remember invalidations without querying or updating their UI. */
export function useDomainRefresh(event: AppEventName, source: string, isFocused: boolean,
  refresh: (ids: ReadonlySet<string> | null) => Promise<unknown>, queryKey = '') {
  const dirty = useRef(true);
  const refreshRef = useRef(refresh);
  useLayoutEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    let active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    let disposed = false;
    let scheduled = false;
    let running = false;
    let ids: Set<string> | null = null;
    const request = () => {
      if (!isFocused || !active || scheduled || running || disposed || !dirty.current) return;
      scheduled = true;
      void Promise.resolve().then(async () => {
        scheduled = false;
        if (disposed || !active || !dirty.current) return;
        dirty.current = false;
        running = true;
        const changes = ids;
        ids = new Set();
        try { await refreshRef.current(changes); } catch { ids = null; }
        finally { running = false; request(); }
      });
    };
    // A visible screen also refreshes when its query parameters change.
    dirty.current = true;
    request();
    const unsubscribe = subscribeToAppEvent(event, (payload) => {
      if (payload.source === source) return;
      if (!payload.id) ids = null;
      else ids?.add(payload.id);
      dirty.current = true;
      request();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      const wasActive = active;
      active = state === 'active';
      if (active && !wasActive) { dirty.current = true; ids = null; request(); }
    });
    return () => { disposed = true; unsubscribe(); subscription.remove(); };
  }, [event, source, isFocused, queryKey]);
}
