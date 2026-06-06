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
      getFirstAsync: jest.fn(async () => ({
        id: 'habit_completion_test',
        habit_id: 'habit_1',
        date: '2026-05-31',
        completed: 1,
        created_at: '2026-05-31T00:00:00.000Z',
        updated_at: '2026-05-31T00:00:00.000Z',
      })),
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
        completed: 0,
        created_at: '2026-05-31T00:00:00.000Z',
        updated_at: '2026-05-31T01:00:00.000Z',
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
      expect.stringContaining('ON CONFLICT(habit_id, date) DO UPDATE'),
      'habit_completion_test',
      'habit_1',
      '2026-05-31',
      0,
      expect.any(String),
      expect.any(String)
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

  it('lists completed date keys for one habit in a date range', async () => {
    const database = {
      getAllAsync: jest.fn(async () => [
        { date: '2026-05-02' },
        { date: '2026-05-03' },
        { date: 'not-a-date' },
      ]),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(
      HabitCompletionRepository.listCompletedDateKeysByHabitId('habit_1', '2026-05-01', '2026-05-31')
    ).resolves.toEqual(new Set(['2026-05-02', '2026-05-03']));
    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND completed = 1'),
      'habit_1',
      '2026-05-01',
      '2026-05-31'
    );
  });

  it('rejects invalid completion dates before writing', async () => {
    await expect(
      HabitCompletionRepository.upsert({
        habitId: 'habit_1',
        date: '2026-02-31',
        completed: true,
      })
    ).rejects.toThrow('Invalid habit completion date.');
    expect(mockedGetDatabaseAsync).not.toHaveBeenCalled();
  });

  it('rejects invalid date range boundaries before querying', async () => {
    await expect(HabitCompletionRepository.listByDateRange('2026-05-01', 'bad-date')).rejects.toThrow(
      'Invalid habit completion date range.'
    );
    expect(mockedGetDatabaseAsync).not.toHaveBeenCalled();
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
