import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { ScreenActivityContext, useDecorativeAnimations } from './use-decorative-animations';

let mockAnimationsEnabled = true;
jest.mock('@/hooks/use-theme-preference', () => ({
  useThemePreference: () => ({ animationsEnabled: mockAnimationsEnabled }),
}));

describe('decorative animation activity', () => {
  afterEach(() => jest.restoreAllMocks());
  it('shares one native listener, stops in background and honors focus and preferences', async () => {
    let onState!: (state: AppStateStatus) => void;
    const remove = jest.fn();
    const listen = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      onState = listener;
      return { remove };
    });
    mockAnimationsEnabled = true;
    const rendered = renderHook(() => [useDecorativeAnimations(), useDecorativeAnimations()]);
    await waitFor(() => expect(rendered.result.current).toEqual([true, true]));
    expect(listen).toHaveBeenCalledTimes(1);
    act(() => onState('background'));
    expect(rendered.result.current).toEqual([false, false]);
    act(() => onState('active'));
    expect(rendered.result.current).toEqual([true, true]);
    mockAnimationsEnabled = false;
    rendered.rerender(undefined);
    expect(rendered.result.current).toEqual([false, false]);
    rendered.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    mockAnimationsEnabled = true;
    const hidden = renderHook(() => useDecorativeAnimations(), {
      wrapper: ({ children }) => <ScreenActivityContext value={false}>{children}</ScreenActivityContext>,
    });
    expect(hidden.result.current).toBe(false);
  });
});
