import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { NavigationAction } from 'expo-router';
import { useEffect as mockUseEffect } from 'react';
import { Alert } from 'react-native';

import type { useNoteEditor } from '@/features/notes/hooks/use-note-editor';
import type { NoteDraft } from '@/features/notes/types';
import { createTestTranslator as mockCreateTestTranslator, mockSafeAreaInsets, mockTheme } from '@/test/test-utils';

import { NoteEditorScreen } from './note-editor-screen';

type EditorResult = ReturnType<typeof useNoteEditor>;
const mockUseNoteEditor = jest.fn<EditorResult, []>();
const mockDismissTo = jest.fn();
const mockRepeat = jest.fn();
const mockDisablePrevention = jest.fn();
let mockLanguage: 'en' | 'es' = 'en';
let mockRegisteredGuard: (() => Promise<boolean>) | undefined;
let mockRemovalCallback: ((options: { data: { action: NavigationAction }; repeat: () => void }) => void) | undefined;
const mockRequestLeave = jest.fn(() => mockRegisteredGuard?.() ?? Promise.resolve(true));
const mockRegisterGuard = jest.fn((guard: () => Promise<boolean>) => {
  mockRegisteredGuard = guard;
  return () => { mockRegisteredGuard = undefined; };
});

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('expo-router', () => ({
  router: { dismissTo: (...args: unknown[]) => mockDismissTo(...args) },
  useFocusEffect: (callback: () => void) => {
    mockUseEffect(callback, [callback]);
  },
  useIsFocused: () => true,
  usePreventRemove: (_prevent: boolean, callback: typeof mockRemovalCallback) => {
    mockRemovalCallback = callback;
    return mockDisablePrevention;
  },
}));
jest.mock('@/features/notes/hooks/use-note-editor', () => ({ useNoteEditor: () => mockUseNoteEditor() }));
jest.mock('@/features/notes/services/navigation-guard', () => ({
  useNotesNavigationGuard: () => ({ registerGuard: mockRegisterGuard, requestLeave: mockRequestLeave }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => mockSafeAreaInsets }));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => mockTheme }));
jest.mock('@/hooks/use-theme-preference', () => ({ useThemePreference: () => ({ animationsEnabled: false, appBackground: 'none', resolvedTheme: 'light' }) }));
jest.mock('@/shared/components/app-background', () => ({ AppBackground: () => null }));
jest.mock('@/i18n', () => ({ useTranslation: () => ({ locale: mockLanguage, t: mockCreateTestTranslator(mockLanguage) }) }));

function createEditor(input: Partial<EditorResult> = {}): EditorResult {
  const draft: NoteDraft = { id: 'note_1', type: 'text', title: 'Shopping', content: 'Buy milk', isPinned: false, items: [] };
  return {
    draft,
    isLoading: false,
    loadError: false,
    notFound: false,
    saveStatus: 'saved',
    isPersisted: true,
    isDeleting: false,
    isDirty: false,
    isCleared: false,
    getCurrentState: jest.fn(() => ({ draft, isPersisted: true, isDeleting: false, isDirty: false, isCleared: false, saveStatus: 'saved' })),
    reload: jest.fn(async () => undefined),
    setTitle: jest.fn(),
    setContent: jest.fn(),
    togglePin: jest.fn(),
    addItem: jest.fn(() => 'new_item'),
    updateItem: jest.fn(),
    toggleItem: jest.fn(),
    deleteItem: jest.fn(),
    moveItem: jest.fn(),
    flush: jest.fn(async () => true),
    deleteNote: jest.fn(async () => true),
    ...input,
  };
}

describe('NoteEditorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = 'en';
    mockRegisteredGuard = undefined;
    mockUseNoteEditor.mockReturnValue(createEditor());
  });

  afterEach(() => jest.restoreAllMocks());

  it('edits text and title without a mandatory save action', () => {
    const editor = createEditor();
    mockUseNoteEditor.mockReturnValue(editor);
    render(<NoteEditorScreen id="note_1" />);
    fireEvent.changeText(screen.getByLabelText('Note title'), 'Trip');
    fireEvent.changeText(screen.getByLabelText('Note content'), 'Packing list');
    fireEvent.press(screen.getByLabelText('Pin note'));
    expect(editor.setTitle).toHaveBeenCalledWith('Trip');
    expect(editor.setContent).toHaveBeenCalledWith('Packing list');
    expect(editor.togglePin).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('waits for saving before navigating back', async () => {
    let finishSave: ((result: boolean) => void) | undefined;
    const flush = jest.fn(() => new Promise<boolean>((resolve) => { finishSave = resolve; }));
    mockUseNoteEditor.mockReturnValue(createEditor({ isDirty: true, flush }));
    render(<NoteEditorScreen id="note_1" />);
    fireEvent.press(screen.getByLabelText('Back to Notes'));
    expect(mockDismissTo).not.toHaveBeenCalled();
    await act(async () => { finishSave?.(true); });
    expect(mockDisablePrevention).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).toHaveBeenCalledWith('/notes');
  });

  it('retains the editor when a navigation flush fails', async () => {
    const flush = jest.fn(async () => false);
    mockUseNoteEditor.mockReturnValue(createEditor({ isDirty: true, saveStatus: 'error', flush }));
    render(<NoteEditorScreen id="note_1" />);
    fireEvent.press(screen.getByLabelText('Back to Notes'));
    await waitFor(() => expect(flush).toHaveBeenCalledTimes(1));
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(screen.getByText('Could not save note changes.')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' }).props.accessibilityState.disabled).toBe(false));
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('flushes and replays a prevented native back action', async () => {
    mockUseNoteEditor.mockReturnValue(createEditor({ isDirty: true }));
    render(<NoteEditorScreen id="note_1" />);
    const action: NavigationAction = { type: 'GO_BACK' };
    await act(async () => { mockRemovalCallback?.({ data: { action }, repeat: mockRepeat }); });
    expect(mockRepeat).toHaveBeenCalledTimes(1);
  });

  it('shares cleared-note confirmation and keeps content when cancellation is chosen', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const deleteNote = jest.fn(async () => true);
    const editor = createEditor({ isCleared: true, isDirty: true, deleteNote });
    editor.getCurrentState = jest.fn(() => ({ draft: editor.draft!, isPersisted: true, isDeleting: false, isDirty: true, isCleared: true, saveStatus: 'empty' }));
    mockUseNoteEditor.mockReturnValue(editor);
    render(<NoteEditorScreen id="note_1" />);
    let first: Promise<boolean> | undefined;
    let second: Promise<boolean> | undefined;
    act(() => { first = mockRegisteredGuard?.(); second = mockRegisteredGuard?.(); });
    expect(first).toBe(second);
    expect(alert).toHaveBeenCalledTimes(1);
    await act(async () => { alert.mock.calls[0]?.[2]?.find((button) => button.style === 'cancel')?.onPress?.(); await first; });
    expect(deleteNote).not.toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('requires confirmation before deletion and reports a deletion failure', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const deleteNote = jest.fn(async () => false);
    mockUseNoteEditor.mockReturnValue(createEditor({ deleteNote }));
    render(<NoteEditorScreen id="note_1" />);
    fireEvent.press(screen.getByLabelText('Delete note'));
    expect(deleteNote).not.toHaveBeenCalled();
    await act(async () => { alert.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.(); });
    expect(deleteNote).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Could not delete the note. Your changes are still here.')).toBeTruthy();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('edits checklist rows, inserts with Enter, orders and confirms populated item deletion', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const editor = createEditor({ draft: { id: 'note_1', type: 'checklist', title: '', content: '', isPinned: false, items: [
      { id: 'first', content: 'Milk', isCompleted: false },
      { id: 'second', content: 'Bread', isCompleted: true },
    ] } });
    mockUseNoteEditor.mockReturnValue(editor);
    render(<NoteEditorScreen id="note_1" />);
    expect(screen.getByText('1 of 2 completed')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Complete checklist item 2' }).props.accessibilityState.checked).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Checklist item 1'), 'Oat milk');
    fireEvent(screen.getByLabelText('Checklist item 1'), 'submitEditing');
    fireEvent.press(screen.getByRole('checkbox', { name: 'Complete checklist item 1' }));
    fireEvent.press(screen.getByLabelText('Move item 1 down'));
    expect(editor.updateItem).toHaveBeenCalledWith('first', 'Oat milk');
    expect(editor.addItem).toHaveBeenCalledWith('first');
    expect(editor.toggleItem).toHaveBeenCalledWith('first');
    expect(editor.moveItem).toHaveBeenCalledWith('first', 1);
    fireEvent.press(screen.getByLabelText('Delete item 1'));
    expect(editor.deleteItem).not.toHaveBeenCalled();
    alert.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.();
    expect(editor.deleteItem).toHaveBeenCalledWith('first');
  });

  it('renders Spanish labels and not-found feedback', () => {
    mockLanguage = 'es';
    mockUseNoteEditor.mockReturnValue(createEditor({ draft: null, notFound: true }));
    render(<NoteEditorScreen id="missing" />);
    expect(screen.getByText('No se encontró esta nota.')).toBeTruthy();
    expect(screen.getByLabelText('Volver a Notas')).toBeTruthy();
  });

  it('confirms an empty note created while a navigation flush was pending', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const editor = createEditor({ isDirty: true });
    const current = { draft: editor.draft!, isPersisted: false, isDeleting: false, isDirty: true, isCleared: false, saveStatus: 'saving' as const };
    editor.getCurrentState = jest.fn(() => current);
    editor.flush = jest.fn(async () => { current.isPersisted = true; current.isCleared = true; return false; });
    mockUseNoteEditor.mockReturnValue(editor);
    render(<NoteEditorScreen />);
    fireEvent.press(screen.getByLabelText('Back to Notes'));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Delete this empty note?', expect.any(String), expect.any(Array), expect.any(Object)));
    await act(async () => { alert.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.(); });
    expect(editor.deleteNote).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).toHaveBeenCalledWith('/notes');
  });

  it.each([{ notFound: true }, { loadError: true }])('can leave an unavailable note %s', async (input) => {
    mockUseNoteEditor.mockReturnValue(createEditor({ draft: null, ...input }));
    render(<NoteEditorScreen id="missing" />);
    fireEvent.press(screen.getByLabelText('Back to Notes'));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/notes'));
  });
});
