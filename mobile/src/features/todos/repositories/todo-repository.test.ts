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
    expect(database.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO todos'), expect.any(String), 'Buy milk', 'Whole', 2, 'pending', '2026-05-31', null, null, null, expect.any(String), expect.any(String));
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

  it('updates existing todos and returns null when missing', async () => {
    const database = {
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.update('missing', { title: 'Nope' })).resolves.toBeNull();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it('deletes todos by id', async () => {
    const database = {
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    };
    mockedGetDatabaseAsync.mockResolvedValue(database as never);

    await expect(TodoRepository.deleteById('todo_1')).resolves.toBe(true);
    expect(database.runAsync).toHaveBeenCalledWith('DELETE FROM todos WHERE id = ?;', 'todo_1');
  });
});

