import type { NoteDraft } from '../types';
import { NoteAutosave } from './note-autosave';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createAutosave(isPersisted = false) {
  const draft: NoteDraft = { id: 'note_1', type: 'text', title: '', content: '', isPinned: false, items: [] };
  const save = jest.fn(async (_draft: NoteDraft, _isPersisted: boolean) => undefined);
  const deleteNote = jest.fn(async (_id: string) => true);
  const onCommitted = jest.fn();
  const onChange = jest.fn();
  const autosave = new NoteAutosave({ draft, isPersisted, save, delete: deleteNote, onCommitted, onChange });
  return { autosave, draft, save, deleteNote, onCommitted, onChange };
}

describe('NoteAutosave', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('debounces text for 500 ms and writes only the latest draft', async () => {
    const { autosave, draft, save, onCommitted } = createAutosave();
    autosave.changeDraft({ ...draft, content: 'First' });
    await jest.advanceTimersByTimeAsync(400);
    autosave.changeDraft({ ...draft, content: 'Latest' });
    await jest.advanceTimersByTimeAsync(499);
    expect(save).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ content: 'Latest' }), false);
    expect(autosave.getState()).toMatchObject({ isPersisted: true, isDirty: false, saveStatus: 'saved' });
    expect(onCommitted).toHaveBeenCalledTimes(1);
  });

  it('flushes structural changes immediately', async () => {
    const { autosave, draft, save } = createAutosave(true);
    autosave.changeDraft({ ...draft, title: 'Shopping', isPinned: true }, true);
    await autosave.flush();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ isPinned: true }), true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('serializes an in-flight create and coalesces edits into one latest update', async () => {
    const { autosave, draft, save } = createAutosave();
    const creating = deferred<undefined>();
    save.mockImplementationOnce(() => creating.promise);
    autosave.changeDraft({ ...draft, content: 'Initial' }, true);
    await Promise.resolve();
    autosave.changeDraft({ ...draft, content: 'Middle' });
    autosave.changeDraft({ ...draft, content: 'Newest' });
    const leaving = autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.getState().draft.content).toBe('Newest');
    creating.resolve(undefined);
    await expect(leaving).resolves.toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls.map(([snapshot, persisted]) => [snapshot.content, persisted])).toEqual([
      ['Initial', false], ['Newest', true],
    ]);
    expect(autosave.getState().draft.content).toBe('Newest');
  });

  it('preserves a failed latest draft and retries on explicit flush', async () => {
    const { autosave, draft, save, onCommitted } = createAutosave(true);
    save.mockRejectedValueOnce(new Error('Disk full'));
    autosave.changeDraft({ ...draft, content: 'Unsaved' });
    await expect(autosave.flush()).resolves.toBe(false);
    expect(autosave.getState()).toMatchObject({ isDirty: true, saveStatus: 'error', draft: { content: 'Unsaved' } });
    expect(onCommitted).not.toHaveBeenCalled();
    await expect(autosave.flush()).resolves.toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(autosave.getState()).toMatchObject({ isDirty: false, saveStatus: 'saved' });
  });

  it('does not create empty notes or overwrite persisted content with an empty draft', async () => {
    const fresh = createAutosave();
    fresh.autosave.changeDraft({ ...fresh.draft, title: '  ', content: '\n' });
    await expect(fresh.autosave.flush()).resolves.toBe(true);
    expect(fresh.save).not.toHaveBeenCalled();

    const existing = createAutosave(true);
    existing.autosave.changeDraft({ ...existing.draft, content: ' ' });
    await expect(existing.autosave.flush()).resolves.toBe(false);
    expect(existing.save).not.toHaveBeenCalled();
    expect(existing.autosave.getState()).toMatchObject({ isCleared: true, saveStatus: 'empty' });
  });

  it('recognizes a created record when the live draft was cleared during its first write', async () => {
    const { autosave, draft, save, deleteNote } = createAutosave();
    const creating = deferred<undefined>();
    save.mockImplementationOnce(() => creating.promise);
    autosave.changeDraft({ ...draft, content: 'First note' }, true);
    await Promise.resolve();
    autosave.changeDraft({ ...draft, content: '' });
    const leaving = autosave.flush();
    creating.resolve(undefined);
    await expect(leaving).resolves.toBe(false);
    expect(autosave.getState()).toMatchObject({ isPersisted: true, isCleared: true, saveStatus: 'empty' });
    expect(save).toHaveBeenCalledTimes(1);
    await expect(autosave.deleteNote()).resolves.toBe(true);
    expect(deleteNote).toHaveBeenCalledWith('note_1');
  });

  it('waits for an in-flight write before deletion and cancels newer queued edits', async () => {
    const { autosave, draft, save, deleteNote } = createAutosave();
    const creating = deferred<undefined>();
    save.mockImplementationOnce(() => creating.promise);
    autosave.changeDraft({ ...draft, content: 'Creating' }, true);
    await Promise.resolve();
    autosave.changeDraft({ ...draft, content: 'Queued' });
    const deleting = autosave.deleteNote();
    expect(autosave.deleteNote()).toBe(deleting);
    expect(deleteNote).not.toHaveBeenCalled();
    autosave.changeDraft({ ...draft, content: 'Ignored during delete' }, true);
    creating.resolve(undefined);
    await expect(deleting).resolves.toBe(true);
    await jest.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(deleteNote).toHaveBeenCalledTimes(1);
    expect(autosave.getState()).toMatchObject({ isDeleting: false, isDirty: false, isPersisted: false });
    await expect(autosave.flush()).resolves.toBe(true);
  });

  it('keeps the draft available after a failed delete', async () => {
    const { autosave, draft, deleteNote } = createAutosave(true);
    autosave.changeDraft({ ...draft, content: 'Keep this' });
    deleteNote.mockRejectedValueOnce(new Error('Delete failed'));
    await expect(autosave.deleteNote()).resolves.toBe(false);
    expect(autosave.getState()).toMatchObject({ isDeleting: false, isPersisted: true, saveStatus: 'error', draft: { content: 'Keep this' } });
    await expect(autosave.deleteNote()).resolves.toBe(true);
  });

  it('finishes the latest requested flush after detaching the UI', async () => {
    const { autosave, draft, save, onChange } = createAutosave(true);
    const saving = deferred<undefined>();
    save.mockImplementationOnce(() => saving.promise);
    autosave.changeDraft({ ...draft, content: 'Older' }, true);
    await Promise.resolve();
    autosave.changeDraft({ ...draft, content: 'Latest on unmount' });
    const flushing = autosave.flush();
    autosave.dispose();
    onChange.mockClear();
    saving.resolve(undefined);
    await expect(flushing).resolves.toBe(true);
    expect(save.mock.calls.map(([snapshot]) => snapshot.content)).toEqual(['Older', 'Latest on unmount']);
    expect(onChange).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
