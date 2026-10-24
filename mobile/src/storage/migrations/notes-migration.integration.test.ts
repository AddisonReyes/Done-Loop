import { createSqliteTestDatabase } from '@/test/sqlite-test-database';

import { runMigrationsAsync } from './index';
import { migration001InitialSchema } from './migration-001-initial-schema';
import { migration002AddLanguageSetting } from './migration-002-add-language-setting';
import { migration003AddDateFormatSetting } from './migration-003-add-date-format-setting';
import { migration004DefaultDateFormatDmy } from './migration-004-default-date-format-dmy';
import { migration005AddAccentColorSetting } from './migration-005-add-accent-color-setting';
import { migration006AddHabitNotificationId } from './migration-006-add-habit-notification-id';
import { migration007AddAppBackgroundSetting } from './migration-007-add-app-background-setting';
import { migration008AddAnimationsEnabledSetting } from './migration-008-add-animations-enabled-setting';
import { migration009AddSolarAppBackground } from './migration-009-add-solar-app-background';
import { migration010AddHabitRecurrenceDays } from './migration-010-add-habit-recurrence-days';
import { migration011AddLocalDateKeys } from './migration-011-add-local-date-keys';
import { migration012AddLastActiveRouteSetting } from './migration-012-add-last-active-route-setting';
import { migration013AddNotes } from './migration-013-add-notes';

const legacyMigrations = [
  migration001InitialSchema, migration002AddLanguageSetting, migration003AddDateFormatSetting,
  migration004DefaultDateFormatDmy, migration005AddAccentColorSetting, migration006AddHabitNotificationId,
  migration007AddAppBackgroundSetting, migration008AddAnimationsEnabledSetting, migration009AddSolarAppBackground,
  migration010AddHabitRecurrenceDays, migration011AddLocalDateKeys, migration012AddLastActiveRouteSetting,
];

async function createInstalledDatabase() {
  const testDatabase = createSqliteTestDatabase();
  const { database } = testDatabase;
  await database.execAsync(`
    CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, applied_at TEXT NOT NULL);
  `);
  for (const migration of legacyMigrations) {
    await database.withTransactionAsync(async () => {
      await migration.up(database);
      await database.runAsync(
        'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);',
        migration.id, migration.name, '2026-09-01T00:00:00.000Z'
      );
    });
  }
  await database.execAsync(`
    INSERT INTO habits (
      id, name, description, recurrence_type, reminders_enabled, notification_id,
      is_active, start_date, created_at, updated_at
    ) VALUES ('habit_existing', 'Read', 'A chapter', 'daily', 1, 'habit_notification',
      1, '2026-09-01', '2026-09-01T00:00:00.000Z', '2026-09-02T00:00:00.000Z');
    INSERT INTO habit_completions (id, habit_id, date, completed, created_at, updated_at)
      VALUES ('completion_existing', 'habit_existing', '2026-09-02', 1,
        '2026-09-02T00:00:00.000Z', '2026-09-02T00:00:00.000Z');
    INSERT INTO todos (
      id, title, description, priority, status, due_at, notification_id, created_at, updated_at
    ) VALUES ('todo_existing', 'Buy food', 'Vegetables', 1, 'pending', '2026-10-11',
      'todo_notification', '2026-09-01T00:00:00.000Z', '2026-09-02T00:00:00.000Z');
    INSERT INTO user_settings (
      id, notifications_enabled, animations_enabled, theme, accent_color, app_background,
      language, date_format, plan, last_active_route, created_at, updated_at
    ) VALUES (1, 1, 0, 'dark', 'green', 'solar', 'es', 'dmy', 'free', '/todos',
      '2026-09-01T00:00:00.000Z', '2026-09-02T00:00:00.000Z');
  `);
  return testDatabase;
}

function legacyData(sqlite: ReturnType<typeof createSqliteTestDatabase>['sqlite']) {
  return ['habits', 'habit_completions', 'todos', 'user_settings'].map((table) =>
    sqlite.prepare(`SELECT * FROM ${table} ORDER BY id;`).all()
  );
}

describe('Notes migration with real SQLite', () => {
  it('upgrades an installed version 12 database while preserving all existing data', async () => {
    const { database, sqlite } = await createInstalledDatabase();
    try {
      const previous = legacyData(sqlite);
      await runMigrationsAsync(database);

      expect(legacyData(sqlite)).toEqual(previous);
      expect(sqlite.prepare('SELECT id FROM schema_migrations ORDER BY id;').all()).toHaveLength(13);
      expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('notes', 'note_checklist_items');").all())
        .toHaveLength(2);
      expect(sqlite.prepare('PRAGMA foreign_key_check;').all()).toEqual([]);
    } finally {
      await database.closeAsync();
    }
  });

  it('can rerun both the registry and additive migration without losing notes or existing data', async () => {
    const { database, sqlite } = await createInstalledDatabase();
    try {
      const previous = legacyData(sqlite);
      await runMigrationsAsync(database);
      await database.execAsync(`
        INSERT INTO notes VALUES ('note_existing', 'Trip', '', 'checklist', 1,
          '2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z');
        INSERT INTO note_checklist_items VALUES ('item_existing', 'note_existing', 'Passport', 0, 0,
          '2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z');
      `);
      const notes = sqlite.prepare('SELECT * FROM notes;').all();
      const items = sqlite.prepare('SELECT * FROM note_checklist_items;').all();

      await runMigrationsAsync(database);
      await migration013AddNotes.up(database);
      await migration013AddNotes.up(database);

      expect(sqlite.prepare('SELECT * FROM notes;').all()).toEqual(notes);
      expect(sqlite.prepare('SELECT * FROM note_checklist_items;').all()).toEqual(items);
      expect(legacyData(sqlite)).toEqual(previous);
      expect(sqlite.prepare('SELECT COUNT(*) AS count FROM schema_migrations WHERE id = 13;').get()).toEqual({ count: 1 });
    } finally {
      await database.closeAsync();
    }
  });

  it('enforces note types, booleans, child ownership, and cascade deletion', async () => {
    const { database, sqlite } = await createInstalledDatabase();
    try {
      await runMigrationsAsync(database);
      expect(() => sqlite.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?);')
        .run('bad_type', '', 'Body', 'rich', 0, 'now', 'now')).toThrow();
      expect(() => sqlite.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?);')
        .run('bad_pin', '', 'Body', 'text', 2, 'now', 'now')).toThrow();
      expect(() => sqlite.prepare('INSERT INTO note_checklist_items VALUES (?, ?, ?, ?, ?, ?, ?);')
        .run('orphan', 'missing', 'Item', 0, 0, 'now', 'now')).toThrow();
      sqlite.prepare('INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?);')
        .run('note_1', '', '', 'checklist', 0, 'now', 'now');
      sqlite.prepare('INSERT INTO note_checklist_items VALUES (?, ?, ?, ?, ?, ?, ?);')
        .run('item_1', 'note_1', 'Item', 1, 0, 'now', 'now');
      sqlite.prepare('DELETE FROM notes WHERE id = ?;').run('note_1');

      expect(sqlite.prepare('SELECT * FROM note_checklist_items;').all()).toEqual([]);
      expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_notes_pinned_updated_at', 'idx_note_checklist_items_note_position');").all())
        .toHaveLength(2);
    } finally {
      await database.closeAsync();
    }
  });

  it('rolls back a failed upgrade and allows a safe retry', async () => {
    const { database, sqlite } = await createInstalledDatabase();
    try {
      const previous = legacyData(sqlite);
      const execAsync = database.execAsync.bind(database);
      const execSpy = jest.spyOn(database, 'execAsync').mockImplementation(async (sql) => {
        await execAsync(sql);
        if (sql.includes('CREATE TABLE IF NOT EXISTS notes')) {
          throw new Error('storage failed');
        }
      });

      await expect(runMigrationsAsync(database)).rejects.toThrow('storage failed');
      expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notes';").all()).toEqual([]);
      expect(sqlite.prepare('SELECT id FROM schema_migrations WHERE id = 13;').all()).toEqual([]);
      expect(legacyData(sqlite)).toEqual(previous);

      execSpy.mockRestore();
      await runMigrationsAsync(database);
      expect(sqlite.prepare('SELECT id FROM schema_migrations WHERE id = 13;').get()).toEqual({ id: 13 });
    } finally {
      await database.closeAsync();
    }
  });
});
