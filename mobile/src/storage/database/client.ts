import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrationsAsync } from '@/storage/migrations';

const DATABASE_NAME = 'done-loop.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function configureDatabaseAsync(database: SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync('PRAGMA busy_timeout = 5000;');
}

export async function getDatabaseAsync(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      try {
        await configureDatabaseAsync(database);
        await runMigrationsAsync(database);
        return database;
      } catch (error) {
        await database.closeAsync().catch(() => undefined);
        throw error;
      }
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function openIndependentDatabaseAsync(): Promise<SQLiteDatabase> {
  await getDatabaseAsync();
  const database = await openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });

  try {
    await configureDatabaseAsync(database);
    return database;
  } catch (error) {
    await database.closeAsync().catch(() => undefined);
    throw error;
  }
}

export async function resetDatabaseConnectionForTestsAsync(): Promise<void> {
  if (!databasePromise) {
    return;
  }

  const database = await databasePromise;
  databasePromise = null;
  await database.closeAsync();
}
