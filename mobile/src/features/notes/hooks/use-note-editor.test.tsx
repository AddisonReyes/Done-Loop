import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { subscribeToAppEvent } from '@/shared/events/app-events';

import { NotesRepository } from '../repositories/notes-repository';
import type { Note, NoteDraft } from '../types';
import { useNoteEditor } from './use-note-editor';

jest.mock('../repositories/notes-repository', () => ({
  NotesRepository: { findById: jest.fn(), create: jest.fn(), updateDraft: jest.fn(), deleteById: jest.fn() },
}));

function createNote(draft: Partial<NoteDraft> = {}): Note {
  return {
    id: 'note_1', type: 'text', title: 'Original', content: 'Saved body', isPinned: false,
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

describe('useNoteEditor', () => {
  let changeAppState: (state: AppStateStatus) => void;
  const removeAppStateListener = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.mocked(NotesRepository.findById).mockResolvedValue(createNote());
    jest.mocked(NotesRepository.create).mockImplementation(async (draft) => createNote(draft));
    jest.mocked(NotesRepository.updateDraft).mockImplementation(async (draft) => createNote(draft));
    jest.mocked(NotesRepository.deleteById).mockResolvedValue(true);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      changeAppState = listener;
      return { remove: removeAppStateListener };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function finishLoad() {
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  }

  it('creates a transient empty draft and leaves without storing it', async () => {
    const { result } = renderHook(() => useNoteEditor({ type: 'text' }));
    await finishLoad();
    expect(result.current.draft).toMatchObject({ type: 'text', title: '', content: '', items: [] });
    await act(async () => { await expect(result.current.flush()).resolves.toBe(true); });
    expect(NotesRepository.create).not.toHaveBeenCalled();
  });

  it('debounces text edits, updates the existing note and emits notesChanged only after commit', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToAppEvent('notesChanged', listener);
    const { result } = renderHook(() => useNoteEditor({ id: 'note_1' }));
    await finishLoad();
    act(() => { result.current.setTitle('Edited title'); result.current.setContent('Edited body'); });
    expect(result.current.draft).toMatchObject({ title: 'Edited title', content: 'Edited body' });
    expect(result.current.isDirty).toBe(true);
    await act(async () => { await jest.advanceTimersByTimeAsync(499); });
    expect(NotesRepository.updateDraft).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    await act(async () => { await jest.advanceTimersByTimeAsync(1); });
    expect(NotesRepository.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ title: 'Edited title', content: 'Edited body' }));
    expect(result.current.saveStatus).toBe('saved');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('keeps newer local edits when an older write resolves and follows with an update', async () => {
    const creating = deferred<Note>();
    jest.mocked(NotesRepository.create).mockImplementationOnce(() => creating.promise);
    const { result } = renderHook(() => useNoteEditor({}));
    await finishLoad();
    act(() => { result.current.setContent('Before save'); });
    await act(async () => { await jest.advanceTimersByTimeAsync(500); });
    const savedDraft = jest.mocked(NotesRepository.create).mock.calls[0][0];
    act(() => { result.current.setContent('Latest typing'); });
    await act(async () => {
      creating.resolve(createNote(savedDraft));
      await result.current.flush();
    });
    expect(result.current.draft?.content).toBe('Latest typing');
    expect(NotesRepository.create).toHaveBeenCalledTimes(1);
    expect(NotesRepository.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ content: 'Latest typing' }));
  });

  it('reports cleared state synchronously after a first create finishes during leave', async () => {
    const creating = deferred<Note>();
    jest.mocked(NotesRepository.create).mockImplementationOnce(() => creating.promise);
    const { result } = renderHook(() => useNoteEditor({}));
    await finishLoad();
    act(() => { result.current.setContent('Creating'); });
    await act(async () => { await jest.advanceTimersByTimeAsync(500); });
    const savedDraft = jest.mocked(NotesRepository.create).mock.calls[0][0];
    act(() => { result.current.setContent(''); });
    expect(result.current.getCurrentState()?.isCleared).toBe(false);
    await act(async () => {
      const leaving = result.current.flush();
      creating.resolve(createNote(savedDraft));
      await expect(leaving).resolves.toBe(false);
      expect(result.current.getCurrentState()?.isCleared).toBe(true);
    });
    expect(NotesRepository.updateDraft).not.toHaveBeenCalled();
  });

  it('returns stable IDs for insertion and edits/completes/reorders/removes checklist rows', async () => {
    jest.mocked(NotesRepository.findById).mockResolvedValue(createNote({
      type: 'checklist', content: '', items: [
        { id: 'first', content: 'First', isCompleted: false },
        { id: 'last', content: 'Last', isCompleted: false },
      ],
    }));
    const { result } = renderHook(() => useNoteEditor({ id: 'note_1' }));
    await finishLoad();
    let newId = '';
    act(() => { newId = result.current.addItem('first'); });
    expect(newId).toBeTruthy();
    expect(result.current.draft?.items.map((item) => item.id)).toEqual(['first', newId, 'last']);
    act(() => {
      result.current.updateItem(newId, 'Middle');
      result.current.toggleItem(newId);
      result.current.moveItem(newId, -1);
    });
    expect(result.current.draft?.items[0]).toEqual({ id: newId, content: 'Middle', isCompleted: true });
    act(() => { result.current.moveItem(newId, -1); result.current.deleteItem('first'); });
    await act(async () => { await result.current.flush(); });
    expect(result.current.draft?.items.map((item) => item.id)).toEqual([newId, 'last']);
    expect(NotesRepository.updateDraft).toHaveBeenLastCalledWith(expect.objectContaining({
      items: [{ id: newId, content: 'Middle', isCompleted: true }, { id: 'last', content: 'Last', isCompleted: false }],
    }));
  });

  it('flushes pin changes promptly and flushes text on backgrounding', async () => {
    const { result } = renderHook(() => useNoteEditor({ id: 'note_1' }));
    await finishLoad();
    await act(async () => { result.current.togglePin(); await result.current.flush(); });
    expect(NotesRepository.updateDraft).toHaveBeenLastCalledWith(expect.objectContaining({ isPinned: true }));
    act(() => { result.current.setContent('Pending in background'); });
    await act(async () => { changeAppState('background'); await Promise.resolve(); });
    expect(NotesRepository.updateDraft).toHaveBeenLastCalledWith(expect.objectContaining({ content: 'Pending in background' }));
  });

  it('flushes the latest text and removes the AppState listener when unmounting', async () => {
    const { result, unmount } = renderHook(() => useNoteEditor({ id: 'note_1' }));
    await finishLoad();
    act(() => { result.current.setContent('Last text before unmount'); });
    await act(async () => { unmount(); await Promise.resolve(); });
    expect(NotesRepository.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ content: 'Last text before unmount' }));
    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });

  it('retains edits after failure and permits an explicit save retry', async () => {
    jest.mocked(NotesRepository.updateDraft).mockRejectedValueOnce(new Error('Disk full'));
    const { result } = renderHook(() => useNoteEditor({ id: 'note_1' }));
    await finishLoad();
    act(() => { result.current.setContent('Do not discard'); });
    await act(async () => { await expect(result.current.flush()).resolves.toBe(false); });
    expect(result.current.saveStatus).toBe('error');
    expect(result.current.draft?.content).toBe('Do not discard');
    await act(async () => { await expect(result.current.flush()).resolves.toBe(true); });
    expect(result.current.saveStatus).toBe('saved');
  });

  it('supports missing-note and load-error retry states without trapping navigation', async () => {
    jest.mocked(NotesRepository.findById).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useNoteEditor({ id: 'missing' }));
    await expect(result.current.flush()).resolves.toBe(true);
    await finishLoad();
    expect(result.current.notFound).toBe(true);
    await expect(result.current.flush()).resolves.toBe(true);
    jest.mocked(NotesRepository.findById).mockRejectedValueOnce(new Error('Database offline'));
    await act(async () => { await result.current.reload(); });
    expect(result.current.loadError).toBe(true);
    await expect(result.current.flush()).resolves.toBe(true);
    await act(async () => { await result.current.reload(); });
    expect(result.current.draft?.title).toBe('Original');
    expect(result.current.loadError).toBe(false);
  });

  it('ignores a stale load when the route changes', async () => {
    const oldLoad = deferred<Note | null>();
    jest.mocked(NotesRepository.findById).mockImplementationOnce(() => oldLoad.promise);
    const { result, rerender } = renderHook(({ id }: { id: string }) => useNoteEditor({ id }), { initialProps: { id: 'old' } });
    await finishLoad();
    rerender({ id: 'new' });
    await finishLoad();
    await act(async () => { oldLoad.resolve(createNote({ id: 'old', title: 'Stale' })); });
    expect(result.current.draft?.title).toBe('Original');
  });
});
