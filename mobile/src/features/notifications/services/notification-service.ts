import Constants, { AppOwnership } from 'expo-constants';

import type { UserLanguagePreference } from '@/features/settings/types';
import { translations } from '@/i18n/translations';
import { dateKeyToLocalDate } from '@/shared/utils/date';
import { parseReminderTime } from './reminder-time';

type NotificationsModule = typeof import('expo-notifications');
type NotificationsModuleLoader = () => Promise<NotificationsModule | null>;

type ScheduleHabitReminderInput = {
  habitId: string;
  habitName: string;
  reminderTime?: string;
  language?: UserLanguagePreference;
};

type ScheduleTodoReminderInput = {
  title: string;
  dueAt?: string;
  language?: UserLanguagePreference;
};

let notificationsModuleLoader: NotificationsModuleLoader = () => import('expo-notifications');
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

async function getNotificationsModuleAsync(): Promise<NotificationsModule | null> {
  if (Constants.appOwnership === AppOwnership.Expo) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = notificationsModuleLoader().catch(() => null);
  }

  return notificationsModulePromise;
}

async function ensurePermissionsAsync(): Promise<boolean> {
  const notifications = await getNotificationsModuleAsync();
  if (!notifications) {
    return false;
  }

  const existing = await notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await notifications.requestPermissionsAsync();
  return requested.granted;
}

export const NotificationService = {
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

    return true;
  },

  async requestPermissionsAsync(): Promise<boolean> {
    return ensurePermissionsAsync();
  },

  async scheduleHabitReminderAsync({
    habitName,
    language = 'en',
    reminderTime,
  }: ScheduleHabitReminderInput): Promise<string | undefined> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return undefined;
    }

    const time = parseReminderTime(reminderTime);
    if (!time || !(await ensurePermissionsAsync())) {
      return undefined;
    }

    return notifications.scheduleNotificationAsync({
      content: {
        title: 'Done Loop',
        body: translations[language].notifications.habitBody.replace('{{habitName}}', habitName),
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
  },

  async scheduleTodoReminderAsync({
    title,
    dueAt,
    language = 'en',
  }: ScheduleTodoReminderInput): Promise<string | undefined> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications || !dueAt || !(await ensurePermissionsAsync())) {
      return undefined;
    }

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
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
      },
    });
  },

  async cancelAsync(notificationId?: string): Promise<void> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications || !notificationId) {
      return;
    }

    await notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async cancelAllAsync(): Promise<void> {
    const notifications = await getNotificationsModuleAsync();
    if (!notifications) {
      return;
    }

    await notifications.cancelAllScheduledNotificationsAsync();
  },
};

export function setNotificationModuleLoaderForTests(loader: NotificationsModuleLoader): void {
  notificationsModuleLoader = loader;
  notificationsModulePromise = null;
}

export function resetNotificationModuleLoaderForTests(): void {
  notificationsModuleLoader = () => import('expo-notifications');
  notificationsModulePromise = null;
}
