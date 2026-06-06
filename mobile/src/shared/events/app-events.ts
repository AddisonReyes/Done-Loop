type AppEventName = 'habitsChanged' | 'todosChanged';
type AppEventPayload = {
  source?: string;
};
type AppEventListener = (payload: AppEventPayload) => void;

const listenersByEvent = new Map<AppEventName, Set<AppEventListener>>();
let nextEventSourceId = 0;

export function createAppEventSource(prefix: string): string {
  nextEventSourceId += 1;
  return `${prefix}_${nextEventSourceId}`;
}

export function emitAppEvent(eventName: AppEventName, payload: AppEventPayload = {}): void {
  listenersByEvent.get(eventName)?.forEach((listener) => {
    listener(payload);
  });
}

export function subscribeToAppEvent(eventName: AppEventName, listener: AppEventListener): () => void {
  const listeners = listenersByEvent.get(eventName) ?? new Set<AppEventListener>();
  listeners.add(listener);
  listenersByEvent.set(eventName, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByEvent.delete(eventName);
    }
  };
}
