import { useCallback, useEffect, useMemo, useState } from 'react';

import type { HabitDayActivity } from '@/features/habits/components/habit-month-history';
import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import type { Habit, HabitCompletion } from '@/features/habits/types';
import {
  addMonths,
  formatMonthLabel,
  getMonthDateKeys,
  startOfMonth,
} from '@/shared/utils/date';
import { useTranslation } from '@/i18n';

type HabitFilter = 'all' | 'pendingToday' | 'completedToday';

type AsyncStatus = 'idle' | 'loading' | 'error';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useHabitsMvp() {
  const { locale, t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<HabitCompletion[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');
  const [filter, setFilter] = useState<HabitFilter>('all');
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [monthCompletions, setMonthCompletions] = useState<HabitCompletion[]>([]);

  const todayKey = useMemo(() => getTodayKey(), []);
  const monthDateKeys = useMemo(() => getMonthDateKeys(displayedMonth), [displayedMonth]);
  const monthLabel = useMemo(() => formatMonthLabel(displayedMonth, locale), [displayedMonth, locale]);

  const completedHabitIds = useMemo(() => {
    return new Set(
      todayCompletions
        .filter((completion) => completion.completed)
        .map((completion) => completion.habitId)
    );
  }, [todayCompletions]);

  const loadHabits = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      const [activeHabits, completions] = await Promise.all([
        HabitRepository.listActive(),
        HabitCompletionRepository.listByDateRange(todayKey, todayKey),
      ]);

      setHabits(activeHabits);
      setTodayCompletions(completions);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('habits.loadError'));
      setStatus('error');
    }
  }, [t, todayKey]);

  const loadMonthHistory = useCallback(async () => {
    if (monthDateKeys.length === 0) {
      setMonthCompletions([]);
      return;
    }

    const completions = await HabitCompletionRepository.listByDateRange(
      monthDateKeys[0],
      monthDateKeys[monthDateKeys.length - 1]
    );
    setMonthCompletions(completions);
  }, [monthDateKeys]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadHabits();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadHabits]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMonthHistory();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadMonthHistory]);

  const visibleHabits = useMemo(() => {
    if (filter === 'completedToday') {
      return habits.filter((habit) => completedHabitIds.has(habit.id));
    }

    if (filter === 'pendingToday') {
      return habits.filter((habit) => !completedHabitIds.has(habit.id));
    }

    return habits;
  }, [completedHabitIds, filter, habits]);

  const createHabit = useCallback(async () => {
    const name = newHabitName.trim();
    if (!name) {
      return;
    }

    await HabitRepository.create({
      name,
      recurrenceType: 'daily',
      remindersEnabled: false,
      isActive: true,
    });
    setNewHabitName('');
    await loadHabits();
  }, [loadHabits, newHabitName]);

  const startEditingHabit = useCallback((habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
  }, []);

  const cancelEditingHabit = useCallback(() => {
    setEditingHabitId(null);
    setEditingHabitName('');
  }, []);

  const saveEditingHabit = useCallback(async () => {
    if (!editingHabitId) {
      return;
    }

    const name = editingHabitName.trim();
    if (!name) {
      return;
    }

    await HabitRepository.update(editingHabitId, { name });
    cancelEditingHabit();
    await loadHabits();
  }, [cancelEditingHabit, editingHabitId, editingHabitName, loadHabits]);

  const deactivateHabit = useCallback(
    async (habitId: string) => {
      await HabitRepository.update(habitId, {
        isActive: false,
        deletedAt: new Date().toISOString(),
      });
      await loadHabits();
    },
    [loadHabits]
  );

  const toggleTodayCompletion = useCallback(
    async (habitId: string) => {
      const isCompleted = completedHabitIds.has(habitId);
      await HabitCompletionRepository.upsert({
        habitId,
        date: todayKey,
        completed: !isCompleted,
      });
      await Promise.all([loadHabits(), loadMonthHistory()]);
    },
    [completedHabitIds, loadHabits, loadMonthHistory, todayKey]
  );

  const monthHistoryDays = useMemo(() => {
    const activeHabitCount = habits.length;
    const completionsByDate = new Map<string, number>();

    for (const completion of monthCompletions) {
      if (!completion.completed) {
        continue;
      }

      completionsByDate.set(completion.date, (completionsByDate.get(completion.date) ?? 0) + 1);
    }

    return monthDateKeys.map((dateKey) => {
      const completedCount = completionsByDate.get(dateKey) ?? 0;
      let activity: HabitDayActivity = 'none';

      if (completedCount > 0 && activeHabitCount > 0) {
        activity = completedCount >= activeHabitCount ? 'complete' : 'partial';
      }

      return {
        dateKey,
        dayNumber: Number(dateKey.slice(8, 10)),
        activity,
      };
    });
  }, [habits.length, monthCompletions, monthDateKeys]);

  const goToPreviousMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, 1));
  }, []);

  return {
    completedHabitIds,
    createHabit,
    deactivateHabit,
    editingHabitId,
    editingHabitName,
    errorMessage,
    filter,
    habits,
    isLoading: status === 'loading',
    monthHistoryDays,
    monthLabel,
    newHabitName,
    pendingCount: habits.length - completedHabitIds.size,
    saveEditingHabit,
    setEditingHabitName,
    setFilter,
    setNewHabitName,
    startEditingHabit,
    cancelEditingHabit,
    todayKey,
    toggleTodayCompletion,
    totalCompletedToday: completedHabitIds.size,
    visibleHabits,
    goToPreviousMonth,
    goToNextMonth,
  };
}

export type { HabitFilter };
