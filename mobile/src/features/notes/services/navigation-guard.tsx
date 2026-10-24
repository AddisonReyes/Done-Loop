import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';

type LeaveGuard = () => Promise<boolean>;
type NotesNavigationGuard = {
  registerGuard: (guard: LeaveGuard) => () => void;
  requestLeave: () => Promise<boolean>;
};

const NotesNavigationGuardContext = createContext<NotesNavigationGuard | null>(null);

export function NotesNavigationGuardProvider({ children }: PropsWithChildren) {
  const guardRef = useRef<LeaveGuard | null>(null);
  const pendingRef = useRef<Promise<boolean> | null>(null);

  const registerGuard = useCallback((guard: LeaveGuard) => {
    guardRef.current = guard;
    return () => {
      if (guardRef.current === guard) {
        guardRef.current = null;
      }
    };
  }, []);

  const requestLeave = useCallback((): Promise<boolean> => {
    if (pendingRef.current) {
      return pendingRef.current;
    }
    const guard = guardRef.current;
    if (!guard) {
      return Promise.resolve(true);
    }

    const pending = Promise.resolve().then(guard).catch(() => false).finally(() => {
      if (pendingRef.current === pending) {
        pendingRef.current = null;
      }
    });
    pendingRef.current = pending;
    return pending;
  }, []);

  const value = useMemo(() => ({ registerGuard, requestLeave }), [registerGuard, requestLeave]);
  return <NotesNavigationGuardContext.Provider value={value}>{children}</NotesNavigationGuardContext.Provider>;
}

export function useNotesNavigationGuard(): NotesNavigationGuard {
  const context = useContext(NotesNavigationGuardContext);
  if (!context) {
    throw new Error('useNotesNavigationGuard must be used within NotesNavigationGuardProvider');
  }
  return context;
}
