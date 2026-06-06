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
      null,
      null,
      '07:30',
      1,
      null,
      1,
      expect.any(String),
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
          weekly_days: '[1,3,5]',
          monthly_days: null,
          reminder_time: null,
          reminders_enabled: 0,
          notification_id: null,
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
        weeklyDays: [1, 3, 5],
        monthlyDays: undefined,
        remindersEnabled: false,
        isActive: true,
      },
    ]);
  });

  it('defensively normalizes invalid sqlite habit values', async () => {
    const database = {
      getAllAsync: jest.fn(async () => [
        {
          id: 'habit_1',
          name: 'Odd row',
          description: '',
          recurrence_type: 'unknown',
          custom_interval_days: -1,
          weekly_days: '[0,1,1,8,"x"]',
          monthly_days: 'not-json',
          reminder_time: '',
          reminders_enabled: 2,
          notification_id: '',
          is_active: 1,
          start_date: 'not-a-date',
          created_at: '2026-05-30T00:00:00.000Z',
          updated_at: '2026-05-30T00:00:00.000Z',
          deleted_at: null,
        },
      ]),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.listActive()).resolves.toEqual([
      expect.objectContaining({
        customIntervalDays: undefined,
        description: '',
        monthlyDays: undefined,
        notificationId: '',
        recurrenceType: 'daily',
        reminderTime: '',
        startDate: undefined,
        weeklyDays: [1],
      }),
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

  it('updates existing habits and serializes recurrence lists safely', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => ({
        id: 'habit_1',
        name: 'Original',
        description: null,
        recurrence_type: 'daily',
        custom_interval_days: null,
        weekly_days: null,
        monthly_days: null,
        reminder_time: null,
        reminders_enabled: 0,
        notification_id: null,
        is_active: 1,
        start_date: '2026-06-01',
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
        deleted_at: null,
      })),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(
      HabitRepository.update('habit_1', {
        name: 'Weekly workout',
        recurrenceType: 'weekly',
        weeklyDays: [1, 3, 5],
        remindersEnabled: true,
        notificationId: 'notification_1',
      })
    ).resolves.toMatchObject({
      name: 'Weekly workout',
      notificationId: 'notification_1',
      remindersEnabled: true,
      weeklyDays: [1, 3, 5],
    });
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE habits'),
      'Weekly workout',
      null,
      'weekly',
      null,
      '[1,3,5]',
      null,
      null,
      1,
      'notification_1',
      1,
      '2026-06-01',
      expect.any(String),
      null,
      'habit_1'
    );
  });

  it('soft deletes habits by id', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.deleteById('habit_1')).resolves.toBe(true);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET is_active = 0'),
      expect.any(String),
      expect.any(String),
      'habit_1'
    );
  });

  it('clears stored habit notification ids in bulk', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 2, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(HabitRepository.clearAllNotificationIds()).resolves.toBe(2);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET notification_id = NULL'),
      expect.any(String)
    );
  });
});
