import { HabitRepository } from '@/features/habits/repositories';
import { NotificationService } from '@/features/notifications/services/notification-service';
import type { UserLanguagePreference, UserSettings } from '@/features/settings/types';
import { TodoRepository } from '@/features/todos/repositories';

import { SettingsRepository } from '../repositories/settings-repository';

async function rescheduleExistingRemindersAsync(language: UserLanguagePreference): Promise<void> {
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
          habitId: habit.id,
          habitName: habit.name,
          reminderTime: habit.reminderTime,
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

export async function setNotificationsEnabledPreferenceAsync(
  enabled: boolean,
  language: UserLanguagePreference
): Promise<UserSettings> {
  const granted = enabled ? await NotificationService.requestPermissionsAsync() : false;

  if (!enabled) {
    await NotificationService.cancelAllAsync();
    return SettingsRepository.update({ notificationsEnabled: false });
  }

  if (!granted) {
    return SettingsRepository.update({ notificationsEnabled: false });
  }

  await rescheduleExistingRemindersAsync(language);
  return SettingsRepository.update({ notificationsEnabled: true });
}
