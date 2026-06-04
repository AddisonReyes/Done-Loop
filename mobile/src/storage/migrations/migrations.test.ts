import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrationsAsync } from './index';
import { migration002AddLanguageSetting } from './migration-002-add-language-setting';
import { migration003AddDateFormatSetting } from './migration-003-add-date-format-setting';
import { migration005AddAccentColorSetting } from './migration-005-add-accent-color-setting';
import { migration006AddHabitNotificationId } from './migration-006-add-habit-notification-id';
import { migration007AddAppBackgroundSetting } from './migration-007-add-app-background-setting';
import { migration008AddAnimationsEnabledSetting } from './migration-008-add-animations-enabled-setting';
import { migration009AddSolarAppBackground } from './migration-009-add-solar-app-background';
import { migration010AddHabitRecurrenceDays } from './migration-010-add-habit-recurrence-days';

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

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(10);
    expect(database.runAsync).toHaveBeenCalledWith(
      'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);',
      1,
      'initial_schema',
      expect.any(String)
    );
  });

  it('skips migrations that are already applied', async () => {
    const database = createMigrationDatabase([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    await runMigrationsAsync(database as unknown as SQLiteDatabase);

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
  });

  it('keeps additive settings migrations idempotent', async () => {
    const database = createTableInfoDatabase([
      'language',
      'date_format',
      'accent_color',
      'notification_id',
      'app_background',
      'animations_enabled',
      'weekly_days',
      'monthly_days',
    ]);

    await migration002AddLanguageSetting.up(database as unknown as SQLiteDatabase);
    await migration003AddDateFormatSetting.up(database as unknown as SQLiteDatabase);
    await migration005AddAccentColorSetting.up(database as unknown as SQLiteDatabase);
    await migration006AddHabitNotificationId.up(database as unknown as SQLiteDatabase);
    await migration007AddAppBackgroundSetting.up(database as unknown as SQLiteDatabase);
    await migration008AddAnimationsEnabledSetting.up(database as unknown as SQLiteDatabase);
    await migration010AddHabitRecurrenceDays.up(database as unknown as SQLiteDatabase);

    expect(database.execAsync).not.toHaveBeenCalled();
  });

  it('adds the animations setting when it is missing', async () => {
    const database = createTableInfoDatabase(['language', 'date_format', 'accent_color']);

    await migration008AddAnimationsEnabledSetting.up(database as unknown as SQLiteDatabase);

    expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('ADD COLUMN animations_enabled'));
  });

  it('rebuilds user settings to allow the solar app background', async () => {
    const database = createTableInfoDatabase([]);

    await migration009AddSolarAppBackground.up(database as unknown as SQLiteDatabase);

    expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining("'none', 'gradient', 'grid', 'solar'"));
  });

  it('adds habit recurrence day columns when they are missing', async () => {
    const database = createTableInfoDatabase(['notification_id']);

    await migration010AddHabitRecurrenceDays.up(database as unknown as SQLiteDatabase);

    expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('ADD COLUMN weekly_days'));
    expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('ADD COLUMN monthly_days'));
  });
});
