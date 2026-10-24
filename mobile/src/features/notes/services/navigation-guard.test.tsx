import { act, renderHook } from '@testing-library/react-native';

import { NotesNavigationGuardProvider, useNotesNavigationGuard } from './navigation-guard';

describe('Notes navigation guard', () => {
  it('permits leaving when no editor is registered and after unregistering', async () => {
    const { result } = renderHook(useNotesNavigationGuard, { wrapper: NotesNavigationGuardProvider });
    await expect(result.current.requestLeave()).resolves.toBe(true);
    const guard = jest.fn(async () => false);
    const unregister = result.current.registerGuard(guard);
    await expect(result.current.requestLeave()).resolves.toBe(false);
    unregister();
    await expect(result.current.requestLeave()).resolves.toBe(true);
    expect(guard).toHaveBeenCalledTimes(1);
  });

  it('coalesces simultaneous leave attempts into one pending guard', async () => {
    const { result } = renderHook(useNotesNavigationGuard, { wrapper: NotesNavigationGuardProvider });
    let allow!: (allowed: boolean) => void;
    const guarded = new Promise<boolean>((resolve) => { allow = resolve; });
    const guard = jest.fn(() => guarded);
    result.current.registerGuard(guard);
    const first = result.current.requestLeave();
    expect(result.current.requestLeave()).toBe(first);
    await act(async () => { await Promise.resolve(); });
    expect(guard).toHaveBeenCalledTimes(1);
    allow(true);
    await expect(first).resolves.toBe(true);
    await expect(result.current.requestLeave()).resolves.toBe(true);
    expect(guard).toHaveBeenCalledTimes(2);
  });

  it('does not unregister a newer editor when an older editor blurs', async () => {
    const { result } = renderHook(useNotesNavigationGuard, { wrapper: NotesNavigationGuardProvider });
    const unregisterOld = result.current.registerGuard(async () => true);
    const newer = jest.fn(async () => false);
    result.current.registerGuard(newer);
    unregisterOld();
    await expect(result.current.requestLeave()).resolves.toBe(false);
    expect(newer).toHaveBeenCalledTimes(1);
  });

  it('blocks a rejected guard and allows another attempt', async () => {
    const { result } = renderHook(useNotesNavigationGuard, { wrapper: NotesNavigationGuardProvider });
    const guard = jest.fn(async () => true).mockRejectedValueOnce(new Error('Write failed'));
    result.current.registerGuard(guard);
    await expect(result.current.requestLeave()).resolves.toBe(false);
    await expect(result.current.requestLeave()).resolves.toBe(true);
  });
});
