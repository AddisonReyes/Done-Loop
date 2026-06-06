import { HabitRepository } from '@/features/habits/repositories';
import { NotificationService } from '@/features/notifications/services/notification-service';
import type { UserLanguagePreference, UserSettings } from '@/features/settings/types';
import { TodoRepository } from '@/features/todos/repositories';

import { SettingsRepository } from '../repositories/settings-repository';

export async function rescheduleExistingRemindersAsync(language: UserLanguagePreference): Promise<void> {
  await NotificationService.cancelAllAsync();

  const [habits, todos] = await Promise.all([
    HabitRepository.listActive(),
    TodoRepository.listActive(),
  ]);

  await Promise.all([
    ...habits
      .filter((habit) => habit.remindersEnabled)
      .map(async (habit) => {
        const notificationId = await NotificationService.scheduleHabitReminderAsync({
          habit,
          language,
        });
        await HabitRepository.update(habit.id, { notificationId });
      }),
    ...todos
      .filter((todo) => todo.status === 'pending')
      .map(async (todo) => {
        const notificationId = await NotificationService.scheduleTodoReminderAsync({
          title: todo.title,
          dueAt: todo.dueAt,
          language,
        });
        await TodoRepository.update(todo.id, { notificationId });
      }),
  ]);
}

export async function reconcileExistingRemindersAsync(language: UserLanguagePreference): Promise<void> {
  const [habits, todos, scheduledHabitReminderCounts] = await Promise.all([
    HabitRepository.listActive(),
    TodoRepository.listActive(),
    NotificationService.getScheduledHabitReminderCountsAsync(),
  ]);
  const targetHabitReminderCount = NotificationService.getHabitReminderScheduledOccurrenceTarget();

  await Promise.all([
    ...habits
      .filter((habit) => habit.remindersEnabled)
      .map(async (habit) => {
        const scheduledCount = scheduledHabitReminderCounts.get(habit.id) ?? 0;

        if (habit.notificationId && scheduledCount >= targetHabitReminderCount) {
          return;
        }

        await NotificationService.cancelHabitRemindersAsync(habit.id, habit.notificationId);
        const notificationId = await NotificationService.scheduleHabitReminderAsync({
          habit,
          language,
        });
        await HabitRepository.update(habit.id, { notificationId });
      }),
    ...todos
      .filter((todo) => todo.status === 'pending' && !todo.notificationId)
      .map(async (todo) => {
        const notificationId = await NotificationService.scheduleTodoReminderAsync({
          title: todo.title,
          dueAt: todo.dueAt,
          language,
        });
        await TodoRepository.update(todo.id, { notificationId });
      }),
  ]);
}

export async function setNotificationsEnabledPreferenceAsync(
  enabled: boolean,
  language: UserLanguagePreference
): Promise<UserSettings> {
  const granted = enabled ? await NotificationService.requestPermissionsAsync() : false;

  if (!enabled) {
    await NotificationService.cancelAllAsync();
    await Promise.all([
      HabitRepository.clearAllNotificationIds(),
      TodoRepository.clearAllNotificationIds(),
    ]);
    return SettingsRepository.update({ notificationsEnabled: false });
  }

  if (!granted) {
    return SettingsRepository.update({ notificationsEnabled: false });
  }

  await rescheduleExistingRemindersAsync(language);
  return SettingsRepository.update({ notificationsEnabled: true });
}
