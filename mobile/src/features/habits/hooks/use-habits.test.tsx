import { act, renderHook, waitFor } from '@testing-library/react-native';

import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import type { Habit, HabitCompletion } from '@/features/habits/types';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { createTestTranslator as mockCreateTestTranslator } from '@/test/test-utils';
import { emitAppEvent } from '@/shared/events/app-events';

import { getHabitDayIntensity, useHabits } from './use-habits';

jest.mock('@/features/habits/repositories', () => ({
  HabitCompletionRepository: {
    listByDateRange: jest.fn(),
    upsert: jest.fn(),
  },
  HabitRepository: {
    create: jest.fn(),
    deleteById: jest.fn(),
    findById: jest.fn(),
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: {
    cancelHabitRemindersAsync: jest.fn(),
    scheduleHabitReminderAsync: jest.fn(),
  },
}));

jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: {
    get: jest.fn(),
  },
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'en',
    locale: 'en',
    t: mockCreateTestTranslator('en'),
  }),
}));

jest.mock('@/shared/hooks/use-current-date-key', () => ({
  useCurrentDateKey: () => '2026-06-03',
}));

const dailyHabit: Habit = {
  id: 'habit_1',
  name: 'Read',
  recurrenceType: 'daily',
  reminderTime: '08:15',
  remindersEnabled: true,
  isActive: true,
  startDate: '2026-06-01',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function createDailyHabit(id: string): Habit {
  return {
    ...dailyHabit,
    id,
    name: `Habit ${id}`,
  };
}

function createCompletion(habitId: string, date: string): HabitCompletion {
  return {
    id: `completion_${habitId}_${date}`,
    habitId,
    date,
    completed: true,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe('useHabits', () => {
  let activeHabits: Habit[];
  let completions: HabitCompletion[];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    activeHabits = [];
    completions = [];
    jest.mocked(HabitRepository.listActive).mockImplementation(async () => activeHabits);
    jest.mocked(HabitRepository.findById).mockImplementation(async (id) => activeHabits.find((habit) => habit.id === id) ?? null);
    jest.mocked(HabitRepository.create).mockImplementation(async (input) => {
      const habit: Habit = {
        id: 'habit_created',
        name: input.name,
        description: input.description,
        recurrenceType: input.recurrenceType,
        customIntervalDays: input.customIntervalDays,
        weeklyDays: input.weeklyDays,
        monthlyDays: input.monthlyDays,
        reminderTime: input.reminderTime,
        remindersEnabled: input.remindersEnabled ?? false,
        isActive: input.isActive ?? true,
        startDate: input.startDate ?? '2026-06-03',
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
      };
      activeHabits = [habit, ...activeHabits];
      return habit;
    });
    jest.mocked(HabitRepository.update).mockImplementation(async (id, input) => {
      const existing = activeHabits.find((habit) => habit.id === id);
      if (!existing) {
        return null;
      }
      const next = { ...existing, ...input, updatedAt: '2026-06-03T12:00:00.000Z' };
      activeHabits = activeHabits.map((habit) => (habit.id === id ? next : habit));
      return next;
    });
    jest.mocked(HabitCompletionRepository.listByDateRange).mockImplementation(
      async (startDate, endDate) =>
        completions.filter((completion) => completion.date >= startDate && completion.date <= endDate)
    );
    jest.mocked(HabitCompletionRepository.upsert).mockImplementation(async (input) => {
      const completion: HabitCompletion = {
        id: 'completion_1',
        habitId: input.habitId,
        date: input.date,
        completed: input.completed,
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-03T00:00:00.000Z',
      };
      completions = [completion];
      return completion;
    });
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
    jest.mocked(NotificationService.cancelHabitRemindersAsync).mockResolvedValue(undefined);
    jest.mocked(NotificationService.scheduleHabitReminderAsync).mockResolvedValue('habit_notification');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function renderUseHabits() {
    const rendered = renderHook(() => useHabits());

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));

    return rendered;
  }

  it('loads active habits and computes pending count for today', async () => {
    activeHabits = [dailyHabit];

    const { result } = await renderUseHabits();

    expect(result.current.habits).toEqual([dailyHabit]);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.totalCompletedToday).toBe(0);
  });

  it('creates a habit and stores the scheduled reminder id', async () => {
    const { result } = await renderUseHabits();

    await act(async () => {
      await expect(
        result.current.createHabitFromDraft({
          name: 'Read',
          recurrenceType: 'daily',
          reminderTime: '08:15',
          remindersEnabled: true,
        })
      ).resolves.toBe(true);
    });

    expect(HabitRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Read' }));
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith({
      habit: expect.objectContaining({ id: 'habit_created' }),
      language: 'en',
    });
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_created', { notificationId: 'habit_notification' });
    expect(HabitRepository.listActive).toHaveBeenCalledTimes(2);
  });

  it('toggles today completion and skips today when rescheduling reminders', async () => {
    activeHabits = [dailyHabit];
    const { result } = await renderUseHabits();

    await act(async () => {
      await expect(result.current.toggleTodayCompletion('habit_1')).resolves.toBe(true);
    });

    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledWith('habit_1', undefined);
    expect(HabitCompletionRepository.upsert).toHaveBeenCalledWith({
      habitId: 'habit_1',
      date: '2026-06-03',
      completed: true,
    });
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith({
      habit: dailyHabit,
      language: 'en',
      skipDateKeys: ['2026-06-03'],
    });
  });

  it('filters visible habits by completed and pending state for today', async () => {
    const secondHabit = createDailyHabit('habit_2');
    activeHabits = [dailyHabit, secondHabit];
    completions = [createCompletion('habit_1', '2026-06-03')];
    const { result } = await renderUseHabits();

    act(() => {
      result.current.setFilter('completedToday');
    });

    expect(result.current.visibleHabits.map((habit) => habit.id)).toEqual(['habit_1']);

    act(() => {
      result.current.setFilter('pendingToday');
    });

    expect(result.current.visibleHabits.map((habit) => habit.id)).toEqual(['habit_2']);
  });

  it('updates habits by cancelling stale reminders and storing the new reminder id', async () => {
    activeHabits = [{ ...dailyHabit, notificationId: 'old_notification' }];
    const { result } = await renderUseHabits();

    await act(async () => {
      await expect(
        result.current.updateHabitFromDraft('habit_1', {
          name: 'Read more',
          recurrenceType: 'daily',
          reminderTime: '09:00',
          remindersEnabled: true,
        })
      ).resolves.toBe(true);
    });

    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledWith('habit_1', 'old_notification');
    expect(HabitRepository.update).toHaveBeenCalledWith(
      'habit_1',
      expect.objectContaining({ name: 'Read more', notificationId: undefined, reminderTime: '09:00' })
    );
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith({
      habit: expect.objectContaining({ id: 'habit_1', name: 'Read more' }),
      language: 'en',
    });
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_1', { notificationId: 'habit_notification' });
  });

  it('deletes habits after cancelling scheduled reminders', async () => {
    activeHabits = [{ ...dailyHabit, notificationId: 'old_notification' }];
    const { result } = await renderUseHabits();

    await act(async () => {
      await expect(result.current.deleteHabit('habit_1')).resolves.toBe(true);
    });

    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledWith('habit_1', 'old_notification');
    expect(HabitRepository.deleteById).toHaveBeenCalledWith('habit_1');
  });

  it('surfaces initial load errors without crashing consumers', async () => {
    jest.mocked(HabitRepository.listActive).mockRejectedValueOnce(new Error('database offline'));

    const rendered = renderHook(() => useHabits());
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => expect(rendered.result.current.errorMessage).toBe('database offline'));
    expect(rendered.result.current.isLoading).toBe(false);
  });

  it('reloads silently when another hook source emits a habits change', async () => {
    activeHabits = [];
    const { result } = await renderUseHabits();
    activeHabits = [dailyHabit];

    await act(async () => {
      emitAppEvent('habitsChanged', { source: 'external_source' });
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.habits).toEqual([dailyHabit]));
  });

  it.each([
    { completedCount: 0, expectedActivity: 'none', expectedIntensity: 0 },
    { completedCount: 2, expectedActivity: 'partial', expectedIntensity: 1 },
    { completedCount: 6, expectedActivity: 'partial', expectedIntensity: 3 },
    { completedCount: 9, expectedActivity: 'complete', expectedIntensity: 4 },
  ] as const)(
    'computes month history intensity for $completedCount of 9 completed habits',
    async ({ completedCount, expectedActivity, expectedIntensity }) => {
      const date = '2026-06-02';
      activeHabits = Array.from({ length: 9 }, (_, index) => createDailyHabit(`habit_${index + 1}`));
      completions = activeHabits
        .slice(0, completedCount)
        .map((habit) => createCompletion(habit.id, date));

      const { result } = await renderUseHabits();

      const historyDay = result.current.monthHistoryDays.find((day) => day.dateKey === date);

      expect(historyDay).toEqual(
        expect.objectContaining({
          activity: expectedActivity,
          completedCount,
          scheduledCount: 9,
          intensity: expectedIntensity,
        })
      );
    }
  );

  it('maps completion ratios to GitHub-style intensity buckets', () => {
    expect(getHabitDayIntensity(0, 9)).toBe(0);
    expect(getHabitDayIntensity(2, 9)).toBe(1);
    expect(getHabitDayIntensity(3, 9)).toBe(2);
    expect(getHabitDayIntensity(6, 9)).toBe(3);
    expect(getHabitDayIntensity(9, 9)).toBe(4);
  });
});
