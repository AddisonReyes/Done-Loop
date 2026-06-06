import { getDatabaseAsync } from '@/storage/database/client';

import { TodoRepository } from './todo-repository';

jest.mock('@/storage/database/client', () => ({
  getDatabaseAsync: jest.fn(),
}));

jest.mock('@/storage/database/ids', () => ({
  createLocalId: jest.fn(() => 'todo_test'),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe('TodoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates todos with safe parameterized writes', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    const todo = await TodoRepository.create({
      title: 'Buy milk',
      description: 'Whole',
      priority: 2,
      dueAt: '2026-05-31',
    });

    expect(todo).toMatchObject({
      id: 'todo_test',
      title: 'Buy milk',
      priority: 2,
      status: 'pending',
    });
    expect(database.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO todos'), expect.any(String), 'Buy milk', 'Whole', 2, 'pending', '2026-05-31', null, null, null, null, expect.any(String), expect.any(String));
  });

  it('lists active todos mapped from sqlite rows', async () => {
    const database = {
      getAllAsync: jest.fn(async () => [
        {
          id: 'todo_1',
          title: 'Done',
          description: null,
          priority: 1,
          status: 'completed',
          due_at: null,
          completed_at: '2026-05-31T00:00:00.000Z',
          deleted_at: null,
          notification_id: null,
          created_at: '2026-05-30T00:00:00.000Z',
          updated_at: '2026-05-31T00:00:00.000Z',
        },
      ]),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.listActive()).resolves.toMatchObject([
      {
        id: 'todo_1',
        description: undefined,
        completedAt: '2026-05-31T00:00:00.000Z',
      },
    ]);
  });

  it('defensively normalizes invalid sqlite todo values', async () => {
    const database = {
      getAllAsync: jest.fn(async () => [
        {
          id: 'todo_1',
          title: 'Odd row',
          description: '',
          priority: 99,
          status: 'unknown',
          due_at: 'not-a-date',
          completed_at: null,
          completed_date: 'not-a-date',
          deleted_at: null,
          notification_id: '',
          created_at: '2026-05-30T00:00:00.000Z',
          updated_at: '2026-05-31T00:00:00.000Z',
        },
      ]),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.listActive()).resolves.toEqual([
      expect.objectContaining({
        completedDate: undefined,
        description: '',
        dueAt: undefined,
        notificationId: '',
        priority: 2,
        status: 'pending',
      }),
    ]);
  });

  it('updates existing todos and returns null when missing', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.update('missing', { title: 'Nope' })).resolves.toBeNull();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it('updates existing todos while preserving omitted fields', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => ({
        id: 'todo_1',
        title: 'Original',
        description: 'Keep me',
        priority: 2,
        status: 'pending',
        due_at: '2026-06-06',
        completed_at: null,
        completed_date: null,
        deleted_at: null,
        notification_id: 'notification_1',
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      })),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.update('todo_1', { title: 'Updated' })).resolves.toMatchObject({
      description: 'Keep me',
      dueAt: '2026-06-06',
      notificationId: 'notification_1',
      title: 'Updated',
    });
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE todos'),
      'Updated',
      'Keep me',
      2,
      'pending',
      '2026-06-06',
      null,
      null,
      null,
      'notification_1',
      expect.any(String),
      'todo_1'
    );
  });

  it('soft deletes todos by id', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.deleteById('todo_1')).resolves.toBe(true);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'deleted'"),
      expect.any(String),
      expect.any(String),
      'todo_1'
    );
  });

  it('clears stored notification ids in bulk', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 3, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.clearAllNotificationIds()).resolves.toBe(3);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET notification_id = NULL'),
      expect.any(String)
    );
  });
});
