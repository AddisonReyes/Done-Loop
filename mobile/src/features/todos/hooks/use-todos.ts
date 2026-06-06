import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NotificationService } from '@/features/notifications/services/notification-service';
import { useDateFormatPreference } from '@/features/settings/hooks/use-date-format-preference';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { TodoRepository } from '@/features/todos/repositories';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/features/todos/types';
import { useTranslation } from '@/i18n';
import { createAppEventSource, emitAppEvent, subscribeToAppEvent } from '@/shared/events/app-events';
import { useCurrentDateKey } from '@/shared/hooks/use-current-date-key';
import { formatDateKey, isBeforeDateKey, isDateKey, toDateKey } from '@/shared/utils/date';
import { normalizeTodoCreateDraft, normalizeTodoUpdateDraft } from '../services/todo-draft';

type TodoSort = 'priority' | 'dueAt' | 'createdAt';
type TodoViewMode = 'list' | 'calendar';
type LoadOptions = {
  silent?: boolean;
};

export function useTodos() {
  const { language, locale, t } = useTranslation();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sort, setSort] = useState<TodoSort>('priority');
  const [viewMode, setViewMode] = useState<TodoViewMode>('list');
  const hasLoadedTodosRef = useRef(false);
  const eventSourceRef = useRef(createAppEventSource('todos'));
  const dateFormat = useDateFormatPreference();
  const todayKey = useCurrentDateKey();

  const loadTodos = useCallback(async (options: LoadOptions = {}) => {
    const shouldShowLoading = !options.silent && !hasLoadedTodosRef.current;

    try {
      if (shouldShowLoading) {
        setStatus('loading');
      }
      setTodos(await TodoRepository.listActive());
      hasLoadedTodosRef.current = true;
      setErrorMessage(null);
      setStatus('idle');
    } catch (error) {
      if (!options.silent || !hasLoadedTodosRef.current) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.loadError'));
        setStatus('error');
      }
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
    return subscribeToAppEvent('todosChanged', (payload) => {
      if (payload.source === eventSourceRef.current) {
        return;
      }

      void loadTodos({ silent: true });
    });
  }, [loadTodos]);

  const createTodoFromDraft = useCallback(
    async (input: Omit<CreateTodoInput, 'notificationId'>) => {
      try {
        setErrorMessage(null);
        const draft = normalizeTodoCreateDraft(input);
        if (!draft) {
          return false;
        }

        const settings = await SettingsRepository.get();
        const notificationId = settings.notificationsEnabled
          ? await NotificationService.scheduleTodoReminderAsync({
              title: draft.title,
              dueAt: draft.dueAt,
              language,
            })
          : undefined;

        await TodoRepository.create({
          ...draft,
          notificationId,
        });
        await loadTodos({ silent: true });
        emitAppEvent('todosChanged', { source: eventSourceRef.current });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.saveError'));
        return false;
      }
    },
    [language, loadTodos, t]
  );

  const updateTodoFromDraft = useCallback(
    async (todo: Todo, input: UpdateTodoInput) => {
      try {
        setErrorMessage(null);
        const draft = normalizeTodoUpdateDraft(input);
        if (!draft) {
          return false;
        }

        await NotificationService.cancelAsync(todo.notificationId);
        const settings = await SettingsRepository.get();
        const nextTitle = draft.title ?? todo.title;
        const nextDueAt = 'dueAt' in input ? draft.dueAt : todo.dueAt;
        const nextStatus = draft.status ?? todo.status;
        const notificationId = settings.notificationsEnabled && nextStatus === 'pending'
          ? await NotificationService.scheduleTodoReminderAsync({
              title: nextTitle,
              dueAt: nextDueAt,
              language,
            })
          : undefined;

        await TodoRepository.update(todo.id, { ...draft, notificationId });
        await loadTodos({ silent: true });
        emitAppEvent('todosChanged', { source: eventSourceRef.current });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.saveError'));
        return false;
      }
    },
    [language, loadTodos, t]
  );

  const completeTodo = useCallback(
    async (todo: Todo) => {
      try {
        setErrorMessage(null);
        await NotificationService.cancelAsync(todo.notificationId);
        const completedAt = new Date().toISOString();
        await TodoRepository.update(todo.id, {
          status: 'completed',
          completedAt,
          completedDate: todayKey,
          notificationId: undefined,
        });
        await loadTodos({ silent: true });
        emitAppEvent('todosChanged', { source: eventSourceRef.current });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.saveError'));
        return false;
      }
    },
    [loadTodos, t, todayKey]
  );

  const reopenTodo = useCallback(
    async (todo: Todo) => {
      try {
        setErrorMessage(null);
        const settings = await SettingsRepository.get();
        const notificationId = settings.notificationsEnabled
          ? await NotificationService.scheduleTodoReminderAsync({
              title: todo.title,
              dueAt: todo.dueAt,
              language,
            })
          : undefined;

        await TodoRepository.update(todo.id, {
          status: 'pending',
          completedAt: undefined,
          completedDate: undefined,
          notificationId,
        });
        await loadTodos({ silent: true });
        emitAppEvent('todosChanged', { source: eventSourceRef.current });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.saveError'));
        return false;
      }
    },
    [language, loadTodos, t]
  );

  const deleteTodo = useCallback(
    async (todo: Todo) => {
      try {
        setErrorMessage(null);
        await NotificationService.cancelAsync(todo.notificationId);
        await TodoRepository.deleteById(todo.id);
        await loadTodos({ silent: true });
        emitAppEvent('todosChanged', { source: eventSourceRef.current });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('todos.saveError'));
        return false;
      }
    },
    [loadTodos, t]
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
      const completedDateKey = todo.completedDate ?? getCompletedDateKey(todo.completedAt);
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
        return t('todos.completed', {
          date: formatDateKey(todo.completedDate ?? getCompletedDateKey(todo.completedAt), locale, dateFormat),
        });
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

function getCompletedDateKey(completedAt: string | undefined): string | undefined {
  if (!completedAt) {
    return undefined;
  }

  const completedDate = new Date(completedAt);
  return Number.isNaN(completedDate.getTime()) ? undefined : toDateKey(completedDate);
}
