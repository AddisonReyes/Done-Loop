import { fireEvent, render, screen } from '@testing-library/react-native';

import type { useNotes } from '@/features/notes/hooks/use-notes';
import type { Note } from '@/features/notes/types';
import type { UserDateFormatPreference } from '@/features/settings/types';
import { createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import { NotesScreen } from './notes-screen';

type NotesResult = ReturnType<typeof useNotes>;
const mockUseNotes = jest.fn<NotesResult, []>();
const mockPush = jest.fn();
let mockLanguage: 'en' | 'es' = 'en';
let mockDateFormat: UserDateFormatPreference = 'dmy';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => mockSafeAreaInsets }));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => mockTheme }));
jest.mock('@/hooks/use-theme-preference', () => ({ useThemePreference: () => ({ animationsEnabled: false, appBackground: 'none', resolvedTheme: 'light' }) }));
jest.mock('@/shared/components/app-background', () => ({ AppBackground: () => null }));
jest.mock('@/features/notes/hooks/use-notes', () => ({ useNotes: () => mockUseNotes() }));
jest.mock('@/features/settings/hooks/use-date-format-preference', () => ({ useDateFormatPreference: () => mockDateFormat }));
jest.mock('@/i18n', () => ({ useTranslation: () => ({ locale: mockLanguage, t: mockCreateTestTranslator(mockLanguage) }) }));

const note: Note = { id: 'note_1', type: 'checklist', title: 'Shopping', content: '', isPinned: true, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-06T12:00:00Z', items: [
  { id: 'item_1', noteId: 'note_1', content: 'Milk', isCompleted: true, position: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
] };

function createNotes(input: Partial<NotesResult> = {}): NotesResult {
  return { notes: [note], search: '', setSearch: jest.fn(), isLoading: false, errorMessage: null, reload: jest.fn(async () => undefined), setPinned: jest.fn(async () => true), isPinning: () => false, ...input };
}

describe('NotesScreen', () => {
  beforeEach(() => { jest.clearAllMocks(); mockLanguage = 'en'; mockDateFormat = 'dmy'; mockUseNotes.mockReturnValue(createNotes()); });

  it('opens note previews and changes pin state separately', () => {
    const notes = createNotes();
    mockUseNotes.mockReturnValue(notes);
    render(<NotesScreen />);
    expect(screen.getByText('1 of 1 completed')).toBeTruthy();
    expect(screen.getByText('Milk')).toBeTruthy();
    expect(screen.getByText('Edited 06/06/2026')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Open note: Shopping'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/notes/[id]', params: { id: 'note_1' } });
    fireEvent.press(screen.getByLabelText('Unpin note'));
    expect(notes.setPinned).toHaveBeenCalledWith(note);
  });

  it('creates either kind of note from the floating button', () => {
    mockUseNotes.mockReturnValue(createNotes({ notes: [] }));
    render(<NotesScreen />);
    expect(screen.getAllByText('No notes yet.')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Create note' })).toHaveLength(1);
    expect(screen.queryByText('Create note')).toBeNull();
    fireEvent.press(screen.getByLabelText('Create note'));
    fireEvent.press(screen.getByRole('button', { name: 'Checklist' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/notes/new', params: { type: 'checklist' } });
    fireEvent.press(screen.getByLabelText('Create note'));
    fireEvent.press(screen.getByRole('button', { name: 'Text note' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/notes/new', params: { type: 'text' } });
  });

  it('updates search and shows an empty search result', () => {
    const notes = createNotes({ notes: [], search: 'missing' });
    mockUseNotes.mockReturnValue(notes);
    render(<NotesScreen />);
    expect(screen.getByText('No notes match your search.')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Create note' })).toHaveLength(1);
    expect(screen.queryByText('Create note')).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Search notes'), 'Milk');
    expect(notes.setSearch).toHaveBeenCalledWith('Milk');
  });

  it('offers retry for errors and shows loading feedback', () => {
    const notes = createNotes({ notes: [], isLoading: true, errorMessage: 'Could not load notes.' });
    mockUseNotes.mockReturnValue(notes);
    render(<NotesScreen />);
    expect(screen.getByText('Loading notes...')).toBeTruthy();
    expect(screen.getByText('Could not load notes.')).toBeTruthy();
    expect(screen.queryByText('No notes yet.')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(notes.reload).toHaveBeenCalledTimes(1);
  });

  it.each(['en', 'es'] as const)('shows only the floating creation action in an empty list in %s', (language) => {
    mockLanguage = language;
    const t = mockCreateTestTranslator(language);
    mockUseNotes.mockReturnValue(createNotes({ notes: [] }));
    render(<NotesScreen />);
    expect(screen.getByText(t('notes.title'))).toBeTruthy();
    expect(screen.getAllByText(t('notes.empty'))).toHaveLength(1);
    expect(screen.getByLabelText(t('notes.searchLabel'))).toBeTruthy();
    expect(screen.getAllByRole('button', { name: t('notes.create') })).toHaveLength(1);
    expect(screen.queryByText(t('notes.create'))).toBeNull();
  });

  it('uses the current date format for last-edited information', () => {
    mockDateFormat = 'iso';
    render(<NotesScreen />);
    expect(screen.getByText('Edited 2026-06-06')).toBeTruthy();
  });

  it('disables the pin control while that note is being saved', () => {
    const notes = createNotes({ isPinning: () => true });
    mockUseNotes.mockReturnValue(notes);
    render(<NotesScreen />);
    expect(screen.getByLabelText('Unpin note').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText('Unpin note'));
    expect(notes.setPinned).not.toHaveBeenCalled();
  });
});
