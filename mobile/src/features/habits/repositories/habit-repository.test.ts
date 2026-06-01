import { getDatabaseAsync } from '@/storage/database/client';

import { HabitRepository } from './habit-repository';

jest.mock('@/storage/database/client', () => ({
  getDatabaseAsync: jest.fn(),
}));

jest.mock('@/storage/database/ids', () => ({
  createLocalId: jest.fn(() => 'habit_test'),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe('HabitRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates habits with normalized sqlite values', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    const habit = await HabitRepository.create({
      name: 'Read',
      recurrenceType: 'daily',
      remindersEnabled: true,
      reminderTime: '07:30',
    });

    expect(habit).toMatchObject({
      id: 'habit_test',
      name: 'Read',
      isActive: true,
      remindersEnabled: true,
    });
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO habits'),
      'habit_test',
      'Read',
      null,
      'daily',
      null,
      '07:30',
      1,
      1,
      expect.any(String),
      expect.any(String),
      null
    );
  });

  it('lists active habits and maps sqlite booleans', async () => {
    const database = {
      getAllAsync: jest.fn(async () => [
        {
          id: 'habit_1',
          name: 'Read',
          description: null,
          recurrence_type: 'daily',
          custom_interval_days: null,
          reminder_time: null,
          reminders_enabled: 0,
          is_active: 1,
          created_at: '2026-05-30T00:00:00.000Z',
          updated_at: '2026-05-30T00:00:00.000Z',
          deleted_at: null,
        },
      ]),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.listActive()).resolves.toMatchObject([
      {
        id: 'habit_1',
        description: undefined,
        remindersEnabled: false,
        isActive: true,
      },
    ]);
  });

  it('returns null when updating a missing habit', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.update('missing', { name: 'Nope' })).resolves.toBeNull();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it('deletes habits by id', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.deleteById('habit_1')).resolves.toBe(true);
    expect(database.runAsync).toHaveBeenCalledWith('DELETE FROM habits WHERE id = ?;', 'habit_1');
  });
});

