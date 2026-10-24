import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import AppTabs, { getTopLevelRoute } from './app-tabs';

let mockPathname = '/habits';
let mockLanguage: 'en' | 'es' = 'en';
const mockNavigate = jest.fn();
const mockRequestLeave = jest.fn<Promise<boolean>, []>();

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => mockSafeAreaInsets }));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => mockTheme }));
jest.mock('@/i18n', () => ({
  useTranslation: () => ({ t: mockCreateTestTranslator(mockLanguage) }),
}));
jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: { update: jest.fn(async () => undefined) },
}));
jest.mock('@/features/notes/services/navigation-guard', () => ({
  NotesNavigationGuardProvider: ({ children }: { children: ReactNode }) => children,
  useNotesNavigationGuard: () => ({ requestLeave: mockRequestLeave }),
}));
jest.mock('expo-router', () => ({ usePathname: () => mockPathname }));
jest.mock('expo-router/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Tabs: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    TabSlot: () => null,
    TabList: ({ children }: { children: ReactNode }) => children,
    TabTrigger: ({ children, href }: { children?: ReactElement<{ onPress: () => void; onLongPress: () => void; isFocused: boolean }>; href: string }) =>
      children ? React.cloneElement(children, {
        onPress: () => mockNavigate(href),
        onLongPress: () => mockNavigate(href),
        isFocused: mockPathname.startsWith(href),
      }) : null,
  };
});

function pressTab(label: string, longPress = false) {
  const event = { persist: jest.fn(), isDefaultPrevented: () => false };
  fireEvent(screen.getByLabelText(label), longPress ? 'longPress' : 'press', event);
}

describe('Notes tab integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/habits';
    mockLanguage = 'en';
    mockRequestLeave.mockResolvedValue(true);
  });

  it.each([
    { language: 'en' as const, labels: ['Habits', 'Tasks', 'Notes', 'Calendar', 'Settings'] },
    { language: 'es' as const, labels: ['Hábitos', 'Tareas', 'Notas', 'Calendario', 'Ajustes'] },
  ])('renders five accessible tabs in $language', ({ language, labels }) => {
    mockLanguage = language;
    render(<AppTabs />);
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual(labels);
    expect(screen.getByLabelText(labels[0]).props.accessibilityState).toEqual({ selected: true });
  });

  it('stores only the Notes root while an editor is active', async () => {
    mockPathname = '/notes/note_1';
    render(<AppTabs />);
    await waitFor(() => expect(SettingsRepository.update).toHaveBeenCalledWith({ lastActiveRoute: '/notes' }));
    expect(screen.getByLabelText('Notes').props.accessibilityState).toEqual({ selected: true });
  });

  it.each([false, true])('waits for saving before switching tabs (long press: %s)', async (longPress) => {
    let finishSaving: (saved: boolean) => void = () => undefined;
    mockRequestLeave.mockImplementation(() => new Promise((resolve) => { finishSaving = resolve; }));
    mockPathname = '/notes/note_1';
    render(<AppTabs />);
    pressTab('Tasks', longPress);
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => { finishSaving(true); });
    expect(mockNavigate).toHaveBeenCalledWith('/todos');
  });

  it('retains the editor when its save fails', async () => {
    mockRequestLeave.mockResolvedValue(false);
    mockPathname = '/notes/note_1';
    render(<AppTabs />);
    await act(async () => { pressTab('Settings'); });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('maps existing and nested Notes routes without accepting lookalike routes', () => {
    expect(getTopLevelRoute('/notes')).toBe('/notes');
    expect(getTopLevelRoute('/notes/new')).toBe('/notes');
    expect(getTopLevelRoute('/notebook')).toBeNull();
    expect(getTopLevelRoute('/todos')).toBe('/todos');
    expect(getTopLevelRoute('/calendar')).toBe('/calendar');
    expect(getTopLevelRoute('/settings')).toBe('/settings');
  });
});
