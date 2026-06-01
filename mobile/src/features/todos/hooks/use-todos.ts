import { useCallback, useEffect, useMemo, useState } from 'react';

import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserDateFormatPreference } from '@/features/settings/types';
import { TodoRepository } from '@/features/todos/repositories';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types';
import { useTranslation } from '@/i18n';
import { formatDateKey, isBeforeDateKey, isDateKey, toDateKey } from '@/shared/utils/date';
import { normalizeTodoCreateDraft, normalizeTodoUpdateDraft } from '../services/todo-draft';

type TodoSort = 'priority' | 'dueAt' | 'createdAt';
type TodoViewMode = 'list' | 'calendar';

export function useTodos() {
  const { language, locale, t } = useTranslation();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sort, setSort] = useState<TodoSort>('priority');
  const [viewMode, setViewMode] = useState<TodoViewMode>('list');
  const [dateFormat, setDateFormat] = useState<UserDateFormatPreference>('iso');

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const loadTodos = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      setTodos(await TodoRepository.listActive());
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('todos.loadError'));
      setStatus('error');
    }
  }, [t]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadTodos();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadTodos]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      SettingsRepository.get().then((settings) => setDateFormat(settings.dateFormat));
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const createTodoFromDraft = useCallback(
    async (input: Omit<CreateTodoInput, 'notificationId'>) => {
      const draft = normalizeTodoCreateDraft(input);
      if (!draft) {
        return;
      }

      const notificationId = await NotificationService.scheduleTodoReminderAsync({
        title: draft.title,
        dueAt: draft.dueAt,
        language,
      });

      await TodoRepository.create({
        ...draft,
        notificationId,
      });
      await loadTodos();
    },
    [language, loadTodos]
  );

  const updateTodoFromDraft = useCallback(
    async (todo: Todo, input: UpdateTodoInput) => {
      const draft = normalizeTodoUpdateDraft(input);
      if (!draft) {
        return;
      }

      await TodoRepository.update(todo.id, draft);
      await loadTodos();
    },
    [loadTodos]
  );

  const completeTodo = useCallback(
    async (todo: Todo) => {
      await TodoRepository.update(todo.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      await NotificationService.cancelAsync(todo.notificationId);
      await loadTodos();
    },
    [loadTodos]
  );

  const reopenTodo = useCallback(
    async (todo: Todo) => {
      await TodoRepository.update(todo.id, {
        status: 'pending',
        completedAt: undefined,
      });
      await loadTodos();
    },
    [loadTodos]
  );

  const deleteTodo = useCallback(
    async (todo: Todo) => {
      await NotificationService.cancelAsync(todo.notificationId);
      await TodoRepository.deleteById(todo.id);
      await loadTodos();
    },
    [loadTodos]
  );

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (sort === 'priority') {
        return a.priority - b.priority || a.createdAt.localeCompare(b.createdAt);
      }
      if (sort === 'dueAt') {
        return (a.dueAt ?? '9999-12-31').localeCompare(b.dueAt ?? '9999-12-31');
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [sort, todos]);

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, Todo[]>();

    for (const todo of todos) {
      const completedDateKey = todo.completedAt?.slice(0, 10);
      const dateKey = isDateKey(todo.dueAt)
        ? todo.dueAt
        : isDateKey(completedDateKey)
          ? completedDateKey
          : t('todos.calendarNoDate');
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), todo]);
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [t, todos]);

  const getTodoDateLabel = useCallback(
    (todo: Todo) => {
      if (todo.status === 'completed' && todo.completedAt) {
        return t('todos.completed', { date: formatDateKey(todo.completedAt.slice(0, 10), locale, dateFormat) });
      }
      if (!isDateKey(todo.dueAt)) {
        return t('todos.noDueDate');
      }
      if (todo.dueAt === todayKey) {
        return t('todos.dueToday');
      }
      if (isBeforeDateKey(todo.dueAt, todayKey) && todo.status === 'pending') {
        return t('todos.overdue', { date: formatDateKey(todo.dueAt, locale, dateFormat) });
      }
      return t('todos.due', { date: formatDateKey(todo.dueAt, locale, dateFormat) });
    },
    [dateFormat, locale, t, todayKey]
  );

  return {
    calendarGroups,
    completeTodo,
    createTodoFromDraft,
    dateFormat,
    deleteTodo,
    errorMessage,
    getTodoDateLabel,
    isLoading: status === 'loading',
    reopenTodo,
    setSort,
    setViewMode,
    sort,
    sortedTodos,
    updateTodoFromDraft,
    viewMode,
  };
}

export type { TodoSort, TodoViewMode };
