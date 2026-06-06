import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';

import {
  NotificationService,
  resetNotificationModuleLoaderForTests,
  setNotificationModuleLoaderForTests,
} from './notification-service';
import type { Habit } from '@/features/habits/types';
import type { UserSettings } from '@/features/settings/types';

type NotificationsModule = typeof import('expo-notifications');
type TestNotificationsModule = NotificationsModule & {
  clearLastNotificationResponseAsync: jest.Mock;
  dismissAllNotificationsAsync: jest.Mock;
  getAllScheduledNotificationsAsync: jest.Mock;
  getLastNotificationResponseAsync: jest.Mock;
  setNotificationChannelAsync: jest.Mock;
};

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
  theme: 'system',
};

async function flushAsync(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
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
    addNotificationResponseReceivedListener: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    clearLastNotificationResponseAsync: jest.fn(),
    dismissAllNotificationsAsync: jest.fn(),
    dismissNotificationAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
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
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { findByHabitAndDate: jest.Mock; listCompletedDateKeysByHabitId: jest.Mock };
      HabitRepository: { findById: jest.Mock; update: jest.Mock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: jest.Mock };
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
    const originalAppOwnership = Constants.appOwnership;
    const originalPlatformOS = Platform.OS;
    Object.defineProperty(Constants, 'appOwnership', { configurable: true, value: AppOwnership.Expo });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    setNotificationModuleLoaderForTests(loader);

    await expect(NotificationService.requestPermissionsAsync()).resolves.toBe(false);

    expect(loader).not.toHaveBeenCalled();

    Object.defineProperty(Constants, 'appOwnership', { configurable: true, value: originalAppOwnership });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatformOS });
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
    const { router } = jest.requireMock('expo-router') as { router: { navigate: jest.Mock } };
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
      })
    ).resolves.toBe('notification-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          categoryIdentifier: 'habit_reminder',
          data: expect.objectContaining({ habitId: 'habit_1', dateKey: expect.any(String) }),
        }),
        trigger: expect.objectContaining({ date: expect.any(Date) }),
      })
    );
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(14);
  });

  it('handles cold-start todo notification responses', async () => {
    const { router } = jest.requireMock('expo-router') as { router: { navigate: jest.Mock } };
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
      HabitCompletionRepository: { listCompletedDateKeysByHabitId: jest.Mock };
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
      HabitCompletionRepository: { listCompletedDateKeysByHabitId: jest.Mock };
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
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: jest.Mock };
      HabitRepository: { update: jest.Mock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: jest.Mock };
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
  });

  it('ignores habit actions that are missing a valid habit id', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: jest.Mock };
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
      HabitCompletionRepository: { upsert: jest.Mock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: jest.Mock };
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
    const { HabitCompletionRepository, HabitRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { upsert: jest.Mock };
      HabitRepository: { update: jest.Mock };
    };
    const { SettingsRepository } = jest.requireMock('@/features/settings/repositories/settings-repository') as {
      SettingsRepository: { get: jest.Mock };
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
  });

  it('does not snooze completed habits', async () => {
    const { HabitCompletionRepository } = jest.requireMock('@/features/habits/repositories') as {
      HabitCompletionRepository: { findByHabitAndDate: jest.Mock };
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

    expect(notifications.dismissNotificationAsync).not.toHaveBeenCalled();
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
    expect(notifications.setNotificationCategoryAsync).toHaveBeenCalledWith('habit_reminder', [
      expect.objectContaining({ identifier: 'mark_habit_complete', buttonTitle: 'Mark complete' }),
      expect.objectContaining({ identifier: 'remind_habit_in_30_minutes', buttonTitle: 'Remind in 30 minutes' }),
    ]);
  });
});
