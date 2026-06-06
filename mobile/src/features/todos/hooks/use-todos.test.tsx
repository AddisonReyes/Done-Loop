import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { TodoRepository } from '@/features/todos/repositories';
import type { Todo } from '@/features/todos/types';
import { createTestTranslator as mockCreateTestTranslator } from '@/test/test-utils';
import { emitAppEvent } from '@/shared/events/app-events';

import { useTodos } from './use-todos';

jest.mock('@/features/todos/repositories', () => ({
  TodoRepository: {
    create: jest.fn(),
    deleteById: jest.fn(),
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: {
    get: jest.fn(),
  },
}));

jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: {
    cancelAsync: jest.fn(),
    scheduleTodoReminderAsync: jest.fn(),
  },
}));

jest.mock('@/features/settings/hooks/use-date-format-preference', () => ({
  useDateFormatPreference: () => 'dmy',
}));

jest.mock('@/shared/hooks/use-current-date-key', () => ({
  useCurrentDateKey: () => '2026-06-03',
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'en',
    locale: 'en',
    t: mockCreateTestTranslator('en'),
  }),
}));

const pendingTodo: Todo = {
  id: 'todo_1',
  title: 'Pay rent',
  priority: 1,
  status: 'pending',
  dueAt: '2026-06-03',
  notificationId: 'notification_1',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('useTodos', () => {
  let activeTodos: Todo[];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    activeTodos = [];
    jest.mocked(TodoRepository.listActive).mockImplementation(async () => activeTodos);
    jest.mocked(TodoRepository.create).mockImplementation(async (input) => {
      const todo: Todo = {
        id: 'todo_created',
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: 'pending',
        dueAt: input.dueAt,
        notificationId: input.notificationId,
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
      };
      activeTodos = [todo];
      return todo;
    });
    jest.mocked(TodoRepository.update).mockImplementation(async (id, input) => {
      const existing = activeTodos.find((todo) => todo.id === id);
      if (!existing) {
        return null;
      }

      const next = { ...existing, ...input, updatedAt: '2026-06-03T12:00:00.000Z' };
      activeTodos = activeTodos.map((todo) => (todo.id === id ? next : todo));
      return next;
    });
    jest.mocked(TodoRepository.deleteById).mockResolvedValue(true);
    jest.mocked(SettingsRepository.get).mockResolvedValue({
      animationsEnabled: true,
      accentColor: 'purple',
      appBackground: 'none',
      dateFormat: 'dmy',
      language: 'en',
      notificationsEnabled: true,
      privacyPolicyUrl: 'https://done-loop.com/privacy',
      termsUrl: 'https://done-loop.pages.dev/terms',
      theme: 'system',
    });
    jest.mocked(NotificationService.cancelAsync).mockResolvedValue(undefined);
    jest.mocked(NotificationService.scheduleTodoReminderAsync).mockResolvedValue('notification_created');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function renderUseTodos() {
    const rendered = renderHook(() => useTodos());

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));

    return rendered;
  }

  it('loads active todos and exposes sorted todos', async () => {
    activeTodos = [pendingTodo];

    const { result } = await renderUseTodos();

    expect(result.current.sortedTodos).toEqual([pendingTodo]);
    expect(result.current.errorMessage).toBeNull();
  });

  it('creates a todo from a draft and stores the scheduled notification id', async () => {
    const { result } = await renderUseTodos();

    await act(async () => {
      await expect(
        result.current.createTodoFromDraft({ title: '  Pay rent  ', priority: 1, dueAt: '2026-06-04' })
      ).resolves.toBe(true);
    });

    expect(NotificationService.scheduleTodoReminderAsync).toHaveBeenCalledWith({
      title: 'Pay rent',
      dueAt: '2026-06-04',
      language: 'en',
    });
    expect(TodoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pay rent', notificationId: 'notification_created' })
    );
    expect(TodoRepository.listActive).toHaveBeenCalledTimes(2);
    expect(result.current.sortedTodos).toHaveLength(1);
  });

  it('completes todos with a local completed date key', async () => {
    activeTodos = [pendingTodo];
    const { result } = await renderUseTodos();

    await act(async () => {
      await expect(result.current.completeTodo(pendingTodo)).resolves.toBe(true);
    });

    expect(NotificationService.cancelAsync).toHaveBeenCalledWith('notification_1');
    expect(TodoRepository.update).toHaveBeenCalledWith(
      'todo_1',
      expect.objectContaining({
        status: 'completed',
        completedDate: '2026-06-03',
        notificationId: undefined,
      })
    );
  });

  it('groups completed todos by completedDate instead of slicing completedAt', async () => {
    activeTodos = [
      {
        ...pendingTodo,
        status: 'completed',
        dueAt: undefined,
        completedAt: '2026-06-04T03:30:00.000Z',
        completedDate: '2026-06-03',
      },
    ];
    const { result } = await renderUseTodos();

    expect(result.current.calendarGroups[0]?.[0]).toBe('2026-06-03');
    expect(result.current.getTodoDateLabel(activeTodos[0])).toBe('Completed 03/06/2026');
  });

  it('sorts todos by priority, due date, and newest created date', async () => {
    activeTodos = [
      { ...pendingTodo, id: 'todo_low', priority: 3, dueAt: '2026-06-08', createdAt: '2026-06-01T00:00:00.000Z' },
      { ...pendingTodo, id: 'todo_high', priority: 1, dueAt: '2026-06-10', createdAt: '2026-06-02T00:00:00.000Z' },
      { ...pendingTodo, id: 'todo_mid', priority: 2, dueAt: '2026-06-04', createdAt: '2026-06-03T00:00:00.000Z' },
    ];
    const { result } = await renderUseTodos();

    expect(result.current.sortedTodos.map((todo) => todo.id)).toEqual(['todo_high', 'todo_mid', 'todo_low']);

    act(() => {
      result.current.setSort('dueAt');
    });
    expect(result.current.sortedTodos.map((todo) => todo.id)).toEqual(['todo_mid', 'todo_low', 'todo_high']);

    act(() => {
      result.current.setSort('createdAt');
    });
    expect(result.current.sortedTodos.map((todo) => todo.id)).toEqual(['todo_mid', 'todo_high', 'todo_low']);
  });

  it('updates todos by replacing stale notifications', async () => {
    activeTodos = [pendingTodo];
    const { result } = await renderUseTodos();

    await act(async () => {
      await expect(
        result.current.updateTodoFromDraft(pendingTodo, {
          title: 'Pay rent now',
          priority: 1,
          dueAt: '2026-06-05',
        })
      ).resolves.toBe(true);
    });

    expect(NotificationService.cancelAsync).toHaveBeenCalledWith('notification_1');
    expect(NotificationService.scheduleTodoReminderAsync).toHaveBeenCalledWith({
      title: 'Pay rent now',
      dueAt: '2026-06-05',
      language: 'en',
    });
    expect(TodoRepository.update).toHaveBeenCalledWith(
      'todo_1',
      expect.objectContaining({ title: 'Pay rent now', notificationId: 'notification_created' })
    );
  });

  it('reopens completed todos and restores due-date reminders', async () => {
    const completedTodo: Todo = {
      ...pendingTodo,
      status: 'completed',
      completedAt: '2026-06-03T12:00:00.000Z',
      completedDate: '2026-06-03',
      notificationId: undefined,
    };
    activeTodos = [completedTodo];
    const { result } = await renderUseTodos();

    await act(async () => {
      await expect(result.current.reopenTodo(completedTodo)).resolves.toBe(true);
    });

    expect(NotificationService.scheduleTodoReminderAsync).toHaveBeenCalledWith({
      title: 'Pay rent',
      dueAt: '2026-06-03',
      language: 'en',
    });
    expect(TodoRepository.update).toHaveBeenCalledWith(
      'todo_1',
      expect.objectContaining({ status: 'pending', completedAt: undefined, completedDate: undefined })
    );
  });

  it('deletes todos after cancelling existing notifications', async () => {
    activeTodos = [pendingTodo];
    const { result } = await renderUseTodos();

    await act(async () => {
      await expect(result.current.deleteTodo(pendingTodo)).resolves.toBe(true);
    });

    expect(NotificationService.cancelAsync).toHaveBeenCalledWith('notification_1');
    expect(TodoRepository.deleteById).toHaveBeenCalledWith('todo_1');
  });

  it('surfaces initial load errors without crashing consumers', async () => {
    jest.mocked(TodoRepository.listActive).mockRejectedValueOnce(new Error('database offline'));

    const rendered = renderHook(() => useTodos());
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => expect(rendered.result.current.errorMessage).toBe('database offline'));
    expect(rendered.result.current.isLoading).toBe(false);
  });

  it('reloads silently when another hook source emits a todos change', async () => {
    activeTodos = [];
    const { result } = await renderUseTodos();
    activeTodos = [pendingTodo];

    await act(async () => {
      emitAppEvent('todosChanged', { source: 'external_source' });
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.sortedTodos).toEqual([pendingTodo]));
  });
});
