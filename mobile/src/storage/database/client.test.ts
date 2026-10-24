import { openDatabaseAsync } from 'expo-sqlite';

import { runMigrationsAsync } from '@/storage/migrations';

import { getDatabaseAsync, openIndependentDatabaseAsync, resetDatabaseConnectionForTestsAsync } from './client';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@/storage/migrations', () => ({
  runMigrationsAsync: jest.fn(),
}));

const mockedOpenDatabaseAsync = jest.mocked(openDatabaseAsync);
const mockedRunMigrationsAsync = jest.mocked(runMigrationsAsync);

function createDatabase() {
  return {
    closeAsync: jest.fn(async () => undefined),
    execAsync: jest.fn(async () => undefined),
  };
}

describe('getDatabaseAsync', () => {
  beforeEach(() => {
    mockedOpenDatabaseAsync.mockReset();
    mockedRunMigrationsAsync.mockReset();
    mockedRunMigrationsAsync.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await resetDatabaseConnectionForTestsAsync();
  });

  it('clears the cached initialization promise after a migration failure', async () => {
    const failedDatabase = createDatabase();
    const recoveredDatabase = createDatabase();

    mockedOpenDatabaseAsync
      .mockResolvedValueOnce(failedDatabase as never)
      .mockResolvedValueOnce(recoveredDatabase as never);
    mockedRunMigrationsAsync
      .mockRejectedValueOnce(new Error('migration failed'))
      .mockResolvedValueOnce(undefined);

    await expect(getDatabaseAsync()).rejects.toThrow('migration failed');
    await expect(getDatabaseAsync()).resolves.toBe(recoveredDatabase);

    expect(mockedOpenDatabaseAsync).toHaveBeenCalledTimes(2);
    expect(failedDatabase.closeAsync).toHaveBeenCalledTimes(1);
    expect(recoveredDatabase.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(recoveredDatabase.execAsync).toHaveBeenCalledWith('PRAGMA busy_timeout = 5000;');
  });

  it('opens an independent connection only after the primary database is migrated', async () => {
    const primary = createDatabase();
    const independent = createDatabase();
    const order: string[] = [];
    mockedOpenDatabaseAsync
      .mockResolvedValueOnce(primary as never)
      .mockImplementationOnce(async () => {
        order.push('independent');
        return independent as never;
      });
    mockedRunMigrationsAsync.mockImplementationOnce(async () => {
      order.push('migrations');
    });

    await expect(openIndependentDatabaseAsync()).resolves.toBe(independent);

    expect(order).toEqual(['migrations', 'independent']);
    expect(mockedOpenDatabaseAsync).toHaveBeenLastCalledWith('done-loop.db', { useNewConnection: true });
    expect(independent.execAsync.mock.calls).toEqual([
      ['PRAGMA foreign_keys = ON;'],
      ['PRAGMA busy_timeout = 5000;'],
    ]);
    expect(mockedRunMigrationsAsync).toHaveBeenCalledTimes(1);
  });

  it('closes an independent connection if its configuration fails', async () => {
    const primary = createDatabase();
    const independent = createDatabase();
    independent.execAsync.mockRejectedValueOnce(new Error('configuration failed'));
    mockedOpenDatabaseAsync
      .mockResolvedValueOnce(primary as never)
      .mockResolvedValueOnce(independent as never);

    await expect(openIndependentDatabaseAsync()).rejects.toThrow('configuration failed');
    expect(independent.closeAsync).toHaveBeenCalledTimes(1);
    await expect(getDatabaseAsync()).resolves.toBe(primary);
  });
});
