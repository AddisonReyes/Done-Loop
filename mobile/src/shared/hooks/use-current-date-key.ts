import { createContext, createElement, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toDateKey } from '@/shared/utils/date';

function getNextLocalMidnightDelay(): number {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(nextMidnight.getTime() - now.getTime() + 1000, 1000);
}

const CurrentDateContext = createContext<string | null>(null);

export function CurrentDateProvider({ children }: PropsWithChildren) {
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const refreshDateKey = () => {
      setDateKey(toDateKey(new Date()));
    };

    const scheduleNextRefresh = () => {
      timeout = setTimeout(() => {
        refreshDateKey();
        scheduleNextRefresh();
      }, getNextLocalMidnightDelay());
    };

    scheduleNextRefresh();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDateKey();
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, []);

  return createElement(CurrentDateContext.Provider, { value: dateKey }, children);
}

export function useCurrentDateKey(): string {
  const dateKey = useContext(CurrentDateContext);

  if (!dateKey) {
    throw new Error('useCurrentDateKey must be used inside CurrentDateProvider');
  }

  return dateKey;
}
