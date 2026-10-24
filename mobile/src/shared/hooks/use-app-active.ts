import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

const listeners = new Set<() => void>();
let subscription: ReturnType<typeof AppState.addEventListener> | null = null;
let active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!subscription) {
    active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    subscription = AppState.addEventListener('change', (state) => {
      const next = state === 'active';
      if (next !== active) { active = next; listeners.forEach((notify) => notify()); }
    });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { subscription?.remove(); subscription = null; }
  };
}

export function useAppActive(): boolean {
  return useSyncExternalStore(subscribe, () => active, () => true);
}
