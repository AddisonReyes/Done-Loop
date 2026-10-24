import { useCallback, useMemo, useRef, useState } from 'react';

import type { HabitDayActivity, HabitDayIntensity } from '@/features/habits/components/habit-month-history';
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
import { createAppEventSource, emitAppEvent } from '@/shared/events/app-events';
import { useDomainRefresh } from '@/shared/hooks/use-domain-refresh';
import { invalidateHabitReads, readHabits, readHabitCompletions } from '../services/habit-reads';
import { normalizeHabitCreateDraft, normalizeHabitUpdateDraft } from '../services/habit-draft';
import { createHabitCalendarSelector } from '../services/habit-recurrence';
import { sortHabitsByRecurrenceDisplayOrder } from '../services/habit-sort';

export type HabitFilter = 'all' | 'pendingToday' | 'completedToday';
export type HabitDeleteMode = 'fromDate' | 'allHistory';

type AsyncStatus = 'idle' | 'loading' | 'error';
type LoadOptions = {
  silent?: boolean;
  fresh?: boolean;
};

export function getHabitDayIntensity(completedCount: number, scheduledCount: number): HabitDayIntensity {
  if (completedCount <= 0 || scheduledCount <= 0) {
    return 0;
  }

  if (completedCount >= scheduledCount) {
    return 4;
  }

  const completionRatio = completedCount / scheduledCount;

  if (completionRatio < 0.25) {
    return 1;
  }

  if (completionRatio < 0.5) {
    return 2;
  }

  return 3;
}

export function useHabits({ isFocused = true }: { isFocused?: boolean } = {}) {
  const { language, locale, t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<HabitCompletion[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<HabitFilter>('all');
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [monthCompletions, setMonthCompletions] = useState<HabitCompletion[]>([]);
  const hasLoadedHabitsRef = useRef(false);
  const [eventSource] = useState(() => createAppEventSource('habits'));
  const loadRevision = useRef(0);
  const historyRevision = useRef(0);
  const selectDueHabits = useMemo(() => createHabitCalendarSelector(habits), [habits]);

  const todayKey = useCurrentDateKey();
  const monthCompletedIds = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const completion of monthCompletions) {
      if (!completion.completed) continue;
      const ids = result.get(completion.date) ?? new Set<string>();
      ids.add(completion.habitId);
      result.set(completion.date, ids);
    }
    return result;
  }, [monthCompletions]);
  const monthDateKeys = useMemo(() => getMonthDateKeys(displayedMonth), [displayedMonth]);
  const monthLabel = useMemo(() => formatMonthLabel(displayedMonth, locale), [displayedMonth, locale]);

  const habitsDueToday = useMemo(() => selectDueHabits(todayKey), [selectDueHabits, todayKey]);
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

  const getCompletedHabitIdsForDate = useCallback(
    (dateKey: string) => {
      const dueHabitIds = new Set(selectDueHabits(dateKey).map((habit) => habit.id));
      const completions = dateKey === todayKey ? todayCompletions : monthCompletions;

      return new Set(
        completions
          .filter(
            (completion) =>
              completion.date === dateKey && completion.completed && dueHabitIds.has(completion.habitId)
          )
          .map((completion) => completion.habitId)
      );
    },
    [selectDueHabits, monthCompletions, todayCompletions, todayKey]
  );

  const loadHabits = useCallback(async (options: LoadOptions = {}) => {
    if (options.fresh) invalidateHabitReads();
    const revision = ++loadRevision.current;
    const shouldShowLoading = !options.silent && !hasLoadedHabitsRef.current;

    try {
      if (shouldShowLoading) {
        setStatus('loading');
      }
      const [activeHabits, completions] = await Promise.all([
        readHabits(),
        readHabitCompletions(todayKey, todayKey),
      ]);
      if (revision !== loadRevision.current) return;

      setHabits(activeHabits);
      setTodayCompletions(completions);
      hasLoadedHabitsRef.current = true;
      setErrorMessage(null);
      setStatus('idle');
    } catch (error) {
      if (revision !== loadRevision.current) return;
      if (!options.silent || !hasLoadedHabitsRef.current) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.loadError'));
        setStatus('error');
      }
    }
  }, [t, todayKey]);

  const loadMonthHistory = useCallback(async () => {
    const revision = ++historyRevision.current;
    if (monthDateKeys.length === 0) {
      setMonthCompletions([]);
      return;
    }

    const completions = await readHabitCompletions(
      monthDateKeys[0],
      monthDateKeys[monthDateKeys.length - 1]
    );
    if (revision === historyRevision.current) setMonthCompletions(completions);
  }, [monthDateKeys]);

  const refreshVisibleData = useCallback(async () => {
    await Promise.all([loadHabits({ silent: true }), loadMonthHistory()]);
  }, [loadHabits, loadMonthHistory]);
  useDomainRefresh('habitsChanged', eventSource, isFocused, refreshVisibleData, `${todayKey}:${monthDateKeys[0]}`);

  const visibleHabits = useMemo(() => {
    if (filter === 'completedToday') {
      return sortHabitsByRecurrenceDisplayOrder(
        habitsDueToday.filter((habit) => completedHabitIds.has(habit.id))
      );
    }

    if (filter === 'pendingToday') {
      return sortHabitsByRecurrenceDisplayOrder(
        habitsDueToday.filter((habit) => !completedHabitIds.has(habit.id))
      );
    }

    return sortHabitsByRecurrenceDisplayOrder([
      ...habits.filter((habit) => habit.isActive && !habit.deletedAt),
      ...habits.filter((habit) => !habit.isActive && !habit.deletedAt),
    ]);
  }, [completedHabitIds, filter, habits, habitsDueToday]);

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
                habit: createdHabit,
                language,
              })
            : undefined;

        if (notificationId) {
          await HabitRepository.update(createdHabit.id, { notificationId });
        }
        await loadHabits({ silent: true, fresh: true });
        await loadMonthHistory();
        emitAppEvent('habitsChanged', { source: eventSource });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [eventSource, language, loadHabits, loadMonthHistory, t]
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
        const nextRemindersEnabled =
          'remindersEnabled' in input ? draft.remindersEnabled ?? false : existing?.remindersEnabled ?? false;
        const settings = await SettingsRepository.get();

        if (existing) {
          await NotificationService.cancelHabitRemindersAsync(existing.id, existing.notificationId);
        }
        const updatedHabit = await HabitRepository.update(habitId, {
          ...draft,
          reminderTime: nextReminderTime,
          remindersEnabled: nextRemindersEnabled,
          notificationId: undefined,
        });
        const notificationId =
          updatedHabit && updatedHabit.isActive && settings.notificationsEnabled && nextRemindersEnabled
            ? await NotificationService.scheduleHabitReminderAsync({
                habit: updatedHabit,
                language,
              })
            : undefined;

        if (updatedHabit) {
          await HabitRepository.update(habitId, { notificationId });
        }
        await loadHabits({ silent: true, fresh: true });
        await loadMonthHistory();
        emitAppEvent('habitsChanged', { source: eventSource });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [eventSource, habits, language, loadHabits, loadMonthHistory, t]
  );

  const deleteHabit = useCallback(
    async (habitId: string, options: { mode?: HabitDeleteMode; effectiveDateKey?: string } = {}) => {
      try {
        setErrorMessage(null);
        const existing = habits.find((habit) => habit.id === habitId) ?? (await HabitRepository.findById(habitId));
        if (existing) {
          await NotificationService.cancelHabitRemindersAsync(existing.id, existing.notificationId);
        }
        if (options.mode === 'allHistory') {
          await HabitCompletionRepository.deleteByHabitId(habitId);
          await HabitRepository.deleteById(habitId, options.effectiveDateKey ?? todayKey);
        } else {
          const effectiveDateKey = options.effectiveDateKey ?? todayKey;
          await HabitCompletionRepository.deleteByHabitIdFromDate(habitId, effectiveDateKey);
          await HabitRepository.deleteById(habitId, effectiveDateKey);
        }
        await loadHabits({ silent: true, fresh: true });
        await loadMonthHistory();
        emitAppEvent('habitsChanged', { source: eventSource });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [eventSource, habits, loadHabits, loadMonthHistory, t, todayKey]
  );

  const toggleTodayCompletion = useCallback(
    async (habitId: string) => {
      try {
        setErrorMessage(null);
        const isCompleted = completedHabitIds.has(habitId);
        const habit = habits.find((currentHabit) => currentHabit.id === habitId) ?? (await HabitRepository.findById(habitId));
        if (habit) {
          await NotificationService.cancelHabitRemindersAsync(habit.id, habit.notificationId);
        }
        await HabitCompletionRepository.upsert({
          habitId,
          date: todayKey,
          completed: !isCompleted,
        });
        const settings = await SettingsRepository.get();
        const notificationId =
            habit && habit.isActive && settings.notificationsEnabled && habit.remindersEnabled
            ? await NotificationService.scheduleHabitReminderAsync({
                habit,
                language,
                skipDateKeys: !isCompleted ? [todayKey] : [],
              })
            : undefined;

        if (habit) {
          await HabitRepository.update(habitId, { notificationId });
        }
        await Promise.all([loadHabits({ silent: true, fresh: true }), loadMonthHistory()]);
        emitAppEvent('habitsChanged', { source: eventSource });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [eventSource, completedHabitIds, habits, language, loadHabits, loadMonthHistory, t, todayKey]
  );

  const toggleCompletionForDate = useCallback(
    async (habitId: string, dateKey: string) => {
      if (dateKey === todayKey) {
        return toggleTodayCompletion(habitId);
      }

      try {
        setErrorMessage(null);
        const completedHabitIdsForDate = getCompletedHabitIdsForDate(dateKey);
        const isCompleted = completedHabitIdsForDate.has(habitId);
        const habit = habits.find((currentHabit) => currentHabit.id === habitId) ?? (await HabitRepository.findById(habitId));

        await HabitCompletionRepository.upsert({
          habitId,
          date: dateKey,
          completed: !isCompleted,
        });

        if (habit && dateKey > todayKey) {
          await NotificationService.cancelHabitRemindersAsync(habit.id, habit.notificationId);
          const settings = await SettingsRepository.get();
          const notificationId =
            habit.isActive && settings.notificationsEnabled && habit.remindersEnabled
              ? await NotificationService.scheduleHabitReminderAsync({
                  habit,
                  language,
                  skipDateKeys: !isCompleted ? [dateKey] : [],
                })
              : undefined;
          await HabitRepository.update(habitId, { notificationId });
        }

        await Promise.all([loadHabits({ silent: true, fresh: true }), loadMonthHistory()]);
        emitAppEvent('habitsChanged', { source: eventSource });
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('habits.saveError'));
        return false;
      }
    },
    [
      eventSource,
      getCompletedHabitIdsForDate,
      habits,
      language,
      loadHabits,
      loadMonthHistory,
      t,
      todayKey,
      toggleTodayCompletion,
    ]
  );

  const monthHistoryDays = useMemo(() => {
    const habitIdsByDate = new Map<string, Set<string>>();
    const completionsByDate = new Map<string, number>();

    for (const dateKey of monthDateKeys) {
      habitIdsByDate.set(
        dateKey,
        new Set(selectDueHabits(dateKey).map((habit) => habit.id))
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
      const scheduledCount = habitIdsByDate.get(dateKey)?.size ?? 0;
      const intensity = getHabitDayIntensity(completedCount, scheduledCount);
      let activity: HabitDayActivity = 'none';

      if (intensity > 0) {
        activity = intensity === 4 ? 'complete' : 'partial';
      }

      return {
        dateKey,
        dayNumber: Number(dateKey.slice(8, 10)),
        activity,
        completedCount,
        scheduledCount,
        intensity,
      };
    });
  }, [selectDueHabits, monthCompletions, monthDateKeys]);

  const monthlyHabitDateKeys = useMemo(() => {
    const dateKeys = new Set<string>();

    for (const dateKey of monthDateKeys) {
      const dueMarkedHabits = selectDueHabits(dateKey).filter((habit) => habit.recurrenceType === 'monthly' || habit.recurrenceType === 'custom');
      const completedMarkedHabitIds = monthCompletedIds.get(dateKey);
      const hasPendingMarkedHabit = dueMarkedHabits.some(
        (habit) => !completedMarkedHabitIds?.has(habit.id)
      );

      if (hasPendingMarkedHabit) {
        dateKeys.add(dateKey);
      }
    }

    return dateKeys;
  }, [selectDueHabits, monthCompletedIds, monthDateKeys]);

  const goToPreviousMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDisplayedMonth((current) => addMonths(current, 1));
  }, []);

  const getHabitsForDate = useCallback(
    (dateKey: string) => {
      return sortHabitsByRecurrenceDisplayOrder(selectDueHabits(dateKey));
    },
    [selectDueHabits]
  );

  return {
    completedHabitIds,
    createHabitFromDraft,
    deleteHabit,
    errorMessage,
    filter,
    getCompletedHabitIdsForDate,
    getHabitsForDate,
    habits,
    isLoading: status === 'loading',
    monthDateKeys,
    monthlyHabitDateKeys,
    monthHistoryDays,
    monthLabel,
    pendingCount: habitsDueToday.length - completedHabitIds.size,
    setFilter,
    todayKey,
    toggleCompletionForDate,
    toggleTodayCompletion,
    totalCompletedToday: completedHabitIds.size,
    visibleHabits,
    updateHabitFromDraft,
    goToPreviousMonth,
    goToNextMonth,
  };
}
