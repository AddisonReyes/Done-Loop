import { render } from '@testing-library/react-native';
import { Text, AppState } from 'react-native';

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
