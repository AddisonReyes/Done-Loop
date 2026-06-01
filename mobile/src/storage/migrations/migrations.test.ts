import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrationsAsync } from './index';
import { migration002AddLanguageSetting } from './migration-002-add-language-setting';
import { migration003AddDateFormatSetting } from './migration-003-add-date-format-setting';
import { migration005AddAccentColorSetting } from './migration-005-add-accent-color-setting';

function createMigrationDatabase(appliedIds: number[] = []) {
  const rows = appliedIds.map((id) => ({ id }));
  const database = {
    execAsync: jest.fn(async () => undefined),
    getAllAsync: jest.fn(async () => rows),
    runAsync: jest.fn(async (sql: string, id?: number, name?: string) => {
      if (sql.includes('INSERT INTO schema_migrations') && typeof id === 'number') {
        rows.push({ id });
      }
      return { changes: 1, lastInsertRowId: 1 };
    }),
    withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => callback()),
  };

  return database;
}

function createTableInfoDatabase(columns: string[]) {
  const database = {
    execAsync: jest.fn(async () => undefined),
    getAllAsync: jest.fn(async () => columns.map((name) => ({ name }))),
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => callback()),
  };

  return database;
}

describe('migrations', () => {
  it('runs unapplied migrations and records them', async () => {
    const database = createMigrationDatabase();

    await runMigrationsAsync(database as unknown as SQLiteDatabase);

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(5);
    expect(database.runAsync).toHaveBeenCalledWith(
      'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);',
      1,
      'initial_schema',
      expect.any(String)
    );
  });

  it('skips migrations that are already applied', async () => {
    const database = createMigrationDatabase([1, 2, 3, 4, 5]);

    await runMigrationsAsync(database as unknown as SQLiteDatabase);

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
  });

  it('keeps additive settings migrations idempotent', async () => {
    const database = createTableInfoDatabase(['language', 'date_format', 'accent_color']);

    await migration002AddLanguageSetting.up(database as unknown as SQLiteDatabase);
    await migration003AddDateFormatSetting.up(database as unknown as SQLiteDatabase);
    await migration005AddAccentColorSetting.up(database as unknown as SQLiteDatabase);

    expect(database.execAsync).not.toHaveBeenCalled();
  });
});
