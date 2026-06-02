import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001InitialSchema } from '@/storage/migrations/migration-001-initial-schema';
import { migration002AddLanguageSetting } from '@/storage/migrations/migration-002-add-language-setting';
import { migration003AddDateFormatSetting } from '@/storage/migrations/migration-003-add-date-format-setting';
import { migration004DefaultDateFormatDmy } from '@/storage/migrations/migration-004-default-date-format-dmy';
import { migration005AddAccentColorSetting } from '@/storage/migrations/migration-005-add-accent-color-setting';
import { migration006AddHabitNotificationId } from '@/storage/migrations/migration-006-add-habit-notification-id';
import { migration007AddAppBackgroundSetting } from '@/storage/migrations/migration-007-add-app-background-setting';

type Migration = {
  id: number;
  name: string;
  up: (database: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  migration001InitialSchema,
  migration002AddLanguageSetting,
  migration003AddDateFormatSetting,
  migration004DefaultDateFormatDmy,
  migration005AddAccentColorSetting,
  migration006AddHabitNotificationId,
  migration007AddAppBackgroundSetting,
];

export async function runMigrationsAsync(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await database.getAllAsync<{ id: number }>(
    'SELECT id FROM schema_migrations ORDER BY id ASC;'
  );
  const appliedMigrationIds = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      await migration.up(database);
      await database.runAsync(
        'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);',
        migration.id,
        migration.name,
        new Date().toISOString()
      );
    });
  }
}
