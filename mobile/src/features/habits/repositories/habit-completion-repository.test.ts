import { getDatabaseAsync } from '@/storage/database/client';

import { HabitCompletionRepository } from './habit-completion-repository';

jest.mock('@/storage/database/client', () => ({
  getDatabaseAsync: jest.fn(),
}));

jest.mock('@/storage/database/ids', () => ({
  createLocalId: jest.fn(() => 'habit_completion_test'),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe('HabitCompletionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a new completion when no habit/date row exists', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    const completion = await HabitCompletionRepository.upsert({
      habitId: 'habit_1',
      date: '2026-05-31',
      completed: true,
    });

    expect(completion).toMatchObject({
      id: 'habit_completion_test',
      habitId: 'habit_1',
      date: '2026-05-31',
      completed: true,
    });
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO habit_completions'),
      'habit_completion_test',
      'habit_1',
      '2026-05-31',
      1,
      expect.any(String),
      expect.any(String)
    );
  });

  it('updates the existing completion for the same habit/date pair', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => ({
        id: 'completion_1',
        habit_id: 'habit_1',
        date: '2026-05-31',
        completed: 1,
        created_at: '2026-05-31T00:00:00.000Z',
        updated_at: '2026-05-31T00:00:00.000Z',
      })),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(
      HabitCompletionRepository.upsert({
        habitId: 'habit_1',
        date: '2026-05-31',
        completed: false,
      })
    ).resolves.toMatchObject({ id: 'completion_1', completed: false });
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE habit_completions'),
      0,
      expect.any(String),
      'completion_1'
    );
  });

  it('lists completions by date range in ascending order query', async () => {
    const database = {
      getAllAsync: jest.fn(async () => []),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await HabitCompletionRepository.listByDateRange('2026-05-01', '2026-05-31');

    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY date ASC, habit_id ASC'),
      '2026-05-01',
      '2026-05-31'
    );
  });

  it('deletes completions by habit id', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 2, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitCompletionRepository.deleteByHabitId('habit_1')).resolves.toBe(2);
    expect(database.runAsync).toHaveBeenCalledWith(
      'DELETE FROM habit_completions WHERE habit_id = ?;',
      'habit_1'
    );
  });
});

