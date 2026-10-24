import { openIndependentDatabaseAsync } from '@/storage/database/client';
import { runMigrationsAsync } from '@/storage/migrations';
import { createSqliteTestDatabase } from '@/test/sqlite-test-database';

import { toNoteDraft } from '../services/note-draft';
import type { NoteDraft } from '../types';
import { NotesRepository } from './notes-repository';

jest.mock('@/storage/database/client', () => ({ openIndependentDatabaseAsync: jest.fn() }));

function draft(id: string, input: Partial<NoteDraft> = {}): NoteDraft {
  return { id, type: 'text', title: '', content: 'A note', isPinned: false, items: [], ...input };
}

describe('NotesRepository with real SQLite', () => {
  const { database, sqlite } = createSqliteTestDatabase();

  beforeAll(async () => {
    await runMigrationsAsync(database);
    jest.mocked(openIndependentDatabaseAsync).mockResolvedValue(database);
  });

  beforeEach(async () => {
    await database.execAsync('DELETE FROM notes;');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await database.closeAsync();
  });

  it('retries connection initialization after a failure without poisoning later operations', async () => {
    jest.mocked(openIndependentDatabaseAsync).mockRejectedValueOnce(new Error('database unavailable'));
    await expect(NotesRepository.create(draft('retry'))).rejects.toThrow('database unavailable');
    await expect(NotesRepository.create(draft('retry'))).resolves.toMatchObject({ id: 'retry' });
  });

  it('creates, reads, and updates full text without truncation or SQL interpolation', async () => {
    const content = `  ${'x'.repeat(2000)}\n  '; DROP TABLE todos; --\n`;
    const created = await NotesRepository.create(draft('text_1', { title: '  Heading  ', content }));

    expect(created).toMatchObject({ id: 'text_1', title: '  Heading  ', content, items: [] });
    expect(await NotesRepository.findById(created.id)).toEqual(created);
    const updated = await NotesRepository.updateDraft({ ...toNoteDraft(created), title: '', content: 'Updated\n\nBody' });
    expect(updated.createdAt).toBe(created.createdAt);
    expect(await NotesRepository.findById(created.id)).toEqual(updated);
    expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'todos';").get()).toEqual({ name: 'todos' });
  });

  it('supports title-only notes and excludes meaningless drafts or blank checklist placeholders', async () => {
    await expect(NotesRepository.create(draft('empty', { title: ' \n', content: '\t', isPinned: true })))
      .rejects.toThrow('Cannot save an empty note.');
    await expect(NotesRepository.create(draft('title_only', { title: 'Remember', content: '' })))
      .resolves.toMatchObject({ title: 'Remember', content: '' });
    const checklist = await NotesRepository.create(draft('checklist', {
      type: 'checklist', content: '', items: [
        { id: 'blank', content: '  \n', isCompleted: false },
        { id: 'item_1', content: '  Milk  ', isCompleted: true },
      ],
    }));
    expect(checklist.items).toHaveLength(1);
    expect(checklist.items[0]).toMatchObject({ id: 'item_1', content: '  Milk  ', position: 0, isCompleted: true });
    expect(sqlite.prepare('SELECT id FROM note_checklist_items;').all()).toEqual([{ id: 'item_1' }]);
  });

  it('edits, completes, reopens, creates, deletes, and orders checklist items while preserving identity', async () => {
    const created = await NotesRepository.create(draft('checklist', {
      type: 'checklist', content: '', items: [
        { id: 'milk', content: 'Milk', isCompleted: false },
        { id: 'bread', content: 'Bread', isCompleted: false },
        { id: 'deleted', content: 'Remove me', isCompleted: true },
      ],
    }));
    const updated = await NotesRepository.updateDraft({
      ...toNoteDraft(created),
      items: [
        { id: 'bread', content: 'Wholegrain bread', isCompleted: true },
        { id: 'milk', content: 'Milk', isCompleted: false },
        { id: 'eggs', content: 'Eggs', isCompleted: false },
      ],
    });
    expect(updated.items.map(({ id, position }) => ({ id, position }))).toEqual([
      { id: 'bread', position: 0 }, { id: 'milk', position: 1 }, { id: 'eggs', position: 2 },
    ]);
    expect(updated.items[0]).toMatchObject({
      content: 'Wholegrain bread', isCompleted: true, createdAt: created.items[1].createdAt,
    });
    expect(updated.items[1].createdAt).toBe(created.items[0].createdAt);
    expect(sqlite.prepare('SELECT id FROM note_checklist_items WHERE id = ?;').get('deleted')).toBeUndefined();
    expect(await NotesRepository.findById('checklist')).toEqual(updated);

    const reopened = await NotesRepository.updateDraft({
      ...toNoteDraft(updated), items: updated.items.map((item) => ({ ...item, isCompleted: false })),
    });
    expect(reopened.items.every((item) => !item.isCompleted)).toBe(true);
  });

  it('does not rewrite unchanged items or their timestamps when only the title changes', async () => {
    const created = await NotesRepository.create(draft('checklist', {
      type: 'checklist', content: '', items: [
        { id: 'item_1', content: 'One', isCompleted: false },
        { id: 'item_2', content: 'Two', isCompleted: true },
      ],
    }));
    const runSpy = jest.spyOn(database, 'runAsync');
    const updated = await NotesRepository.updateDraft({ ...toNoteDraft(created), title: 'A heading' });

    expect(updated.items).toEqual(created.items);
    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(runSpy).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE notes'), 'A heading', '', 0, expect.any(String), 'checklist'
    );
    runSpy.mockClear();
    expect(await NotesRepository.updateDraft(toNoteDraft(updated))).toEqual(updated);
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('pins and unpins notes and lists pinned groups by last modification', async () => {
    await NotesRepository.create(draft('pinned_old'));
    await NotesRepository.create(draft('pinned_new'));
    await NotesRepository.create(draft('plain_old'));
    await NotesRepository.create(draft('plain_new'));
    await expect(NotesRepository.setPinned('pinned_old', true)).resolves.toMatchObject({ isPinned: true });
    await NotesRepository.setPinned('pinned_new', true);
    for (const [id, day] of [['pinned_old', '01'], ['pinned_new', '02'], ['plain_old', '03'], ['plain_new', '04']]) {
      await database.runAsync('UPDATE notes SET updated_at = ? WHERE id = ?;', `2026-10-${day}T00:00:00.000Z`, id);
    }

    expect((await NotesRepository.list()).map((note) => note.id))
      .toEqual(['pinned_new', 'pinned_old', 'plain_new', 'plain_old']);
    await expect(NotesRepository.setPinned('pinned_old', false)).resolves.toMatchObject({ isPinned: false });
    expect((await NotesRepository.list())[0].id).toBe('pinned_new');
  });

  it('lists notes and items in two batched queries', async () => {
    for (const id of ['checklist_1', 'checklist_2']) {
      await NotesRepository.create(draft(id, {
        type: 'checklist', content: '', items: [{ id: `${id}_item`, content: id, isCompleted: false }],
      }));
    }
    const getAllSpy = jest.spyOn(database, 'getAllAsync');
    const notes = await NotesRepository.list();
    expect(notes).toHaveLength(2);
    expect(notes.every((note) => note.items[0].noteId === note.id)).toBe(true);
    expect(getAllSpy).toHaveBeenCalledTimes(2);
  });

  it('rolls back the complete aggregate when an item write fails and allows retry', async () => {
    const first = await NotesRepository.create(draft('first', {
      type: 'checklist', content: '', items: [{ id: 'first_item', content: 'Original', isCompleted: false }],
    }));
    const second = await NotesRepository.create(draft('second', {
      type: 'checklist', content: '', items: [{ id: 'owned_by_second', content: 'Another note', isCompleted: false }],
    }));
    await expect(NotesRepository.updateDraft({
      ...toNoteDraft(first), title: 'Must roll back', items: [
        { id: 'first_item', content: 'Changed', isCompleted: true },
        { id: 'owned_by_second', content: 'Collision', isCompleted: true },
      ],
    })).rejects.toThrow();

    expect(await NotesRepository.findById(first.id)).toEqual(first);
    expect(await NotesRepository.findById(second.id)).toEqual(second);
    await expect(NotesRepository.updateDraft({ ...toNoteDraft(first), title: 'Retry succeeds' }))
      .resolves.toMatchObject({ title: 'Retry succeeds', items: first.items });
  });

  it('serializes concurrent aggregate writes and reads without exposing incomplete checklists', async () => {
    const created = await NotesRepository.create(draft('concurrent', {
      type: 'checklist', content: '', items: [{ id: 'item', content: 'One', isCompleted: false }],
    }));
    const firstWrite = NotesRepository.updateDraft({
      ...toNoteDraft(created), items: [{ id: 'item', content: 'Two', isCompleted: false }],
    });
    const secondWrite = NotesRepository.updateDraft({
      ...toNoteDraft(created), items: [{ id: 'item', content: 'Latest', isCompleted: true }],
    });
    const read = NotesRepository.findById(created.id);

    await Promise.all([firstWrite, secondWrite]);
    await expect(read).resolves.toMatchObject({ items: [{ id: 'item', content: 'Latest', isCompleted: true }] });
  });

  it('deletes notes with cascading children and never recreates a missing existing note', async () => {
    const created = await NotesRepository.create(draft('deleted', {
      type: 'checklist', content: '', items: [{ id: 'item', content: 'One', isCompleted: false }],
    }));
    await expect(NotesRepository.deleteById(created.id)).resolves.toBe(true);
    expect(sqlite.prepare('SELECT * FROM note_checklist_items;').all()).toEqual([]);
    await expect(NotesRepository.findById(created.id)).resolves.toBeNull();
    await expect(NotesRepository.updateDraft(toNoteDraft(created))).rejects.toThrow('Note not found.');
    await expect(NotesRepository.setPinned(created.id, true)).rejects.toThrow('Note not found.');
    await expect(NotesRepository.deleteById(created.id)).resolves.toBe(false);
    await expect(NotesRepository.list()).resolves.toEqual([]);
  });

  it('rejects duplicate checklist IDs and attempts to change an existing note type', async () => {
    await expect(NotesRepository.create(draft('duplicates', {
      type: 'checklist', content: '', items: [
        { id: 'same', content: 'One', isCompleted: false },
        { id: 'same', content: 'Two', isCompleted: false },
      ],
    }))).rejects.toThrow('Invalid checklist item ID.');
    const created = await NotesRepository.create(draft('fixed_type'));
    await expect(NotesRepository.updateDraft({ ...toNoteDraft(created), type: 'checklist' }))
      .rejects.toThrow('Cannot change the note type.');
    expect(await NotesRepository.findById(created.id)).toEqual(created);
  });
});
