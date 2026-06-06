import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import type { useSettings } from '@/features/settings/hooks/use-settings';
import { createTestTranslator as mockCreateTestTranslator, defaultTestSettings, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import SettingsScreen from '@/app/settings';

type UseSettingsResult = ReturnType<typeof useSettings>;

const mockUseSettings = jest.fn<UseSettingsResult, []>();

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockTheme,
}));

jest.mock('@/hooks/use-theme-preference', () => ({
  useThemePreference: () => ({
    animationsEnabled: false,
    appBackground: 'none',
    resolvedTheme: 'light',
  }),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'en',
    locale: 'en',
    t: mockCreateTestTranslator('en'),
  }),
}));

jest.mock('@/shared/components/app-background', () => ({
  AppBackground: () => null,
}));

jest.mock('@/features/settings/hooks/use-settings', () => ({
  useSettings: () => mockUseSettings(),
}));

function createUseSettingsResult(input: Partial<UseSettingsResult> = {}): UseSettingsResult {
  return {
    isLoading: false,
    settings: defaultTestSettings,
    setAccentColor: jest.fn(async () => undefined),
    setAnimationsEnabled: jest.fn(async () => undefined),
    setAppBackground: jest.fn(async () => undefined),
    setDateFormat: jest.fn(async () => undefined),
    setLanguage: jest.fn(async () => undefined),
    setNotificationsEnabled: jest.fn(async () => undefined),
    setTheme: jest.fn(async () => undefined),
    ...input,
  };
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  it('renders a loading state while settings are unavailable', () => {
    mockUseSettings.mockReturnValue(createUseSettingsResult({ isLoading: true, settings: null }));

    render(<SettingsScreen />);

    expect(screen.getByText('Loading settings...')).toBeTruthy();
  });

  it('delegates switches and segmented settings to the hook', () => {
    const setAnimationsEnabled = jest.fn(async () => undefined);
    const setNotificationsEnabled = jest.fn(async () => undefined);
    const setTheme = jest.fn(async () => undefined);
    const setLanguage = jest.fn(async () => undefined);
    mockUseSettings.mockReturnValue(
      createUseSettingsResult({ setAnimationsEnabled, setLanguage, setNotificationsEnabled, setTheme })
    );

    render(<SettingsScreen />);

    fireEvent(screen.getByLabelText('Notifications'), 'valueChange', true);
    fireEvent(screen.getByLabelText('Animations'), 'valueChange', true);
    fireEvent.press(screen.getByText('Dark'));
    fireEvent.press(screen.getByText('Spanish'));

    expect(setNotificationsEnabled).toHaveBeenCalledWith(true);
    expect(setAnimationsEnabled).toHaveBeenCalledWith(true);
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(setLanguage).toHaveBeenCalledWith('es');
  });

  it('updates color, background, and date format controls', () => {
    const setAccentColor = jest.fn(async () => undefined);
    const setAppBackground = jest.fn(async () => undefined);
    const setDateFormat = jest.fn(async () => undefined);
    mockUseSettings.mockReturnValue(createUseSettingsResult({ setAccentColor, setAppBackground, setDateFormat }));

    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Blue'));
    fireEvent.press(screen.getByRole('button', { name: 'App background' }));
    fireEvent.press(screen.getByText('Grid'));
    fireEvent.press(screen.getByRole('button', { name: 'Date format' }));
    fireEvent.press(screen.getByText('YYYY-MM-DD'));

    expect(setAccentColor).toHaveBeenCalledWith('blue');
    expect(setAppBackground).toHaveBeenCalledWith('grid');
    expect(setDateFormat).toHaveBeenCalledWith('iso');
  });

  it('opens product links and alerts when a link cannot open', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseSettings.mockReturnValue(createUseSettingsResult());

    render(<SettingsScreen />);

    fireEvent.press(screen.getByRole('link', { name: /Privacy/ }));

    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://done-loop.com/privacy'));

    jest.mocked(Linking.canOpenURL).mockResolvedValue(false);
    fireEvent.press(screen.getByRole('link', { name: /Source code/ }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Could not open this link.', expect.stringContaining('github.com')));
  });
});
