/** Shares only active reads. Settled values never become a stale data cache. */
export function createSharedReads() {
  const pending = new Map<string, Promise<unknown>>();
  return {
    read<T>(key: string, load: () => Promise<T>): Promise<T> {
      const existing = pending.get(key);
      if (existing) return existing as Promise<T>;
      const operation = Promise.resolve().then(load).finally(() => {
        if (pending.get(key) === operation) pending.delete(key);
      });
      pending.set(key, operation);
      return operation;
    },
    invalidate(): void { pending.clear(); },
  };
}
