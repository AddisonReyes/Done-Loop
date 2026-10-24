import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NotesRepository } from '@/features/notes/repositories/notes-repository';
import type { Note } from '@/features/notes/types';
import { emitAppEvent } from '@/shared/events/app-events';
import { createTestTranslator as mockCreateTestTranslator } from '@/test/test-utils';

import { useNotes } from './use-notes';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]) };
});
jest.mock('@/features/notes/repositories/notes-repository', () => ({
  NotesRepository: { list: jest.fn(), setPinned: jest.fn() },
}));
jest.mock('@/i18n', () => ({ useTranslation: () => ({ t: mockCreateTestTranslator('en') }) }));

const note: Note = {
  id: 'note_1', type: 'text', title: 'ÁRBOL', content: 'A long everyday note',
  isPinned: false, items: [], createdAt: '2026-06-03T12:00:00.000Z', updatedAt: '2026-06-03T12:00:00.000Z',
};

describe('useNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NotesRepository.list).mockResolvedValue([note]);
    jest.mocked(NotesRepository.setPinned).mockResolvedValue({ ...note, isPinned: true });
  });

  it('loads offline notes and filters without case-sensitive accented matching', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearch('árbol'));
    expect(result.current.notes).toEqual([note]);
    act(() => result.current.setSearch('missing'));
    expect(result.current.notes).toEqual([]);
  });

  it('shows a translated load error and supports retry', async () => {
    jest.mocked(NotesRepository.list).mockRejectedValueOnce(new Error('disk failure'));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.errorMessage).toBe('Could not load notes.'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.notes).toEqual([note]);
  });

  it('refreshes on note changes without reacting to task or habit events', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    emitAppEvent('todosChanged');
    emitAppEvent('habitsChanged');
    expect(NotesRepository.list).toHaveBeenCalledTimes(1);
    jest.mocked(NotesRepository.list).mockResolvedValue([]);
    await act(async () => { emitAppEvent('notesChanged'); });
    expect(result.current.notes).toEqual([]);
  });

  it('keeps a newer reload when an older read finishes later', async () => {
    let resolveOlder: (notes: Note[]) => void = () => undefined;
    jest.mocked(NotesRepository.list).mockImplementationOnce(() => new Promise((resolve) => { resolveOlder = resolve; }));
    const { result } = renderHook(() => useNotes());
    jest.mocked(NotesRepository.list).mockResolvedValue([]);
    await act(async () => { await result.current.reload(); });
    await act(async () => { resolveOlder([note]); });
    expect(result.current.notes).toEqual([]);
  });

  it('refreshes successful pin changes and retains an error after a failed write', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    jest.mocked(NotesRepository.list).mockResolvedValue([{ ...note, isPinned: true }]);
    await act(async () => { expect(await result.current.setPinned(note)).toBe(true); });
    expect(NotesRepository.setPinned).toHaveBeenCalledWith(note.id, true);
    expect(result.current.notes[0].isPinned).toBe(true);
    jest.mocked(NotesRepository.setPinned).mockRejectedValueOnce(new Error('disk failure'));
    await act(async () => { expect(await result.current.setPinned(note)).toBe(false); });
    expect(result.current.errorMessage).toBe('Could not save note changes.');
  });

  it('disables a pending pin action until the list reflects the write', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let finishPin: (saved: Note) => void = () => undefined;
    jest.mocked(NotesRepository.setPinned).mockImplementationOnce(() => new Promise((resolve) => { finishPin = resolve; }));
    let firstPin: Promise<boolean> = Promise.resolve(false);
    act(() => { firstPin = result.current.setPinned(note); });
    expect(result.current.isPinning(note.id)).toBe(true);
    await act(async () => { expect(await result.current.setPinned(note)).toBe(false); });
    expect(NotesRepository.setPinned).toHaveBeenCalledTimes(1);
    jest.mocked(NotesRepository.list).mockResolvedValue([{ ...note, isPinned: true }]);
    await act(async () => {
      finishPin({ ...note, isPinned: true });
      expect(await firstPin).toBe(true);
    });
    expect(result.current.isPinning(note.id)).toBe(false);
    expect(result.current.notes[0].isPinned).toBe(true);
  });
});
