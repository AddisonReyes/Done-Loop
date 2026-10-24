import { isRunningInExpoGo } from 'expo';
import { AppState, Platform } from 'react-native';

import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { getHabitsDueOnDate } from '@/features/habits/services/habit-recurrence';
import type { Habit } from '@/features/habits/types';
import type { UserLanguagePreference } from '@/features/settings/types';
import { translations } from '@/i18n/translations';
import { dateKeyToLocalDate, toDateKey } from '@/shared/utils/date';
import { createSharedReads } from '@/shared/services/shared-reads';
import {
  createNotificationActionProcessor,
  habitReminderCategoryId,
  markHabitCompleteActionId,
  readNotificationResponse,
  remindHabitIn30MinutesActionId,
  type NotificationActionResult,
} from './notification-actions';
import { parseReminderTime } from './reminder-time';

type NotificationsModule = typeof import('expo-notifications');
type NotificationsModuleLoader = () => Promise<NotificationsModule | null>;

type ScheduleHabitReminderInput = {
  habit: Habit;
  fromDate?: Date;
  language?: UserLanguagePreference;
  skipDateKeys?: string[];
  requestPermissions?: boolean;
  throwOnError?: boolean;
};

type ScheduleTodoReminderInput = {
  title: string;
  dueAt?: string;
  language?: UserLanguagePreference;
};

const androidReminderChannelId = 'done_loop_reminders';
const habitReminderLookaheadDays = 370;
const habitReminderScheduledOccurrences = 14;

let notificationsModuleLoader: NotificationsModuleLoader = () => import('expo-notifications');
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationResponseSubscription: { remove: () => void } | null = null;
let appStateSubscription: { remove: () => void } | null = null;
const nativeReads = createSharedReads();
let channelConfiguration: Promise<void> | null = null;
let categoryLanguage: UserLanguagePreference | null = null;
let categoryConfiguration: Promise<void> = Promise.resolve();

type NotificationResponse = Parameters<NotificationsModule['addNotificationResponseReceivedListener']>[0] extends (
  value: infer Response
) => unknown
  ? Response
  : never;

export async function getNotificationsModuleAsync(): Promise<NotificationsModule | null> {
  // The Android entry point loads native modules that are unavailable in Expo Go.
  if (Platform.OS === 'android' && isRunningInExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = Promise.resolve()
      .then(notificationsModuleLoader)
      .then((notifications) => {
        if (!notifications || typeof notifications.setNotificationHandler !== 'function' ||
          typeof notifications.addNotificationResponseReceivedListener !== 'function') {
          return null;
        }
        return notifications;
      })
      .catch(() => null);
  }

  return notificationsModulePromise;
}

async function configureAndroidReminderChannelAsync(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android' || isRunningInExpoGo() || !('setNotificationChannelAsync' in notifications)) {
    return;
  }

  channelConfiguration ??= Promise.resolve(notifications.setNotificationChannelAsync(androidReminderChannelId, {
    name: 'Done Loop reminders',
    importance: notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  })).then(() => undefined).catch((error: unknown) => {
    channelConfiguration = null;
    throw error;
  });
  await channelConfiguration;
}

async function ensurePermissionsAsync(requestIfNeeded = true): Promise<boolean> {
  const notifications = await getNotificationsModuleAsync();
  if (!notifications) {
    return false;
  }

  await configureAndroidReminderChannelAsync(notifications);

  const existing = await nativeReads.read('permissions', () => notifications.getPermissionsAsync());
  if (existing.granted) {
    return true;
  }

  if (!requestIfNeeded) return false;

  const requested = await notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureActionTaskAsync(): Promise<boolean> {
  const { ensureNotificationActionTaskAsync }: typeof import('../tasks/notification-action-task') =
    require('../tasks/notification-action-task');
  return ensureNotificationActionTaskAsync();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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

  const operation = categoryConfiguration.catch(() => undefined).then(async () => {
    if (categoryLanguage === language) return;
    await notifications.setNotificationCategoryAsync(habitReminderCategoryId, [
    {
      identifier: markHabitCompleteActionId,
      buttonTitle: translations[language].notifications.markHabitComplete,
      options: { opensAppToForeground: false },
    },
    {
      identifier: remindHabitIn30MinutesActionId,
      buttonTitle: translations[language].notifications.remindIn30Minutes,
      options: { opensAppToForeground: false },
    },
    ]);
    categoryLanguage = language;
  });
  categoryConfiguration = operation;
  await operation;
}

function getHabitNotificationData(habitId: string, language: UserLanguagePreference, dateKey: string) {
  return {
    type: 'habit_reminder',
    habitId,
    language,
    dateKey,
    actionVersion: 1,
  };
}

function getTodoNotificationData(language: UserLanguagePreference) {
  return {
    type: 'todo_reminder',
    language,
  };
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

async function handleNotificationResponseAsync(
  notifications: NotificationsModule,
  response: NotificationResponse
): Promise<void> {
  if (await handleNotificationActionAsync(response) === 'handled') return;
  const parsed = readNotificationResponse(response);
  if (!parsed) return;
  const isDefaultAction = parsed.actionIdentifier === notifications.DEFAULT_ACTION_IDENTIFIER ||
    parsed.actionIdentifier === 'default' || parsed.actionIdentifier === undefined;
  if (!isDefaultAction) return;
  const route = parsed.data.type === 'todo_reminder' ? '/todos' :
    parsed.data.type === 'habit_reminder' && typeof parsed.data.habitId === 'string' ? '/habits' : null;
  if (!route) return;
  const { router }: typeof import('expo-router') = require('expo-router');
  router.navigate(route);
  await clearConsumedResponseAsync(notifications, response);
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

  if (typeof maybeNotifications.clearLastNotificationResponse === 'function') {
    maybeNotifications.clearLastNotificationResponse();
  } else if (typeof maybeNotifications.clearLastNotificationResponseAsync === 'function') {
    await maybeNotifications.clearLastNotificationResponseAsync();
  }
}

async function clearConsumedResponseAsync(notifications: NotificationsModule, value: unknown): Promise<void> {
  const consumed = readNotificationResponse(value);
  const current = readNotificationResponse(await getLastNotificationResponseAsync(notifications));
  if (consumed && current && consumed.notificationId === current.notificationId &&
    consumed.actionIdentifier === current.actionIdentifier) {
    await clearLastNotificationResponseAsync(notifications);
  }
}

const actionProcessor = createNotificationActionProcessor({
  dismiss: async (id) => {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) throw new Error('Notifications are unavailable.');
    await notifications.dismissNotificationAsync(id);
  },
  refresh: async (habit, action, enabled) => {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) throw new Error('Notifications are unavailable.');
    const scheduled = await nativeReads.read('scheduled', () => notifications.getAllScheduledNotificationsAsync());
    // Remove this occurrence only. Future reminders remain scheduled even if replenishment fails.
    for (const request of scheduled) {
      if (request.content.data?.type === 'habit_reminder' && request.content.data.habitId === habit.id &&
        (!enabled || request.content.data?.dateKey === action.dateKey)) {
        await notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
    const notificationId = enabled ? await NotificationService.scheduleHabitReminderAsync({
      habit, language: action.language, skipDateKeys: [action.dateKey], requestPermissions: false, throwOnError: true,
    }) : undefined;
    await HabitRepository.update(habit.id, { notificationId });
  },
  snooze: (habit, action, requestedAt) => NotificationService.scheduleHabitSnoozeReminderAsync({
    habit, language: action.language, dateKey: action.dateKey,
    sourceNotificationId: action.notificationId, requestedAt,
  }),
});

export async function handleNotificationActionAsync(value: unknown): Promise<NotificationActionResult> {
  const result = await actionProcessor.process(value);
  if (result === 'handled') {
    const notifications = await getNotificationsModuleAsync();
    if (notifications) await clearConsumedResponseAsync(notifications, value);
  }
  return result;
}

export const NotificationService = {
  async refreshHabitNotificationActionsAsync(language: UserLanguagePreference): Promise<void> {
    if (!(await ensureActionTaskAsync())) return;
    await actionProcessor.runExclusive(async () => {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications) return;
      await configureHabitReminderCategoryAsync(notifications, language);
      const pendingResponse = readNotificationResponse(await getLastNotificationResponseAsync(notifications));
      const scheduled = await nativeReads.read('scheduled', () => notifications.getAllScheduledNotificationsAsync());
      for (const request of scheduled) {
        const data = request.content.data;
        if (data?.type !== 'habit_reminder' || data.actionVersion === 1) continue;
        const trigger: unknown = request.trigger;
        let replacement: Parameters<NotificationsModule['scheduleNotificationAsync']>[0]['trigger'];
        if (trigger && typeof trigger === 'object' && 'type' in trigger && trigger.type === 'date' &&
          'value' in trigger && typeof trigger.value === 'number') {
          replacement = { type: notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(trigger.value), channelId: androidReminderChannelId };
        } else if (trigger && typeof trigger === 'object' && 'type' in trigger && trigger.type === 'timeInterval' &&
          'seconds' in trigger && typeof trigger.seconds === 'number') {
          // Legacy interval requests expose seconds, but not their remaining time.
          replacement = { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: trigger.seconds, channelId: androidReminderChannelId };
        } else {
          throw new Error('Cannot renew an unsupported habit reminder trigger.');
        }
        // Reusing the identifier replaces the native request without changing stored IDs.
        await notifications.scheduleNotificationAsync({ identifier: request.identifier,
          content: { title: request.content.title ?? undefined, body: request.content.body ?? undefined,
            categoryIdentifier: habitReminderCategoryId,
            data: { ...data, actionVersion: 1 } }, trigger: replacement });
      }
      const presented = await notifications.getPresentedNotificationsAsync();
      for (const notification of presented) {
        if (notification.request.content.data?.type === 'habit_reminder' &&
          notification.request.content.data.actionVersion !== 1 &&
          notification.request.identifier !== pendingResponse?.notificationId) {
          await notifications.dismissNotificationAsync(notification.request.identifier);
        }
      }
    });
  },

  getHabitReminderScheduledOccurrenceTarget(): number {
    return habitReminderScheduledOccurrences;
  },

  async configureForegroundHandlingAsync(): Promise<boolean> {
    try {
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
    } catch {
      return false;
    }
  },

  async configureResponseHandlingAsync(): Promise<boolean> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications) return false;

      notificationResponseSubscription ??= notifications.addNotificationResponseReceivedListener((response) => {
        void handleNotificationResponseAsync(notifications, response).catch((error: unknown) => {
          console.error('Could not process notification response.', error);
        });
      });

      const initialResponse = await getLastNotificationResponseAsync(notifications).catch(() => null);
      if (initialResponse) {
        await handleNotificationResponseAsync(notifications, initialResponse);
      }

      return true;
    } catch {
      return false;
    }
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
    try {
      return await ensureActionTaskAsync() && await ensurePermissionsAsync();
    } catch {
      return false;
    }
  },

  async scheduleHabitReminderAsync({
    habit,
    language = 'en',
    fromDate = new Date(),
    skipDateKeys = [],
    requestPermissions = true,
    throwOnError = false,
  }: ScheduleHabitReminderInput): Promise<string | undefined> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications) {
        return undefined;
      }

      if (!(await ensureActionTaskAsync())) throw new Error('Background notification actions are unavailable.');

      const time = parseReminderTime(habit.reminderTime);
      if (!time || !(await ensurePermissionsAsync(requestPermissions))) {
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

      const scheduled = await nativeReads.read('scheduled', () => notifications.getAllScheduledNotificationsAsync());
      const existingByDate = new Map<string, string>();
      for (const request of scheduled) {
        const data = request.content.data;
        if (data?.type === 'habit_reminder' && data.habitId === habit.id && typeof data.dateKey === 'string') {
          existingByDate.set(data.dateKey, request.identifier);
        }
      }
      const results = await Promise.allSettled(
        reminderDates.map((reminderDate) => {
          const existingId = existingByDate.get(toDateKey(reminderDate));
          return existingId ? Promise.resolve(existingId) : notifications.scheduleNotificationAsync({
            identifier: `habit_reminder_${habit.id}_${toDateKey(reminderDate)}`,
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
          });
        })
      );
      const failure = results.find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
      const first = results[0];
      return first?.status === 'fulfilled' ? first.value : undefined;
    } catch (error) {
      if (throwOnError) throw error;
      return undefined;
    }
  },

  async scheduleHabitSnoozeReminderAsync({
    dateKey,
    habit,
    language = 'en',
    sourceNotificationId,
    requestedAt = Date.now(),
  }: {
    habit: Habit;
    language?: UserLanguagePreference;
    dateKey?: string;
    sourceNotificationId?: string;
    requestedAt?: number;
  }): Promise<string | undefined> {
    try {
      const notifications = await getNotificationsModuleAsync();
      if (!notifications) return undefined;
      if (!(await ensureActionTaskAsync())) return undefined;
      const identifier = sourceNotificationId ? `snooze_${sourceNotificationId}` : undefined;
      if (identifier) {
        const scheduled = await nativeReads.read('scheduled', () => notifications.getAllScheduledNotificationsAsync());
        if (scheduled.some((notification) => notification.identifier === identifier)) return identifier;
        const presented = await notifications.getPresentedNotificationsAsync();
        if (presented.some((notification) => notification.request.identifier === identifier)) return identifier;
      }
      if (!(await ensurePermissionsAsync(false))) {
        return undefined;
      }

      await configureAndroidReminderChannelAsync(notifications);
      await configureHabitReminderCategoryAsync(notifications, language);

      return notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: 'Done Loop',
          body: translations[language].notifications.habitBody.replace('{{habitName}}', habit.name),
          categoryIdentifier: habitReminderCategoryId,
          data: getHabitNotificationData(habit.id, language, dateKey ?? toDateKey(new Date())),
        },
        trigger: sourceNotificationId ? {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(requestedAt + 30 * 60 * 1000),
          channelId: androidReminderChannelId,
        } : {
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
  nativeReads.invalidate();
  channelConfiguration = null;
  categoryLanguage = null;
  categoryConfiguration = Promise.resolve();
  actionProcessor.reset();
  notificationsModuleLoader = () => import('expo-notifications');
  notificationsModulePromise = null;
  notificationResponseSubscription?.remove();
  notificationResponseSubscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
}
