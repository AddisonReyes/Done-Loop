import { act, renderHook, render } from '@testing-library/react-native';
import { Text, AppState, type AppStateStatus } from 'react-native';

import { CurrentDateProvider, useCurrentDateKey } from './use-current-date-key';

function DateConsumer({ label }: { label: string }) {
  const dateKey = useCurrentDateKey();

  return <Text>{`${label}:${dateKey}`}</Text>;
}

describe('CurrentDateProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 3, 12, 0, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shares one AppState listener across multiple date consumers', () => {
    const remove = jest.fn();
    const addEventListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });

    const { getByText, unmount } = render(
      <CurrentDateProvider>
        <DateConsumer label="a" />
        <DateConsumer label="b" />
      </CurrentDateProvider>
    );

    expect(getByText('a:2026-06-03')).toBeTruthy();
    expect(getByText('b:2026-06-03')).toBeTruthy();
    expect(addEventListener).toHaveBeenCalledTimes(1);

    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});

it('stops the midnight timer in background and restores the correct local date on return', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 5, 3, 23, 59, 59));
  let onState!: (state: AppStateStatus) => void;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    onState = listener;
    return { remove: jest.fn() };
  });
  const rendered = renderHook(() => useCurrentDateKey(), { wrapper: CurrentDateProvider });
  expect(jest.getTimerCount()).toBe(1);
  act(() => onState('background'));
  expect(jest.getTimerCount()).toBe(0);
  jest.setSystemTime(new Date(2026, 5, 5, 12));
  act(() => onState('active'));
  expect(rendered.result.current).toBe('2026-06-05');
  expect(jest.getTimerCount()).toBe(1);
  rendered.unmount();
  expect(jest.getTimerCount()).toBe(0);
  jest.restoreAllMocks();
  jest.useRealTimers();
});
