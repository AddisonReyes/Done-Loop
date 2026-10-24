import type { SQLiteDatabase } from 'expo-sqlite';

export const migration013AddNotes = {
  id: 13,
  name: 'add_notes',
  async up(database: Pick<SQLiteDatabase, 'execAsync'>): Promise<void> {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT,
        content TEXT,
        type TEXT NOT NULL CHECK (type IN ('text', 'checklist')),
        is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notes_pinned_updated_at
        ON notes(is_pinned DESC, updated_at DESC);

      CREATE TABLE IF NOT EXISTS note_checklist_items (
        id TEXT PRIMARY KEY NOT NULL,
        note_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
        position INTEGER NOT NULL CHECK (position >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_note_checklist_items_note_position
        ON note_checklist_items(note_id, position);
    `);
  },
} as const;
