import { render, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { defaultTestSettings } from '@/test/test-utils';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    router: { navigate: (route: string) => mockNavigate(route) },
    useFocusEffect: (callback: () => () => void) => React.useEffect(callback, [callback]),
  };
});
jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: { get: jest.fn() },
}));

describe('last active route restoration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('restores the Notes list on launch', async () => {
    jest.mocked(SettingsRepository.get).mockResolvedValue({ ...defaultTestSettings, lastActiveRoute: '/notes' });
    render(<HomeScreen />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/notes'));
  });

  it('falls back to Habits if preferences cannot be read', async () => {
    jest.mocked(SettingsRepository.get).mockRejectedValue(new Error('database unavailable'));
    render(<HomeScreen />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/habits'));
  });
});
