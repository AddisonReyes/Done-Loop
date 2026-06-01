import { useCallback, useEffect, useMemo, useState } from 'react';

import type { HabitDayActivity } from '@/features/habits/components/habit-month-history';
import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { CreateHabitInput, Habit, HabitCompletion, UpdateHabitInput } from '@/features/habits/types';
import {
  addMonths,
  formatMonthLabel,
  getMonthDateKeys,
  startOfMonth,
} from '@/shared/utils/date';
import { useTranslation } from '@/i18n';
import { useCurrentDateKey } from '@/shared/hooks/use-current-date-key';
import { normalizeHabitCreateDraft, normalizeHabitUpdateDraft } from '../services/habit-draft';
import { getHabitsDueOnDate } from '../services/habit-recurrence';

export type HabitFilter = 'all' | 'pendingToday' | 'completedToday';

type AsyncStatus = 'idle' | 'loading' | 'error';

export function useHabits() {
  const { language, locale, t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<HabitCompletion[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<HabitFilter>('all');
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [monthCompletions, setMonthCompletions] = useState<HabitCompletion[]>([]);

  const todayKey = useCurrentDateKey();
  const monthDateKeys = useMemo(() => getMonthDateKeys(displayedMonth), [displayedMonth]);
  const monthLabel = useMemo(() => formatMonthLabel(displayedMonth, locale), [displayedMonth, locale]);

  const habitsDueToday = useMemo(() => getHabitsDueOnDate(habits, todayKey), [habits, todayKey]);
  const dueHabitIdsToday = useMemo(
    () => new Set(habitsDueToday.map((habit) => habit.id)),
    [habitsDueToday]
  );

  const completedHabitIds = useMemo(() => {
    return new Set(
      todayCompletions
        .filter((completion) => completion.completed && dueHabitIdsToday.has(completion.habitId))
        .map((completion) => completion.habitId)
    );
  }, [dueHabitIdsToday, todayCompletions]);

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
      return habitsDueToday.filter((habit) => completedHabitIds.has(habit.id));
    }

    if (filter === 'pendingToday') {
      return habitsDueToday.filter((habit) => !completedHabitIds.has(habit.id));
    }

    return habitsDueToday;
  }, [completedHabitIds, filter, habitsDueToday]);

  const createHabitFromDraft = useCallback(
    async (input: CreateHabitInput) => {
      try {
        setErrorMessage(null);
        const draft = normalizeHabitCreateDraft(input);
        if (!draft) {
          return false;
        }

        const createdHabit = await HabitRepository.create(draft);
        const settings = await SettingsRepository.get();
        const notificationId =
          settings.notificationsEnabled && draft.remindersEnabled
            ? await NotificationService.scheduleHabitReminderAsync({
                habitId: createdHabit.id,
                habitName: draft.name,
                reminderTime: draft.reminderTime,
                language,
              })
            : undefined;

        if (notificationId) {
          await HabitRepository.update(createdHabit.id, { notificationId });
        }
        await loadHabits();
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [language, loadHabits, t]
  );

  const updateHabitFromDraft = useCallback(
    async (habitId: string, input: UpdateHabitInput) => {
      try {
        setErrorMessage(null);
        const draft = normalizeHabitUpdateDraft(input);
        if (!draft) {
          return false;
        }

        const existing = habits.find((habit) => habit.id === habitId) ?? (await HabitRepository.findById(habitId));
        const nextReminderTime = 'reminderTime' in input ? draft.reminderTime : existing?.reminderTime;
        const nextName = draft.name ?? existing?.name ?? '';
        const nextRemindersEnabled =
          'remindersEnabled' in input ? draft.remindersEnabled ?? false : existing?.remindersEnabled ?? false;
        const settings = await SettingsRepository.get();

        await NotificationService.cancelAsync(existing?.notificationId);
        const notificationId =
          settings.notificationsEnabled && nextRemindersEnabled
            ? await NotificationService.scheduleHabitReminderAsync({
                habitId,
                habitName: nextName,
                reminderTime: nextReminderTime,
                language,
              })
            : undefined;

        await HabitRepository.update(habitId, { ...draft, notificationId });
        await loadHabits();
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [habits, language, loadHabits, t]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        setErrorMessage(null);
        await HabitCompletionRepository.deleteByHabitId(habitId);
        await NotificationService.cancelAsync(habits.find((habit) => habit.id === habitId)?.notificationId);
        await HabitRepository.deleteById(habitId);
        await loadHabits();
        await loadMonthHistory();
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [habits, loadHabits, loadMonthHistory, t]
  );

  const toggleTodayCompletion = useCallback(
    async (habitId: string) => {
      try {
        setErrorMessage(null);
        const isCompleted = completedHabitIds.has(habitId);
        await HabitCompletionRepository.upsert({
          habitId,
          date: todayKey,
          completed: !isCompleted,
        });
        await Promise.all([loadHabits(), loadMonthHistory()]);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [completedHabitIds, loadHabits, loadMonthHistory, t, todayKey]
  );

  const monthHistoryDays = useMemo(() => {
    const habitIdsByDate = new Map<string, Set<string>>();
    const completionsByDate = new Map<string, number>();

    for (const dateKey of monthDateKeys) {
      habitIdsByDate.set(
        dateKey,
        new Set(getHabitsDueOnDate(habits, dateKey).map((habit) => habit.id))
      );
    }

    for (const completion of monthCompletions) {
      const habitIdsDueOnDate = habitIdsByDate.get(completion.date);
      if (!completion.completed || !habitIdsDueOnDate?.has(completion.habitId)) {
        continue;
      }

      completionsByDate.set(completion.date, (completionsByDate.get(completion.date) ?? 0) + 1);
    }

    return monthDateKeys.map((dateKey) => {
      const completedCount = completionsByDate.get(dateKey) ?? 0;
      const activeHabitCount = habitIdsByDate.get(dateKey)?.size ?? 0;
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
  }, [habits, monthCompletions, monthDateKeys]);

  const goToPreviousMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, 1));
  }, []);

  return {
    completedHabitIds,
    createHabitFromDraft,
    deleteHabit,
    errorMessage,
    filter,
    habits,
    isLoading: status === 'loading',
    monthDateKeys,
    monthHistoryDays,
    monthLabel,
    pendingCount: habitsDueToday.length - completedHabitIds.size,
    setFilter,
    todayKey,
    toggleTodayCompletion,
    totalCompletedToday: completedHabitIds.size,
    visibleHabits,
    updateHabitFromDraft,
    goToPreviousMonth,
    goToNextMonth,
  };
}
