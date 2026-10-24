import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import {
  NotificationService,
  handleNotificationActionAsync,
  resetNotificationModuleLoaderForTests,
  setNotificationModuleLoaderForTests,
} from './notification-service';
import type { Habit } from '@/features/habits/types';
import type { UserSettings } from '@/features/settings/types';

type NotificationsModule = typeof import('expo-notifications');
type TestMock = Mock<(...args: unknown[]) => Promise<unknown>>;
type TestNotificationsModule = NotificationsModule & {
  clearLastNotificationResponseAsync: TestMock;
  dismissAllNotificationsAsync: TestMock;
  getAllScheduledNotificationsAsync: TestMock;
  getPresentedNotificationsAsync: TestMock;
  getLastNotificationResponseAsync: TestMock;
  setNotificationChannelAsync: TestMock;
};

jest.mock('expo', () => ({ isRunningInExpoGo: jest.fn(() => false) }));
jest.mock('../tasks/notification-action-task', () => ({ ensureNotificationActionTaskAsync: jest.fn(async () => true) }));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));

jest.mock('@/features/habits/repositories', () => ({
  HabitCompletionRepository: {
    findByHabitAndDate: jest.fn(),
    listCompletedDateKeysByHabitId: jest.fn(),
    upsert: jest.fn(),
  },
  HabitRepository: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/settings/repositories/settings-repository', () => ({
  SettingsRepository: {
    get: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

const habit: Habit = {
  id: 'habit_1',
  name: 'Read',
  recurrenceType: 'daily',
  reminderTime: '08:15',
  remindersEnabled: true,
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const enabledSettings: UserSettings = {
  animationsEnabled: true,
  accentColor: 'purple',
  appBackground: 'none',
  dateFormat: 'dmy',
  language: 'en',
  notificationsEnabled: true,
  privacyPolicyUrl: 'https://done-loop.com/privacy',
  termsUrl: 'https://done-loop.pages.dev/terms',
  lastActiveRoute: '/habits',
  theme: 'system',
};

async function flushAsync(): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    await Promise.resolve();
  }
}

function createNotificationsModule(): TestNotificationsModule {
  return {
    SchedulableTriggerInputTypes: {
      DATE: 'date',
      TIME_INTERVAL: 'timeInterval',
    },
    AndroidImportance: {
      DEFAULT: 'default',
    },
    DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    clearLastNotificationResponseAsync: jest.fn(),
    dismissAllNotificationsAsync: jest.fn(),
    dismissNotificationAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    getPresentedNotificationsAsync: jest.fn(),
    getLastNotificationResponseAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    setNotificationCategoryAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
  } as unknown as TestNotificationsModule;
}

describe('NotificationService', () => {
  let notifications: TestNotificationsModule;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isRunningInExpoGo).mockReturnValue(false);
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { findByHabitAndDate: TestMock; listCompletedDateKeysByHabitId: TestMock };
      HabitRepository: { findById: TestMock; update: TestMock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    HabitCompletionRepository.findByHabitAndDate.mockResolvedValue(null);
    HabitCompletionRepository.listCompletedDateKeysByHabitId.mockResolvedValue(new Set());
    HabitRepository.findById.mockResolvedValue(habit);
    HabitRepository.update.mockResolvedValue(habit);
    SettingsRepository.get.mockResolvedValue(enabledSettings);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-02T07:00:00.000Z'));
    notifications = createNotificationsModule();
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    notifications.getPresentedNotificationsAsync.mockResolvedValue([]);
    notifications.getLastNotificationResponseAsync.mockResolvedValue(null);
    setNotificationModuleLoaderForTests(async () => notifications);
  });

  afterEach(() => {
    jest.useRealTimers();
    resetNotificationModuleLoaderForTests();
  });

  it('does not schedule todo reminders without a due date', async () => {
    await expect(NotificationService.scheduleTodoReminderAsync({ title: 'Pay rent' })).resolves.toBeUndefined();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not crash or schedule when notifications are unavailable', async () => {
    setNotificationModuleLoaderForTests(async () => null);

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habit,
      })
    ).resolves.toBeUndefined();
    await expect(NotificationService.requestPermissionsAsync()).resolves.toBe(false);
    await expect(NotificationService.cancelAllAsync()).resolves.toBeUndefined();
  });

  it('does not import expo-notifications in Android Expo Go', async () => {
    const loader = jest.fn(async () => notifications);
    const originalPlatformOS = Platform.OS;
    jest.mocked(isRunningInExpoGo).mockReturnValue(true);
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    setNotificationModuleLoaderForTests(loader);

    try {
      await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(false);
      await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(false);
      await expect(NotificationService.requestPermissionsAsync()).resolves.toBe(false);
      await expect(NotificationService.scheduleHabitReminderAsync({ habit })).resolves.toBeUndefined();
      await expect(NotificationService.cancelAllAsync()).resolves.toBeUndefined();
      expect(loader).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatformOS });
    }
  });

  it('shares a single module load between concurrent startup handlers in a native build', async () => {
    const loader = jest.fn(async () => notifications);
    setNotificationModuleLoaderForTests(loader);

    await expect(Promise.all([
      NotificationService.configureForegroundHandlingAsync(),
      NotificationService.configureResponseHandlingAsync(),
    ])).resolves.toEqual([true, true]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it.each(['throw', 'reject'] as const)('handles a module loader that fails by %s', async (failure) => {
    setNotificationModuleLoaderForTests(() => {
      if (failure === 'throw') throw new Error('Missing native module');
      return Promise.reject(new Error('Missing native module'));
    });

    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(false);
    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(false);
  });

  it.each(['setNotificationHandler', 'addNotificationResponseReceivedListener'] as const)(
    'rejects a partially loaded module missing %s',
    async (method) => {
      const incomplete = { ...notifications };
      Reflect.deleteProperty(incomplete, method);
      setNotificationModuleLoaderForTests(async () => incomplete);

      await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(false);
      await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(false);
      expect(notifications.setNotificationHandler).not.toHaveBeenCalled();
      expect(notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
    },
  );

  it('returns unavailable when a native startup API throws', async () => {
    jest.mocked(notifications.setNotificationHandler).mockImplementation(() => { throw new Error('Native handler unavailable'); });
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation(() => { throw new Error('Native listener unavailable'); });

    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(false);
    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(false);
  });

  it('does not schedule todo reminders for past dates', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);

    await expect(
      NotificationService.scheduleTodoReminderAsync({ title: 'Old', dueAt: '2000-01-01' })
    ).resolves.toBeUndefined();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules todo reminders with routing metadata', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('todo-notification-id');

    await expect(
      NotificationService.scheduleTodoReminderAsync({ title: 'Pay rent', dueAt: '2026-06-03', language: 'es' })
    ).resolves.toBe('todo-notification-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: 'Pay rent',
          data: { type: 'todo_reminder', language: 'es' },
        }),
      })
    );
  });

  it('routes todo notification taps to the todos screen', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    let listener: ((response: unknown) => void) | undefined;
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'default',
      notification: {
        request: {
          content: { data: { type: 'todo_reminder' } },
          identifier: 'notification_1',
        },
      },
    });

    await flushAsync();
    expect(router.navigate).toHaveBeenCalledWith('/todos');
  });

  it('schedules habit reminders only when permissions and time are valid', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('notification-id');

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habit,
        throwOnError: true,
      })
    ).resolves.toBe('notification-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          categoryIdentifier: 'habit_reminder_background_v1',
          data: expect.objectContaining({ habitId: 'habit_1', dateKey: expect.any(String) }),
        }),
        trigger: expect.objectContaining({ date: expect.any(Date) }),
      })
    );
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(14);
  });

  it('configures habit actions to avoid foregrounding the app', async () => {
    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(true);

    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalledWith('habit_reminder_background_v1', [
      expect.objectContaining({
        identifier: 'mark_habit_complete',
        options: { opensAppToForeground: false },
      }),
      expect.objectContaining({
        identifier: 'remind_habit_in_30_minutes',
        options: { opensAppToForeground: false },
      }),
    ]);
  });

  it('routes default habit notification taps to the habits screen', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    let listener: ((response: unknown) => void) | undefined;
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'default',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });

    await flushAsync();
    expect(router.navigate).toHaveBeenCalledWith('/habits');
  });

  it('handles cold-start todo notification responses', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    notifications.getLastNotificationResponseAsync.mockResolvedValue({
      actionIdentifier: 'default',
      notification: {
        request: {
          content: { data: { type: 'todo_reminder' } },
          identifier: 'notification_1',
        },
      },
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);

    expect(router.navigate).toHaveBeenCalledWith('/todos');
    expect(notifications.clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
  });

  it('skips completed days when scheduling habit reminders', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { listCompletedDateKeysByHabitId: TestMock };
    };
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    HabitCompletionRepository.listCompletedDateKeysByHabitId.mockResolvedValue(new Set(['2026-06-02']));
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('next-id');

    await expect(NotificationService.scheduleHabitReminderAsync({ habit })).resolves.toBe('next-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          data: expect.objectContaining({ dateKey: '2026-06-03' }),
        }),
      })
    );
    expect(HabitCompletionRepository.listCompletedDateKeysByHabitId).toHaveBeenCalledWith(
      'habit_1',
      '2026-06-02',
      '2027-06-07'
    );
  });

  it('still schedules habit reminders when the completed-date lookup fails', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { listCompletedDateKeysByHabitId: TestMock };
    };
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    HabitCompletionRepository.listCompletedDateKeysByHabitId.mockRejectedValue(new Error('database offline'));
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('next-id');

    await expect(NotificationService.scheduleHabitReminderAsync({ habit })).resolves.toBe('next-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(14);
  });

  it('counts scheduled habit reminders by habit id', async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'notification_1',
        content: { data: { type: 'habit_reminder', habitId: 'habit_1' } },
      },
      {
        identifier: 'notification_2',
        content: { data: { type: 'habit_reminder', habitId: 'habit_1' } },
      },
      {
        identifier: 'notification_3',
        content: { data: { type: 'todo_reminder' } },
      },
    ]);

    await expect(NotificationService.getScheduledHabitReminderCountsAsync()).resolves.toEqual(
      new Map([['habit_1', 2]])
    );
  });

  it('schedules habit reminders for the next valid date when today has passed', async () => {
    jest.setSystemTime(new Date(2026, 5, 2, 10, 0, 0, 0));
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('next-notification-id');

    await expect(NotificationService.scheduleHabitReminderAsync({ habit })).resolves.toBe('next-notification-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          date: new Date(2026, 5, 3, 8, 15, 0, 0),
        }),
      })
    );
  });

  it('schedules snoozed habit reminders for 30 minutes', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('snooze-id');

    await expect(NotificationService.scheduleHabitSnoozeReminderAsync({ habit })).resolves.toBe('snooze-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'timeInterval',
          seconds: 1800,
        }),
      })
    );
  });

  it('cancels scheduled and delivered notifications by id', async () => {
    await expect(NotificationService.cancelAsync('notification-id')).resolves.toBeUndefined();

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id');
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification-id');
  });

  it('cancels all scheduled habit reminders for a habit id plus the fallback id', async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'habit-1-a',
        content: { data: { type: 'habit_reminder', habitId: 'habit_1' } },
      },
      {
        identifier: 'habit-1-b',
        content: { data: { type: 'habit_reminder', habitId: 'habit_1' } },
      },
      {
        identifier: 'habit-2-a',
        content: { data: { type: 'habit_reminder', habitId: 'habit_2' } },
      },
    ]);

    await expect(NotificationService.cancelHabitRemindersAsync('habit_1', 'fallback-id')).resolves.toBeUndefined();

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('fallback-id');
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('habit-1-a');
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('habit-1-b');
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('habit-2-a');
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('fallback-id');
  });

  it('cancels scheduled and delivered notifications when clearing all', async () => {
    await expect(NotificationService.cancelAllAsync()).resolves.toBeUndefined();

    expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('marks habits complete from delivered actions without rescheduling when notifications are disabled', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: TestMock };
      HabitRepository: { update: TestMock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    let listener: ((response: unknown) => void) | undefined;
    SettingsRepository.get.mockResolvedValue({ ...enabledSettings, notificationsEnabled: false });
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'mark_habit_complete',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });
    await flushAsync();

    expect(HabitCompletionRepository.upsert).toHaveBeenCalledWith({
      habitId: 'habit_1',
      date: '2026-06-02',
      completed: true,
    });
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification_1');
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_1', { notificationId: undefined });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ignores habit actions that are missing a valid habit id', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: TestMock };
    };
    let listener: ((response: unknown) => void) | undefined;
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'mark_habit_complete',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });
    await flushAsync();

    expect(HabitCompletionRepository.upsert).not.toHaveBeenCalled();
    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
  });

  it('marks the notification date complete even when action is handled after midnight', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: TestMock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    let listener: ((response: unknown) => void) | undefined;
    SettingsRepository.get.mockResolvedValue({ ...enabledSettings, notificationsEnabled: false });
    jest.setSystemTime(new Date('2026-06-03T01:00:00.000Z'));
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'mark_habit_complete',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });
    await flushAsync();

    expect(HabitCompletionRepository.upsert).toHaveBeenCalledWith({
      habitId: 'habit_1',
      date: '2026-06-02',
      completed: true,
    });
  });

  it('dismisses habit snooze actions without rescheduling when notifications are disabled', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: TestMock };
      HabitRepository: { update: TestMock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    let listener: ((response: unknown) => void) | undefined;
    SettingsRepository.get.mockResolvedValue({ ...enabledSettings, notificationsEnabled: false });
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'remind_habit_in_30_minutes',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });
    await flushAsync();

    expect(HabitCompletionRepository.upsert).not.toHaveBeenCalled();
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification_1');
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_1', { notificationId: undefined });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not snooze completed habits', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { findByHabitAndDate: TestMock };
    };
    let listener: ((response: unknown) => void) | undefined;
    HabitCompletionRepository.findByHabitAndDate.mockResolvedValue({
      habitId: 'habit_1',
      date: '2026-06-02',
      completed: true,
    });
    jest.mocked(notifications.addNotificationResponseReceivedListener).mockImplementation((callback) => {
      listener = callback as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    listener?.({
      actionIdentifier: 'remind_habit_in_30_minutes',
      notification: {
        request: {
          content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
          identifier: 'notification_1',
        },
      },
    });
    await flushAsync();

    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification_1');
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('requests permissions at the point of need', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: false } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.requestPermissionsAsync).mockResolvedValue({ granted: false } as Awaited<
      ReturnType<NotificationsModule['requestPermissionsAsync']>
    >);

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habit,
      })
    ).resolves.toBeUndefined();

    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('configures foreground notification presentation when available', async () => {
    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(true);

    expect(notifications.setNotificationHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    });
    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalledWith('habit_reminder_background_v1', [
      expect.objectContaining({ identifier: 'mark_habit_complete', buttonTitle: 'Mark complete' }),
      expect.objectContaining({ identifier: 'remind_habit_in_30_minutes', buttonTitle: 'Remind in 30 minutes' }),
    ]);
  });

  function actionResponse(actionIdentifier = 'mark_habit_complete') {
    return { actionIdentifier, notification: { request: { identifier: 'original', content: {
      data: { type: 'habit_reminder', habitId: habit.id, dateKey: '2026-06-02' },
    } } } };
  }

  it('uses the Expo default identifier for body taps, without treating it as a button', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    notifications.getLastNotificationResponseAsync.mockResolvedValue(actionResponse(notifications.DEFAULT_ACTION_IDENTIFIER));
    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    expect(router.navigate).toHaveBeenCalledWith('/habits');
    expect(notifications.clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
  });

  it('retains failed initial responses, retries them, and clears only after persistence succeeds', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: TestMock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    SettingsRepository.get.mockResolvedValue({ ...enabledSettings, notificationsEnabled: false });
    notifications.getLastNotificationResponseAsync.mockResolvedValue(actionResponse());
    HabitCompletionRepository.upsert.mockRejectedValueOnce(new Error('database busy'));
    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(false);
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
    await expect(NotificationService.configureResponseHandlingAsync()).resolves.toBe(true);
    expect(notifications.clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
    expect(notifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
  });

  it('does not clear a newer pending response after finishing an older action', async () => {
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: TestMock };
    };
    SettingsRepository.get.mockResolvedValue({ ...enabledSettings, notificationsEnabled: false });
    notifications.getLastNotificationResponseAsync.mockResolvedValue(actionResponse('remind_habit_in_30_minutes'));
    await handleNotificationActionAsync(actionResponse());
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
  });

  it('snoozes once with a stable identifier and a deadline 30 minutes after interaction', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>>);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('snooze_original');
    const requestedAt = Date.now();
    const response = actionResponse('remind_habit_in_30_minutes');
    await Promise.all([handleNotificationActionAsync(response), handleNotificationActionAsync(response)]);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      identifier: 'snooze_original', trigger: expect.objectContaining({ type: 'date',
        date: new Date(requestedAt + 30 * 60 * 1000) }),
    }));
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    const { router } = jest.requireMock('expo-router') as { router: { navigate: TestMock } };
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it.each(['scheduled', 'presented'])('reuses a snooze already %s across JS executions', async (location) => {
    if (location === 'scheduled') notifications.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: 'snooze_original' }]);
    else notifications.getPresentedNotificationsAsync.mockResolvedValue([{ request: { identifier: 'snooze_original' } }]);
    await expect(handleNotificationActionAsync(actionResponse('remind_habit_in_30_minutes'))).resolves.toBe('handled');
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('original');
  });

  it('keeps the original notification after a scheduling failure', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>>);
    jest.mocked(notifications.scheduleNotificationAsync).mockRejectedValue(new Error('scheduler unavailable'));
    await expect(handleNotificationActionAsync(actionResponse('remind_habit_in_30_minutes'))).rejects.toThrow('scheduler unavailable');
    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
  });

  it('preserves future reminders when completion replenishment fails', async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: 'today', content: { data: { type: 'habit_reminder', habitId: habit.id, dateKey: '2026-06-02' } } },
      { identifier: 'future', content: { data: { type: 'habit_reminder', habitId: habit.id, dateKey: '2026-06-03' } } },
    ]);
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>>);
    jest.mocked(notifications.scheduleNotificationAsync).mockRejectedValue(new Error('scheduler unavailable'));
    await expect(handleNotificationActionAsync(actionResponse())).rejects.toThrow('scheduler unavailable');
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('today');
    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('future');
    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
  });

  it('reuses existing future occurrence IDs when replenishing the schedule', async () => {
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: 'existing-future', content: {
      data: { type: 'habit_reminder', habitId: habit.id, dateKey: '2026-06-03' },
    } }]);
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>>);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('new-occurrence');
    await NotificationService.scheduleHabitReminderAsync({ habit });
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(13);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({ data: expect.objectContaining({ dateKey: '2026-06-03' }) }),
    }));
  });

  it('renews legacy requests in place and removes only legacy presented habit notifications', async () => {
    const value = new Date(2026, 5, 3, 8).getTime();
    notifications.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: 'legacy',
      content: { title: 'Done Loop', body: 'Read', data: { type: 'habit_reminder', habitId: habit.id } },
      trigger: { type: 'date', value } }]);
    notifications.getPresentedNotificationsAsync.mockResolvedValue([
      { request: { identifier: 'old', content: { data: { type: 'habit_reminder' } } } },
      { request: { identifier: 'task', content: { data: { type: 'todo_reminder' } } } },
    ]);
    await NotificationService.refreshHabitNotificationActionsAsync('es');
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ identifier: 'legacy',
      content: expect.objectContaining({ categoryIdentifier: 'habit_reminder_background_v1',
        data: expect.objectContaining({ actionVersion: 1 }) }), trigger: expect.objectContaining({ date: new Date(value) }) }));
    expect(notifications.dismissNotificationAsync).toHaveBeenCalledWith('old');
    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalledWith('task');
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shares channel/category configuration across concurrent callers', async () => {
    await Promise.all(Array.from({ length: 20 }, () => NotificationService.configureForegroundHandlingAsync()));
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalledTimes(1);
  });

  it('retries channel configuration after a native failure', async () => {
    notifications.setNotificationChannelAsync.mockRejectedValueOnce(new Error('native busy'));
    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(false);
    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(true);
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(2);
  });
});
