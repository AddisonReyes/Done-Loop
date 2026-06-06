import Constants, { AppOwnership } from 'expo-constants';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';

import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { getHabitsDueOnDate } from '@/features/habits/services/habit-recurrence';
import type { Habit } from '@/features/habits/types';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserLanguagePreference } from '@/features/settings/types';
import { translations } from '@/i18n/translations';
import { emitAppEvent } from '@/shared/events/app-events';
import { dateKeyToLocalDate, isDateKey, toDateKey } from '@/shared/utils/date';
import { parseReminderTime } from './reminder-time';

type NotificationsModule = typeof import('expo-notifications');
type NotificationsModuleLoader = () => Promise<NotificationsModule | null>;

type ScheduleHabitReminderInput = {
  habit: Habit;
  fromDate?: Date;
  language?: UserLanguagePreference;
  skipDateKeys?: string[];
};

type ScheduleTodoReminderInput = {
  title: string;
  dueAt?: string;
  language?: UserLanguagePreference;
};

const habitReminderCategoryId = 'habit_reminder';
const androidReminderChannelId = 'done_loop_reminders';
const markHabitCompleteActionId = 'mark_habit_complete';
const remindHabitIn30MinutesActionId = 'remind_habit_in_30_minutes';
const habitReminderLookaheadDays = 370;
const habitReminderScheduledOccurrences = 14;

let notificationsModuleLoader: NotificationsModuleLoader = () => import('expo-notifications');
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationResponseSubscription: { remove: () => void } | null = null;
let appStateSubscription: { remove: () => void } | null = null;

type NotificationResponse = Parameters<NotificationsModule['addNotificationResponseReceivedListener']>[0] extends (
  value: infer Response
) => unknown
  ? Response
  : never;

async function getNotificationsModuleAsync(): Promise<NotificationsModule | null> {
  // Android Expo Go imports expo-notifications push-token side effects and logs a SDK 53+ unsupported warning.
  // Development/preview/production builds still load the module normally.
  if (Platform.OS === 'android' && isExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = notificationsModuleLoader().catch(() => null);
  }

  return notificationsModulePromise;
}

function isExpoGo(): boolean {
  return Constants.appOwnership === AppOwnership.Expo;
}

async function configureAndroidReminderChannelAsync(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android' || isExpoGo() || !('setNotificationChannelAsync' in notifications)) {
    return;
  }

  await notifications.setNotificationChannelAsync(androidReminderChannelId, {
    name: 'Done Loop reminders',
    importance: notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function ensurePermissionsAsync(): Promise<boolean> {
  const notifications = await getNotificationsModuleAsync();
  if (!notifications) {
    return false;
  }

  await configureAndroidReminderChannelAsync(notifications);

  const existing = await notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await notifications.requestPermissionsAsync();
  return requested.granted;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

async function isHabitCompletedOnDate(habitId: string, dateKey: string): Promise<boolean> {
  const completion = await HabitCompletionRepository.findByHabitAndDate(habitId, dateKey);
  return completion?.completed ?? false;
}

async function findHabitReminderDatesAsync(
  habit: Habit,
  reminderTime: NonNullable<ReturnType<typeof parseReminderTime>>,
  fromDate: Date,
  skipDateKeys: Set<string>,
  limit = habitReminderScheduledOccurrences
): Promise<Date[]> {
  const reminderDates: Date[] = [];
  const completedDateKeys = await HabitCompletionRepository.listCompletedDateKeysByHabitId(
    habit.id,
    toDateKey(fromDate),
    toDateKey(addDays(fromDate, habitReminderLookaheadDays))
  ).catch(() => new Set<string>());

  for (let offset = 0; offset <= habitReminderLookaheadDays && reminderDates.length < limit; offset += 1) {
    const candidate = addDays(fromDate, offset);
    const dateKey = toDateKey(candidate);

    if (skipDateKeys.has(dateKey) || getHabitsDueOnDate([habit], dateKey).length === 0) {
      continue;
    }

    const reminderDate = new Date(candidate);
    reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

    if (reminderDate.getTime() <= Date.now() || completedDateKeys.has(dateKey)) {
      continue;
    }

    reminderDates.push(reminderDate);
  }

  return reminderDates;
}

async function configureHabitReminderCategoryAsync(
  notifications: NotificationsModule,
  language: UserLanguagePreference
): Promise<void> {
  if (!('setNotificationCategoryAsync' in notifications)) {
    return;
  }

  await notifications.setNotificationCategoryAsync(habitReminderCategoryId, [
    {
      identifier: markHabitCompleteActionId,
      buttonTitle: translations[language].notifications.markHabitComplete,
    },
    {
      identifier: remindHabitIn30MinutesActionId,
      buttonTitle: translations[language].notifications.remindIn30Minutes,
    },
  ]);
}

function getHabitNotificationData(habitId: string, language: UserLanguagePreference, dateKey: string) {
  return {
    type: 'habit_reminder',
    habitId,
    language,
    dateKey,
  };
}

function getTodoNotificationData(language: UserLanguagePreference) {
  return {
    type: 'todo_reminder',
    language,
  };
}

function getHabitIdFromResponse(response: NotificationResponse): string | null {
  const data = response.notification.request.content.data;
  const habitId = data?.habitId;
  return typeof habitId === 'string' ? habitId : null;
}

function getNotificationTypeFromResponse(response: NotificationResponse): string | null {
  const type = response.notification.request.content.data?.type;
  return typeof type === 'string' ? type : null;
}

function getLanguageFromResponse(response: NotificationResponse): UserLanguagePreference {
  const data = response.notification.request.content.data;
  return data?.language === 'es' ? 'es' : 'en';
}

function getDateKeyFromResponse(response: NotificationResponse): string | null {
  const dateKey = response.notification.request.content.data?.dateKey;
  return typeof dateKey === 'string' && isDateKey(dateKey) ? dateKey : null;
}

function getScheduledNotificationData(notification: unknown): Record<string, unknown> | null {
  const data = (notification as { content?: { data?: unknown } }).content?.data;
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}

function getScheduledNotificationId(notification: unknown): string | null {
  const identifier = (notification as { identifier?: unknown }).identifier;
  return typeof identifier === 'string' ? identifier : null;
}

function getScheduledHabitReminderCounts(scheduledNotifications: unknown[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const notification of scheduledNotifications) {
    const data = getScheduledNotificationData(notification);
    const habitId = data?.habitId;

    if (data?.type !== 'habit_reminder' || typeof habitId !== 'string') {
      continue;
    }

    counts.set(habitId, (counts.get(habitId) ?? 0) + 1);
  }

  return counts;
}

async function dismissNotificationAsync(
  notifications: NotificationsModule,
  notificationId: string
): Promise<void> {
  if ('dismissNotificationAsync' in notifications) {
    await Promise.resolve(notifications.dismissNotificationAsync(notificationId)).catch(() => undefined);
  }
}

function hasDismissAllNotificationsAsync(
  notifications: NotificationsModule
): notifications is NotificationsModule & { dismissAllNotificationsAsync: () => Promise<void> | void } {
  return typeof (notifications as { dismissAllNotificationsAsync?: unknown }).dismissAllNotificationsAsync === 'function';
}

async function handleHabitCompletionActionAsync(
  notifications: NotificationsModule,
  habitId: string,
  notificationId: string,
  language: UserLanguagePreference,
  dateKey: string
): Promise<void> {
  const habit = await HabitRepository.findById(habitId);

  if (!habit || getHabitsDueOnDate([habit], dateKey).length === 0) {
    return;
  }

  await HabitCompletionRepository.upsert({
    habitId,
    date: dateKey,
    completed: true,
  });
  await dismissNotificationAsync(notifications, notificationId);
  const settings = await SettingsRepository.get();
  if (!settings.notificationsEnabled) {
    await HabitRepository.update(habitId, { notificationId: undefined });
    await NotificationService.cancelHabitRemindersAsync(habitId, notificationId).catch(() => undefined);
    emitAppEvent('habitsChanged');
    return;
  }

  await NotificationService.cancelHabitRemindersAsync(habitId, notificationId).catch(() => undefined);

  const nextNotificationId = await NotificationService.scheduleHabitReminderAsync({
    habit,
    language,
    skipDateKeys: [dateKey],
  });
  await HabitRepository.update(habitId, { notificationId: nextNotificationId });
  emitAppEvent('habitsChanged');
}

async function handleHabitSnoozeActionAsync(
  notifications: NotificationsModule,
  habitId: string,
  notificationId: string,
  language: UserLanguagePreference,
  dateKey: string
): Promise<void> {
  const habit = await HabitRepository.findById(habitId);

  if (
    !habit ||
    getHabitsDueOnDate([habit], dateKey).length === 0 ||
    (await isHabitCompletedOnDate(habitId, dateKey))
  ) {
    return;
  }

  await dismissNotificationAsync(notifications, notificationId);
  const settings = await SettingsRepository.get();
  if (!settings.notificationsEnabled) {
    await HabitRepository.update(habitId, { notificationId: undefined });
    return;
  }

  const snoozeNotificationId = await NotificationService.scheduleHabitSnoozeReminderAsync({
    habit,
    language,
    dateKey,
  });

  if (snoozeNotificationId) {
    await HabitRepository.update(habitId, { notificationId: snoozeNotificationId });
  }
}

async function handleNotificationResponseAsync(
  notifications: NotificationsModule,
  response: NotificationResponse
): Promise<void> {
  const type = getNotificationTypeFromResponse(response);
  const habitId = getHabitIdFromResponse(response);
  const notificationId = response.notification.request.identifier;
  const language = getLanguageFromResponse(response);
  const dateKey = getDateKeyFromResponse(response) ?? toDateKey(new Date());

  if (type === 'todo_reminder') {
    router.navigate('/todos');
    return;
  }

  if (!habitId) {
    return;
  }

  if (response.actionIdentifier === markHabitCompleteActionId) {
    await handleHabitCompletionActionAsync(notifications, habitId, notificationId, language, dateKey);
    return;
  }

  if (response.actionIdentifier === remindHabitIn30MinutesActionId) {
    await handleHabitSnoozeActionAsync(notifications, habitId, notificationId, language, dateKey);
    return;
  }

  router.navigate('/habits');
}

async function getLastNotificationResponseAsync(
  notifications: NotificationsModule
): Promise<NotificationResponse | null> {
  const maybeNotifications = notifications as NotificationsModule & {
    getLastNotificationResponse?: () => NotificationResponse | null;
    getLastNotificationResponseAsync?: () => Promise<NotificationResponse | null>;
  };

  if (typeof maybeNotifications.getLastNotificationResponseAsync === 'function') {
    return maybeNotifications.getLastNotificationResponseAsync();
  }

  if (typeof maybeNotifications.getLastNotificationResponse === 'function') {
    return maybeNotifications.getLastNotificationResponse();
  }

  return null;
}

async function clearLastNotificationResponseAsync(notifications: NotificationsModule): Promise<void> {
  const maybeNotifications = notifications as NotificationsModule & {
    clearLastNotificationResponseAsync?: () => Promise<void> | void;
  };

  if (typeof maybeNotifications.clearLastNotificationResponseAsync === 'function') {
    await Promise.resolve(maybeNotifications.clearLastNotificationResponseAsync()).catch(() => undefined);
  }
}

export const NotificationService = {
  getHabitReminderScheduledOccurrenceTarget(): number {
    return habitReminderScheduledOccurrences;
  },

  async configureForegroundHandlingAsync(): Promise<boolean> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return false;
    }

    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    await configureAndroidReminderChannelAsync(notifications);
    await configureHabitReminderCategoryAsync(notifications, 'en');

    return true;
  },

  async configureResponseHandlingAsync(): Promise<boolean> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications || notificationResponseSubscription) {
      return !!notifications;
    }

    notificationResponseSubscription = notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponseAsync(notifications, response).catch(() => undefined);
    });

    const initialResponse = await getLastNotificationResponseAsync(notifications).catch(() => null);
    if (initialResponse) {
      await handleNotificationResponseAsync(notifications, initialResponse).catch(() => undefined);
      await clearLastNotificationResponseAsync(notifications);
    }

    return true;
  },

  configureAppStateSync(syncReminders: () => void): void {
    if (appStateSubscription) {
      return;
    }

    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncReminders();
      }
    });
  },

  async requestPermissionsAsync(): Promise<boolean> {
    return ensurePermissionsAsync().catch(() => false);
  },

  async scheduleHabitReminderAsync({
    habit,
    language = 'en',
    fromDate = new Date(),
    skipDateKeys = [],
  }: ScheduleHabitReminderInput): Promise<string | undefined> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications) {
        return undefined;
      }

      const time = parseReminderTime(habit.reminderTime);
      if (!time || !(await ensurePermissionsAsync())) {
        return undefined;
      }

      await configureAndroidReminderChannelAsync(notifications);
      await configureHabitReminderCategoryAsync(notifications, language);

      const reminderDates = await findHabitReminderDatesAsync(
        habit,
        time,
        fromDate,
        new Set(skipDateKeys)
      );

      if (reminderDates.length === 0) {
        return undefined;
      }

      const notificationIds = await Promise.all(
        reminderDates.map((reminderDate) =>
          notifications.scheduleNotificationAsync({
            content: {
              title: 'Done Loop',
              body: translations[language].notifications.habitBody.replace('{{habitName}}', habit.name),
              categoryIdentifier: habitReminderCategoryId,
              data: getHabitNotificationData(habit.id, language, toDateKey(reminderDate)),
            },
            trigger: {
              type: notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate,
              channelId: androidReminderChannelId,
            },
          })
        )
      );

      return notificationIds[0];
    } catch {
      return undefined;
    }
  },

  async scheduleHabitSnoozeReminderAsync({
    dateKey,
    habit,
    language = 'en',
  }: {
    habit: Habit;
    language?: UserLanguagePreference;
    dateKey?: string;
  }): Promise<string | undefined> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications || !(await ensurePermissionsAsync())) {
        return undefined;
      }

      await configureAndroidReminderChannelAsync(notifications);
      await configureHabitReminderCategoryAsync(notifications, language);

      return notifications.scheduleNotificationAsync({
        content: {
          title: 'Done Loop',
          body: translations[language].notifications.habitBody.replace('{{habitName}}', habit.name),
          categoryIdentifier: habitReminderCategoryId,
          data: getHabitNotificationData(habit.id, language, dateKey ?? toDateKey(new Date())),
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 30 * 60,
          channelId: androidReminderChannelId,
        },
      });
    } catch {
      return undefined;
    }
  },

  async scheduleTodoReminderAsync({
    title,
    dueAt,
    language = 'en',
  }: ScheduleTodoReminderInput): Promise<string | undefined> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications || !dueAt || !(await ensurePermissionsAsync())) {
        return undefined;
      }

      await configureAndroidReminderChannelAsync(notifications);

      const dueDate = dateKeyToLocalDate(dueAt);
      if (!dueDate) {
        return undefined;
      }

      dueDate.setHours(9, 0, 0, 0);

      if (dueDate.getTime() <= Date.now()) {
        return undefined;
      }

      return notifications.scheduleNotificationAsync({
        content: {
          title: translations[language].notifications.todoTitle,
          body: title,
          data: getTodoNotificationData(language),
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDate,
          channelId: androidReminderChannelId,
        },
      });
    } catch {
      return undefined;
    }
  },

  async cancelAsync(notificationId?: string): Promise<void> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications || !notificationId) {
      return;
    }

    await Promise.resolve(notifications.cancelScheduledNotificationAsync(notificationId)).catch(() => undefined);
    await dismissNotificationAsync(notifications, notificationId);
  },

  async cancelHabitRemindersAsync(habitId: string, fallbackNotificationId?: string): Promise<void> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return;
    }

    if (fallbackNotificationId) {
      await NotificationService.cancelAsync(fallbackNotificationId);
    }

    const getAllScheduled = (notifications as NotificationsModule & {
      getAllScheduledNotificationsAsync?: () => Promise<unknown[]>;
    }).getAllScheduledNotificationsAsync;

    if (typeof getAllScheduled !== 'function') {
      return;
    }

    const scheduledNotifications = await getAllScheduled.call(notifications).catch(() => []);
    await Promise.all(
      scheduledNotifications.map(async (notification) => {
        const data = getScheduledNotificationData(notification);
        const notificationId = getScheduledNotificationId(notification);

        if (data?.type !== 'habit_reminder' || data.habitId !== habitId || !notificationId) {
          return;
        }

        await Promise.resolve(notifications.cancelScheduledNotificationAsync(notificationId)).catch(() => undefined);
      })
    );
  },

  async getScheduledHabitReminderCountsAsync(): Promise<Map<string, number>> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return new Map<string, number>();
    }

    const getAllScheduled = (notifications as NotificationsModule & {
      getAllScheduledNotificationsAsync?: () => Promise<unknown[]>;
    }).getAllScheduledNotificationsAsync;

    if (typeof getAllScheduled !== 'function') {
      return new Map<string, number>();
    }

    const scheduledNotifications = await getAllScheduled.call(notifications).catch(() => []);
    return getScheduledHabitReminderCounts(scheduledNotifications);
  },

  async cancelAllAsync(): Promise<void> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return;
    }

    await Promise.resolve(notifications.cancelAllScheduledNotificationsAsync()).catch(() => undefined);
    if (hasDismissAllNotificationsAsync(notifications)) {
      await Promise.resolve(notifications.dismissAllNotificationsAsync()).catch(() => undefined);
    }
  },
};

export function setNotificationModuleLoaderForTests(loader: NotificationsModuleLoader): void {
  notificationsModuleLoader = loader;
  notificationsModulePromise = null;
}

export function resetNotificationModuleLoaderForTests(): void {
  notificationsModuleLoader = () => import('expo-notifications');
  notificationsModulePromise = null;
  notificationResponseSubscription?.remove();
  notificationResponseSubscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
}
