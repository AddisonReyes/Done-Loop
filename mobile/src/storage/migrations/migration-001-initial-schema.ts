import type { SQLiteDatabase } from 'expo-sqlite';

export const migration001InitialSchema = {
  id: 1,
  name: 'initial_schema',
  async up(database: SQLiteDatabase): Promise<void> {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        recurrence_type TEXT NOT NULL CHECK (
          recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')
        ),
        custom_interval_days INTEGER,
        reminder_time TEXT,
        reminders_enabled INTEGER NOT NULL CHECK (reminders_enabled IN (0, 1)),
        is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY NOT NULL,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed INTEGER NOT NULL CHECK (completed IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE (habit_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id
        ON habit_completions(habit_id);

      CREATE INDEX IF NOT EXISTS idx_habit_completions_date
        ON habit_completions(date);

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3)),
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'deleted')),
        due_at TEXT,
        completed_at TEXT,
        deleted_at TEXT,
        notification_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_todos_status
        ON todos(status);

      CREATE INDEX IF NOT EXISTS idx_todos_due_at
        ON todos(due_at);

      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        notifications_enabled INTEGER NOT NULL CHECK (notifications_enabled IN (0, 1)),
        theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
        language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es')),
        date_format TEXT NOT NULL DEFAULT 'dmy' CHECK (date_format IN ('iso', 'mdy', 'dmy', 'long')),
        plan TEXT NOT NULL CHECK (plan IN ('free', 'no_ads', 'premium')),
        privacy_policy_url TEXT,
        terms_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
} as const;
