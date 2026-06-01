import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrationsAsync } from '@/storage/migrations';

const DATABASE_NAME = 'done-loop.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabaseAsync(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrationsAsync(database);
      return database;
    });
  }

  return databasePromise;
}

export async function resetDatabaseConnectionForTestsAsync(): Promise<void> {
  if (!databasePromise) {
    return;
  }

  const database = await databasePromise;
  databasePromise = null;
  await database.closeAsync();
}
