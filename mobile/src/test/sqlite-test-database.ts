import type {
  SQLiteBindParams,
  SQLiteBindValue,
  SQLiteDatabase,
  SQLiteRunResult,
} from 'expo-sqlite';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

function toNodeParameter(value: unknown): SQLInputValue {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value === null || typeof value === 'string' || typeof value === 'number' || value instanceof Uint8Array) {
    return value;
  }
  throw new Error('Unsupported SQLite test parameter.');
}

function bindParameters(params: (SQLiteBindValue | SQLiteBindParams)[]): {
  named: Record<string, SQLInputValue> | null;
  positional: SQLInputValue[];
} {
  const first = params[0];
  if (params.length === 1 && Array.isArray(first)) {
    return { named: null, positional: first.map(toNodeParameter) };
  }
  if (params.length === 1 && first !== null && typeof first === 'object' && !(first instanceof Uint8Array)) {
    return {
      named: Object.fromEntries(Object.entries(first).map(([key, value]) => [key, toNodeParameter(value)])),
      positional: [],
    };
  }
  return { named: null, positional: params.map(toNodeParameter) };
}

type TestDatabaseApi = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync' | 'closeAsync'
>;

export function createSqliteTestDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const api: TestDatabaseApi = {
    async execAsync(sql: string): Promise<void> {
      sqlite.exec(sql);
    },
    async runAsync(sql: string, ...params: (SQLiteBindValue | SQLiteBindParams)[]): Promise<SQLiteRunResult> {
      const bindings = bindParameters(params);
      const statement = sqlite.prepare(sql);
      const result = bindings.named
        ? statement.run(bindings.named)
        : statement.run(...bindings.positional);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getAllAsync<T>(sql: string, ...params: (SQLiteBindValue | SQLiteBindParams)[]): Promise<T[]> {
      const bindings = bindParameters(params);
      const statement = sqlite.prepare(sql);
      return (bindings.named
        ? statement.all(bindings.named)
        : statement.all(...bindings.positional)) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: (SQLiteBindValue | SQLiteBindParams)[]): Promise<T | null> {
      const bindings = bindParameters(params);
      const statement = sqlite.prepare(sql);
      const row = bindings.named
        ? statement.get(bindings.named)
        : statement.get(...bindings.positional);
      return row ? row as T : null;
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      sqlite.exec('BEGIN;');
      try {
        await task();
        sqlite.exec('COMMIT;');
      } catch (error) {
        sqlite.exec('ROLLBACK;');
        throw error;
      }
    },
    async closeAsync(): Promise<void> {
      sqlite.close();
    },
  };

  // Existing migration signatures accept Expo's full class; tests implement its SQL surface.
  return { database: api as SQLiteDatabase, sqlite };
}
