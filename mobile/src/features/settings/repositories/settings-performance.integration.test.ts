import { getDatabaseAsync } from '@/storage/database/client';
import { runMigrationsAsync } from '@/storage/migrations';
import { createSqliteTestDatabase } from '@/test/sqlite-test-database';
import { SettingsRepository } from './settings-repository';

jest.mock('@/storage/database/client', () => ({ getDatabaseAsync: jest.fn() }));

describe('settings coordination with real SQLite', () => {
  const { database } = createSqliteTestDatabase();
  beforeAll(async () => {
    jest.mocked(getDatabaseAsync).mockResolvedValue(database);
    await runMigrationsAsync(database);
    await SettingsRepository.get();
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => { await database.closeAsync(); });

  it('shares simultaneous settings reads and performs no writes for unchanged preferences', async () => {
    const reads = jest.spyOn(database, 'getFirstAsync');
    const writes = jest.spyOn(database, 'runAsync');
    const settings = await Promise.all(Array.from({ length: 20 }, () => SettingsRepository.get()));
    expect(reads).toHaveBeenCalledTimes(1);
    await Promise.all(Array.from({ length: 20 }, () => SettingsRepository.update({ theme: settings[0].theme })));
    expect(writes).not.toHaveBeenCalled();
  });

  it('preserves independent concurrent preference changes and recovers a failed write', async () => {
    await Promise.all([
      SettingsRepository.update({ theme: 'dark' }),
      SettingsRepository.update({ lastActiveRoute: '/notes' }),
    ]);
    expect(await SettingsRepository.get()).toMatchObject({ theme: 'dark', lastActiveRoute: '/notes' });
    jest.spyOn(database, 'runAsync').mockRejectedValueOnce(new Error('disk busy'));
    await expect(SettingsRepository.update({ theme: 'light' })).rejects.toThrow('disk busy');
    await expect(SettingsRepository.update({ theme: 'light' })).resolves.toMatchObject({
      theme: 'light', lastActiveRoute: '/notes',
    });
  });
});
