import type { SQLiteDatabase } from 'expo-sqlite';

import { openIndependentDatabaseAsync } from '@/storage/database/client';
import { fromSQLiteBoolean, toSQLiteBoolean } from '@/storage/database/sqlite-mappers';

import { hasMeaningfulNote, normalizeNoteDraft, toNoteDraft } from '../services/note-draft';
import type { Note, NoteChecklistItem, NoteDraft } from '../types';

type NoteRow = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  is_pinned: number;
  created_at: string;
  updated_at: string;
};

type ChecklistItemRow = {
  id: string;
  note_id: string;
  content: string;
  is_completed: number;
  position: number;
  created_at: string;
  updated_at: string;
};

let databasePromise: Promise<SQLiteDatabase> | null = null;
let operationTail: Promise<void> = Promise.resolve();

function getNotesDatabaseAsync(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openIndependentDatabaseAsync().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

function withNotesDatabase<T>(operation: (database: SQLiteDatabase) => Promise<T>): Promise<T> {
  const result = operationTail.then(async () => operation(await getNotesDatabaseAsync()));
  // A failed operation must reach its caller without stopping later reads or retries.
  operationTail = result.then(() => undefined, () => undefined);
  return result;
}

function mapChecklistItem(row: ChecklistItemRow): NoteChecklistItem {
  return {
    id: row.id,
    noteId: row.note_id,
    content: row.content,
    isCompleted: fromSQLiteBoolean(row.is_completed),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNote(row: NoteRow, items: NoteChecklistItem[]): Note {
  const type = row.type === 'checklist' ? 'checklist' : 'text';
  return {
    id: row.id,
    type,
    title: row.title ?? '',
    content: row.content ?? '',
    isPinned: fromSQLiteBoolean(row.is_pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: type === 'checklist' ? items : [],
  };
}

async function readNote(database: SQLiteDatabase, id: string): Promise<Note | null> {
  const row = await database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?;', id);
  if (!row) {
    return null;
  }
  const items = await database.getAllAsync<ChecklistItemRow>(
    `SELECT * FROM note_checklist_items WHERE note_id = ? ORDER BY position ASC, id ASC;`,
    id
  );
  return mapNote(row, items.map(mapChecklistItem));
}

function validateDraft(input: NoteDraft): NoteDraft {
  if (!input.id.trim() || (input.type !== 'text' && input.type !== 'checklist')) {
    throw new Error('Invalid note draft.');
  }

  const draft = normalizeNoteDraft(input);
  if (!hasMeaningfulNote(draft)) {
    throw new Error('Cannot save an empty note.');
  }

  const itemIds = new Set<string>();
  for (const item of draft.items) {
    if (!item.id.trim() || itemIds.has(item.id)) {
      throw new Error('Invalid checklist item ID.');
    }
    itemIds.add(item.id);
  }
  return draft;
}

function draftsEqual(left: NoteDraft, right: NoteDraft): boolean {
  return left.id === right.id && left.type === right.type && left.title === right.title &&
    left.content === right.content && left.isPinned === right.isPinned &&
    left.items.length === right.items.length && left.items.every((item, index) => {
      const other = right.items[index];
      return item.id === other.id && item.content === other.content &&
        item.isCompleted === other.isCompleted;
    });
}

async function syncChecklistItems(
  database: SQLiteDatabase,
  draft: NoteDraft,
  previousItems: NoteChecklistItem[],
  now: string
): Promise<NoteChecklistItem[]> {
  const previousById = new Map(previousItems.map((item) => [item.id, item]));
  const items = draft.items.map((item, position): NoteChecklistItem => {
    const previous = previousById.get(item.id);
    const unchanged = previous?.content === item.content &&
      previous.isCompleted === item.isCompleted && previous.position === position;

    return {
      ...item,
      noteId: draft.id,
      position,
      createdAt: previous?.createdAt ?? now,
      updatedAt: unchanged ? previous.updatedAt : now,
    };
  });

  const nextIds = new Set(items.map((item) => item.id));
  for (const previous of previousItems) {
    if (!nextIds.has(previous.id)) {
      await database.runAsync(
        'DELETE FROM note_checklist_items WHERE id = ? AND note_id = ?;',
        previous.id,
        draft.id
      );
    }
  }
  for (const item of items) {
    const previous = previousById.get(item.id);
    if (!previous) {
      await database.runAsync(
        `INSERT INTO note_checklist_items (
          id, note_id, content, is_completed, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        item.id,
        item.noteId,
        item.content,
        toSQLiteBoolean(item.isCompleted),
        item.position,
        item.createdAt,
        item.updatedAt
      );
    } else if (previous.content !== item.content || previous.isCompleted !== item.isCompleted ||
      previous.position !== item.position) {
      await database.runAsync(
        `UPDATE note_checklist_items
         SET content = ?, is_completed = ?, position = ?, updated_at = ?
         WHERE id = ? AND note_id = ?;`,
        item.content,
        toSQLiteBoolean(item.isCompleted),
        item.position,
        item.updatedAt,
        item.id,
        draft.id
      );
    }
  }
  return items;
}

export const NotesRepository = {
  list(): Promise<Note[]> {
    return withNotesDatabase(async (database) => {
      const rows = await database.getAllAsync<NoteRow>(
        'SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC, id ASC;'
      );
      const itemRows = await database.getAllAsync<ChecklistItemRow>(
        'SELECT * FROM note_checklist_items ORDER BY note_id ASC, position ASC, id ASC;'
      );
      const itemsByNote = new Map<string, NoteChecklistItem[]>();
      for (const row of itemRows) {
        const items = itemsByNote.get(row.note_id) ?? [];
        items.push(mapChecklistItem(row));
        itemsByNote.set(row.note_id, items);
      }
      return rows.map((row) => mapNote(row, itemsByNote.get(row.id) ?? []));
    });
  },

  findById(id: string): Promise<Note | null> {
    return withNotesDatabase((database) => readNote(database, id));
  },

  async create(input: NoteDraft): Promise<Note> {
    const draft = validateDraft(input);
    return withNotesDatabase(async (database) => {
      const now = new Date().toISOString();
      let items: NoteChecklistItem[] = [];
      await database.withTransactionAsync(async () => {
        await database.runAsync(
          `INSERT INTO notes (id, title, content, type, is_pinned, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          draft.id,
          draft.title,
          draft.content,
          draft.type,
          toSQLiteBoolean(draft.isPinned),
          now,
          now
        );
        items = await syncChecklistItems(database, draft, [], now);
      });
      return { ...draft, items, createdAt: now, updatedAt: now };
    });
  },

  async updateDraft(input: NoteDraft): Promise<Note> {
    const draft = validateDraft(input);
    return withNotesDatabase(async (database) => {
      let saved: Note | null = null;
      await database.withTransactionAsync(async () => {
        const existing = await readNote(database, draft.id);
        if (!existing) {
          throw new Error('Note not found.');
        }
        if (existing.type !== draft.type) {
          throw new Error('Cannot change the note type.');
        }
        if (draftsEqual(toNoteDraft(existing), draft)) {
          saved = existing;
          return;
        }

        const now = new Date().toISOString();
        const result = await database.runAsync(
          `UPDATE notes SET title = ?, content = ?, is_pinned = ?, updated_at = ? WHERE id = ?;`,
          draft.title,
          draft.content,
          toSQLiteBoolean(draft.isPinned),
          now,
          draft.id
        );
        if (result.changes === 0) {
          throw new Error('Note not found.');
        }
        const items = await syncChecklistItems(database, draft, existing.items, now);
        saved = { ...draft, items, createdAt: existing.createdAt, updatedAt: now };
      });
      if (!saved) {
        throw new Error('Could not save the note.');
      }
      return saved;
    });
  },

  setPinned(id: string, isPinned: boolean): Promise<Note> {
    return withNotesDatabase(async (database) => {
      const existing = await readNote(database, id);
      if (!existing) {
        throw new Error('Note not found.');
      }
      if (existing.isPinned === isPinned) {
        return existing;
      }
      const now = new Date().toISOString();
      await database.runAsync(
        'UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?;',
        toSQLiteBoolean(isPinned),
        now,
        id
      );
      return { ...existing, isPinned, updatedAt: now };
    });
  },

  deleteById(id: string): Promise<boolean> {
    return withNotesDatabase(async (database) => {
      const result = await database.runAsync('DELETE FROM notes WHERE id = ?;', id);
      return result.changes > 0;
    });
  },
};
