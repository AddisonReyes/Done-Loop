import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { emitAppEvent } from '@/shared/events/app-events';
import { useDomainRefresh } from './use-domain-refresh';

describe('visible domain refresh', () => {
  let onState: (state: AppStateStatus) => void;
  const remove = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      onState = listener;
      return { remove };
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('defers hidden events until focus and groups IDs from a visible burst', async () => {
    const refresh = jest.fn(async (_ids: ReadonlySet<string> | null) => undefined);
    const rendered = renderHook(({ focused }: { focused: boolean }) => useDomainRefresh('notesChanged', 'self', focused, refresh),
      { initialProps: { focused: false } });
    await act(async () => { emitAppEvent('notesChanged', { id: 'hidden' }); });
    expect(refresh).not.toHaveBeenCalled();
    rendered.rerender({ focused: true });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(refresh).toHaveBeenLastCalledWith(null);
    await act(async () => {
      emitAppEvent('notesChanged', { id: 'one' });
      emitAppEvent('notesChanged', { id: 'two' });
      emitAppEvent('notesChanged', { id: 'one' });
      emitAppEvent('notesChanged', { id: 'own', source: 'self' });
    });
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenLastCalledWith(new Set(['one', 'two']));
    rendered.unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('does no work in background and refreshes on return without polling', async () => {
    const refresh = jest.fn(async () => undefined);
    renderHook(() => useDomainRefresh('habitsChanged', 'self', true, refresh));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await act(async () => {
      onState('background');
      emitAppEvent('habitsChanged');
      emitAppEvent('habitsChanged');
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => { onState('active'); });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('serializes invalidations during a read and retries failures only on the next trigger', async () => {
    let finish!: () => void;
    const refresh = jest.fn((_ids: ReadonlySet<string> | null) => new Promise<void>((resolve) => { finish = resolve; }));
    renderHook(() => useDomainRefresh('notesChanged', 'self', true, refresh));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await act(async () => {
      emitAppEvent('notesChanged', { id: 'one' });
      emitAppEvent('notesChanged', { id: 'two' });
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    refresh.mockRejectedValueOnce(new Error('read failed'));
    await act(async () => { finish(); });
    expect(refresh).toHaveBeenCalledTimes(2);
    refresh.mockResolvedValueOnce(undefined);
    await act(async () => { emitAppEvent('notesChanged'); });
    expect(refresh).toHaveBeenCalledTimes(3);
    expect(refresh).toHaveBeenLastCalledWith(null);
  });
});
