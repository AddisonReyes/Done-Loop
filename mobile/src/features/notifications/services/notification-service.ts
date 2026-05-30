import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { UserLanguagePreference } from '@/features/settings/types';
import { translations } from '@/i18n/translations';

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

async function ensurePermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseReminderTime(reminderTime?: string): { hour: number; minute: number } | null {
  if (!reminderTime) {
    return null;
  }

  const [hour, minute] = reminderTime.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return { hour, minute };
}

export const NotificationService = {
  async requestPermissionsAsync(): Promise<boolean> {
    return ensurePermissionsAsync();
  },

  async scheduleHabitReminderAsync({
    habitName,
    language = 'en',
    reminderTime,
  }: ScheduleHabitReminderInput): Promise<string | undefined> {
    const time = parseReminderTime(reminderTime);
    if (!time || !(await ensurePermissionsAsync())) {
      return undefined;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Done Loop',
        body: translations[language].notifications.habitBody.replace('{{habitName}}', habitName),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
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
    if (!dueAt || !(await ensurePermissionsAsync())) {
      return undefined;
    }

    const dueDate = new Date(dueAt);
    if (Number.isNaN(dueDate.getTime()) || dueDate.getTime() <= Date.now()) {
      return undefined;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: translations[language].notifications.todoTitle,
        body: title,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
      },
    });
  },

  async cancelAsync(notificationId?: string): Promise<void> {
    if (!notificationId || Platform.OS === 'web') {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
