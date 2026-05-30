import { useCallback, useEffect, useMemo, useState } from 'react';

import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserDateFormatPreference } from '@/features/settings/types';
import { TodoRepository } from '@/features/todos/repositories';
import type { CreateTodoInput, Todo, TodoPriority, UpdateTodoInput } from '@/features/todos/types';
import { useTranslation } from '@/i18n';
import { formatDateKey, isBeforeDateKey, isDateKey, toDateKey } from '@/shared/utils/date';

type TodoSort = 'priority' | 'dueAt' | 'createdAt';
type TodoViewMode = 'list' | 'calendar';

const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

export function useTodosMvp() {
  const { language, locale, t } = useTranslation();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>(2);
  const [dueDate, setDueDate] = useState('');
  const [sort, setSort] = useState<TodoSort>('priority');
  const [viewMode, setViewMode] = useState<TodoViewMode>('list');
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [dateFormat, setDateFormat] = useState<UserDateFormatPreference>('iso');

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const normalizedDueDate = useMemo(() => {
    const value = dueDate.trim();
    return isDateKey(value) ? value : undefined;
  }, [dueDate]);

  const loadTodos = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      await TodoRepository.purgeDeletedBefore(new Date(Date.now() - oneMonthMs).toISOString());
      setTodos(await TodoRepository.listAll());
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

  const createTodo = useCallback(async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    const notificationId = await NotificationService.scheduleTodoReminderAsync({
      title: cleanTitle,
      dueAt: normalizedDueDate,
      language,
    });

    await TodoRepository.create({
      title: cleanTitle,
      priority,
      dueAt: normalizedDueDate,
      notificationId,
    });
    setTitle('');
    setDueDate('');
    setPriority(2);
    await loadTodos();
  }, [language, loadTodos, normalizedDueDate, priority, title]);

  const createTodoFromDraft = useCallback(
    async (input: Omit<CreateTodoInput, 'notificationId'>) => {
      if (!input.title.trim()) {
        return;
      }

      const notificationId = await NotificationService.scheduleTodoReminderAsync({
        title: input.title.trim(),
        dueAt: input.dueAt,
        language,
      });

      await TodoRepository.create({
        ...input,
        title: input.title.trim(),
        notificationId,
      });
      await loadTodos();
    },
    [language, loadTodos]
  );

  const startEditing = useCallback((todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTodoId(null);
    setEditingTitle('');
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingTodoId || !editingTitle.trim()) {
      return;
    }

    await TodoRepository.update(editingTodoId, { title: editingTitle.trim() });
    cancelEditing();
    await loadTodos();
  }, [cancelEditing, editingTitle, editingTodoId, loadTodos]);

  const updateTodoFromDraft = useCallback(
    async (todo: Todo, input: UpdateTodoInput) => {
      if (!input.title?.trim()) {
        return;
      }

      await TodoRepository.update(todo.id, {
        ...input,
        title: input.title.trim(),
      });
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

  const softDeleteTodo = useCallback(
    async (todo: Todo) => {
      await TodoRepository.update(todo.id, {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
      });
      await NotificationService.cancelAsync(todo.notificationId);
      await loadTodos();
    },
    [loadTodos]
  );

  const restoreTodo = useCallback(
    async (todo: Todo) => {
      await TodoRepository.update(todo.id, {
        status: 'pending',
        deletedAt: undefined,
      });
      await loadTodos();
    },
    [loadTodos]
  );

  const permanentlyDeleteTodo = useCallback(
    async (todo: Todo) => {
      await TodoRepository.deleteById(todo.id);
      await loadTodos();
    },
    [loadTodos]
  );

  const activeTodos = useMemo(() => todos.filter((todo) => todo.status !== 'deleted'), [todos]);
  const deletedTodos = useMemo(() => todos.filter((todo) => todo.status === 'deleted'), [todos]);

  const sortedTodos = useMemo(() => {
    const source = showDeleted ? deletedTodos : activeTodos;

    return [...source].sort((a, b) => {
      if (sort === 'priority') {
        return a.priority - b.priority || a.createdAt.localeCompare(b.createdAt);
      }
      if (sort === 'dueAt') {
        return (a.dueAt ?? '9999-12-31').localeCompare(b.dueAt ?? '9999-12-31');
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [activeTodos, deletedTodos, showDeleted, sort]);

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, Todo[]>();

    for (const todo of activeTodos) {
      const completedDateKey = todo.completedAt?.slice(0, 10);
      const dateKey = isDateKey(todo.dueAt)
        ? todo.dueAt
        : isDateKey(completedDateKey)
          ? completedDateKey
          : t('todos.calendarNoDate');
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), todo]);
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [activeTodos, t]);

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
    createTodo,
    createTodoFromDraft,
    deletedTodos,
    dueDate,
    dateFormat,
    editingTitle,
    editingTodoId,
    errorMessage,
    getTodoDateLabel,
    isLoading: status === 'loading',
    permanentlyDeleteTodo,
    priority,
    reopenTodo,
    restoreTodo,
    saveEditing,
    setDueDate,
    setEditingTitle,
    setPriority,
    setShowDeleted,
    setSort,
    setTitle,
    setViewMode,
    showDeleted,
    softDeleteTodo,
    sort,
    sortedTodos,
    startEditing,
    cancelEditing,
    title,
    updateTodoFromDraft,
    viewMode,
  };
}

export type { TodoSort, TodoViewMode };
