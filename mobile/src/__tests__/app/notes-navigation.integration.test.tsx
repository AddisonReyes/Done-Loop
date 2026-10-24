import { userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { act, cleanup, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert, Text } from 'react-native';

import HomeScreen from '@/app/index';
import ExistingNoteScreen from '@/app/notes/[id]';
import * as NotesLayout from '@/app/notes/_layout';
import NotesScreen from '@/app/notes/index';
import NewNoteScreen from '@/app/notes/new';
import AppTabs from '@/components/app-tabs';
import { NotesRepository } from '@/features/notes/repositories/notes-repository';
import type { Note, NoteDraft } from '@/features/notes/types';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { createTestTranslator as mockCreateTestTranslator, defaultTestSettings, mockTheme } from '@/test/test-utils';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => mockTheme }));
jest.mock('@/hooks/use-theme-preference', () => ({
  useThemePreference: () => ({ animationsEnabled: false, appBackground: 'none', resolvedTheme: 'light' }),
}));
jest.mock('@/shared/components/app-background', () => ({ AppBackground: () => null }));
jest.mock('@/i18n', () => ({ useTranslation: () => ({ language: 'en', locale: 'en', t: mockCreateTestTranslator('en') }) }));
jest.mock('@/features/notes/repositories/notes-repository', () => ({
  NotesRepository: { list: jest.fn(), findById: jest.fn(), create: jest.fn(), updateDraft: jest.fn(), setPinned: jest.fn(), deleteById: jest.fn() },
}));
jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: { get: jest.fn(), update: jest.fn(), subscribe: jest.fn(() => () => undefined) },
}));

function createNote(draft: Partial<NoteDraft> = {}): Note {
  return {
    id: 'note_1', type: 'text', title: 'Shopping', content: 'Milk', isPinned: false,
    createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
    ...draft,
    items: (draft.items ?? []).map((item, position) => ({
      ...item, noteId: draft.id ?? 'note_1', position,
      createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
    })),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

function renderNotesRouter(initialUrl: string) {
  return renderRouter({
    _layout: AppTabs,
    index: HomeScreen,
    habits: () => <Text>Habits screen</Text>,
    todos: () => <Text>Tasks screen</Text>,
    calendar: () => <Text>Calendar screen</Text>,
    settings: () => <Text>Settings screen</Text>,
    'notes/_layout': NotesLayout,
    'notes/index': NotesScreen,
    'notes/new': NewNoteScreen,
    'notes/[id]': ExistingNoteScreen,
  }, { initialUrl });
}

async function finishLoading() {
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
}

describe('Notes with actual Expo Router navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(SettingsRepository.get).mockResolvedValue(defaultTestSettings);
    jest.mocked(SettingsRepository.update).mockResolvedValue(defaultTestSettings);
    jest.mocked(NotesRepository.list).mockResolvedValue([createNote()]);
    jest.mocked(NotesRepository.findById).mockImplementation(async (id) => id === 'note_1' ? createNote() : null);
    jest.mocked(NotesRepository.create).mockImplementation(async (draft) => createNote(draft));
    jest.mocked(NotesRepository.updateDraft).mockImplementation(async (draft) => createNote(draft));
    jest.mocked(NotesRepository.deleteById).mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens a direct note link with a Notes list back destination', async () => {
    const navigation = await renderNotesRouter('/notes/note_1');
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes/note_1');
    expect(screen.getByLabelText('Note content').props.value).toBe('Milk');
    expect(router.canGoBack()).toBe(true);
    await userEvent.press(screen.getByLabelText('Back to Notes'));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(screen.getByRole('button', { name: 'Open note: Shopping' })).toBeTruthy();
  });

  it('switches all five actual tab triggers and records their top-level routes', async () => {
    const navigation = await renderNotesRouter('/habits');
    await finishLoading();
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual(['Habits', 'Tasks', 'Notes', 'Calendar', 'Settings']);
    for (const [label, pathname] of [
      ['Tasks', '/todos'], ['Notes', '/notes'], ['Calendar', '/calendar'], ['Settings', '/settings'], ['Habits', '/habits'],
    ]) {
      await userEvent.press(screen.getByRole('tab', { name: label }));
      await finishLoading();
      expect(navigation.getPathname()).toBe(pathname);
      expect(screen.getByRole('tab', { name: label }).props.accessibilityState.selected).toBe(true);
      expect(SettingsRepository.update).toHaveBeenLastCalledWith({ lastActiveRoute: pathname });
    }
  });

  it('waits for a dirty editor save before switching tabs and returns to the Notes list', async () => {
    const writing = deferred<Note>();
    jest.mocked(NotesRepository.updateDraft).mockImplementationOnce(() => writing.promise);
    const navigation = await renderNotesRouter('/notes/note_1');
    await finishLoading();
    fireEvent.changeText(screen.getByLabelText('Note content'), 'Latest note before switching');
    await userEvent.press(screen.getByRole('tab', { name: 'Tasks' }));
    await finishLoading();
    expect(NotesRepository.updateDraft).toHaveBeenCalledTimes(1);
    expect(navigation.getPathname()).toBe('/notes/note_1');
    const draft = jest.mocked(NotesRepository.updateDraft).mock.calls[0][0];
    await act(async () => { writing.resolve(createNote(draft)); });
    await finishLoading();
    expect(navigation.getPathname()).toBe('/todos');
    await userEvent.press(screen.getByRole('tab', { name: 'Notes' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(screen.queryByLabelText('Note content')).toBeNull();
    expect(NotesRepository.updateDraft).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByRole('tab', { name: 'Calendar' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/calendar');
    expect(NotesRepository.updateDraft).toHaveBeenCalledTimes(1);
  });

  it('blocks tab changes after save failure, retains edits, and retries on a later attempt', async () => {
    jest.mocked(NotesRepository.updateDraft).mockRejectedValueOnce(new Error('Storage unavailable'));
    const navigation = await renderNotesRouter('/notes/note_1');
    await finishLoading();
    fireEvent.changeText(screen.getByLabelText('Note content'), 'Keep this draft');
    await userEvent.press(screen.getByRole('tab', { name: 'Tasks' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes/note_1');
    expect(screen.getByLabelText('Note content').props.value).toBe('Keep this draft');
    expect(screen.getByText('Could not save note changes.')).toBeTruthy();
    await userEvent.press(screen.getByRole('tab', { name: 'Tasks' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/todos');
    expect(NotesRepository.updateDraft).toHaveBeenCalledTimes(2);
  });

  it('uses the actual native stack removal guard for dirty Back navigation', async () => {
    const writing = deferred<Note>();
    jest.mocked(NotesRepository.updateDraft).mockImplementationOnce(() => writing.promise);
    const navigation = await renderNotesRouter('/notes/note_1');
    await finishLoading();
    fireEvent.changeText(screen.getByLabelText('Note content'), 'Native back draft');
    act(() => { router.back(); });
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes/note_1');
    expect(NotesRepository.updateDraft).toHaveBeenCalledTimes(1);
    await act(async () => { writing.resolve(createNote(jest.mocked(NotesRepository.updateDraft).mock.calls[0][0])); });
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
  });

  it('allows a missing-note deep link to leave through the actual Back action', async () => {
    const navigation = await renderNotesRouter('/notes/missing');
    await finishLoading();
    expect(screen.getByText('This note could not be found.')).toBeTruthy();
    await userEvent.press(screen.getByLabelText('Back to Notes'));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(NotesRepository.create).not.toHaveBeenCalled();
    expect(NotesRepository.updateDraft).not.toHaveBeenCalled();
  });

  it('confirms deletion before leaving a cleared note and resets the Notes tab afterward', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const navigation = await renderNotesRouter('/notes/note_1');
    await finishLoading();
    fireEvent.changeText(screen.getByLabelText('Note title'), '');
    fireEvent.changeText(screen.getByLabelText('Note content'), '');
    await userEvent.press(screen.getByRole('tab', { name: 'Tasks' }));
    expect(navigation.getPathname()).toBe('/notes/note_1');
    expect(NotesRepository.deleteById).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
    const approve = alert.mock.calls[0][2]?.find((button) => button.style === 'destructive');
    expect(approve).toBeDefined();
    jest.mocked(NotesRepository.list).mockResolvedValue([]);
    await act(async () => { approve?.onPress?.(); });
    await finishLoading();
    expect(NotesRepository.deleteById).toHaveBeenCalledWith('note_1');
    expect(navigation.getPathname()).toBe('/todos');
    await userEvent.press(screen.getByRole('tab', { name: 'Notes' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(screen.queryByLabelText('Note content')).toBeNull();
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid new-note types and keeps the actual Back destination usable', async () => {
    const navigation = await renderNotesRouter('/notes/new?type=invalid');
    await finishLoading();
    expect(screen.queryByLabelText('Note content')).toBeNull();
    expect(screen.getByText('This note link is invalid.')).toBeTruthy();
    await userEvent.press(screen.getByRole('button', { name: 'Back to Notes' }));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(NotesRepository.create).not.toHaveBeenCalled();
  });

  it.each(['/notes', '/habits', '/settings'] as const)('restores saved route %s through the actual startup screen', async (lastActiveRoute) => {
    jest.mocked(SettingsRepository.get).mockResolvedValue({ ...defaultTestSettings, lastActiveRoute });
    const navigation = await renderNotesRouter('/');
    await finishLoading();
    expect(navigation.getPathname()).toBe(lastActiveRoute);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    const selectedTabs = screen.getAllByRole('tab').filter((tab) => tab.props.accessibilityState.selected);
    expect(selectedTabs).toHaveLength(1);
  });

  it.each([
    ['/notes/new', 'Text note', false],
    ['/notes/new?type=checklist', 'Checklist', true],
  ])('opens new-note route %s with its requested type', async (url, title, checklist) => {
    const navigation = await renderNotesRouter(url);
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes/new');
    expect(screen.getByText(title)).toBeTruthy();
    expect(Boolean(screen.queryByText('Add item'))).toBe(checklist);
    expect(Boolean(screen.queryByLabelText('Note content'))).toBe(!checklist);
    await userEvent.press(screen.getByLabelText('Back to Notes'));
    await finishLoading();
    expect(navigation.getPathname()).toBe('/notes');
    expect(NotesRepository.create).not.toHaveBeenCalled();
  });
});
