import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { getHabitsDueOnDate } from '@/features/habits/services/habit-recurrence';
import type { Habit } from '@/features/habits/types';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserLanguagePreference } from '@/features/settings/types';
import { emitAppEvent } from '@/shared/events/app-events';
import { isDateKey, toDateKey } from '@/shared/utils/date';

export const habitReminderCategoryId = 'habit_reminder_background_v1';
export const markHabitCompleteActionId = 'mark_habit_complete';
export const remindHabitIn30MinutesActionId = 'remind_habit_in_30_minutes';

type NotificationData = Record<string, unknown>;

export type HabitNotificationAction = {
  actionIdentifier: typeof markHabitCompleteActionId | typeof remindHabitIn30MinutesActionId;
  notificationId: string;
  habitId: string;
  dateKey: string;
  language: UserLanguagePreference;
};

export type NotificationActionGateway = {
  dismiss: (notificationId: string) => Promise<void>;
  refresh: (habit: Habit, action: HabitNotificationAction, enabled: boolean) => Promise<void>;
  snooze: (habit: Habit, action: HabitNotificationAction, requestedAt: number) => Promise<string | undefined>;
};

export type NotificationActionResult = 'handled' | 'ignored';

function isRecord(value: unknown): value is NotificationData {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readNotificationResponse(value: unknown): {
  notificationId: string;
  actionIdentifier: string | undefined;
  data: NotificationData;
  date: unknown;
} | null {
  if (!isRecord(value) || !isRecord(value.notification) || !isRecord(value.notification.request)) return null;
  const request = value.notification.request;
  if (typeof request.identifier !== 'string' || !request.identifier.trim() || !isRecord(request.content)) return null;
  if (value.actionIdentifier !== undefined && typeof value.actionIdentifier !== 'string') return null;

  let data: unknown = request.content.data;
  if (!isRecord(data) && typeof request.content.dataString === 'string') {
    try {
      data = JSON.parse(request.content.dataString);
    } catch {
      return null;
    }
  }
  if (!isRecord(data)) return null;
  return { notificationId: request.identifier, actionIdentifier: value.actionIdentifier, data, date: value.notification.date };
}

export function parseHabitNotificationAction(value: unknown): HabitNotificationAction | null {
  const response = readNotificationResponse(value);
  if (!response || response.data.type !== 'habit_reminder' ||
    (response.actionIdentifier !== markHabitCompleteActionId && response.actionIdentifier !== remindHabitIn30MinutesActionId) ||
    typeof response.data.habitId !== 'string' || !response.data.habitId.trim()) return null;

  let dateKey = response.data.dateKey;
  // Older delivered reminders may not include a date key. Never substitute today's date.
  if (dateKey === undefined && (typeof response.date === 'number' || typeof response.date === 'string')) {
    const deliveredAt = new Date(response.date);
    if (Number.isFinite(deliveredAt.getTime())) dateKey = toDateKey(deliveredAt);
  }
  if (typeof dateKey !== 'string' || !isDateKey(dateKey)) return null;

  return {
    actionIdentifier: response.actionIdentifier,
    notificationId: response.notificationId,
    habitId: response.data.habitId,
    dateKey,
    language: response.data.language === 'es' ? 'es' : 'en',
  };
}

export function createNotificationActionProcessor(gateway: NotificationActionGateway) {
  let tail: Promise<unknown> = Promise.resolve();
  const pending = new Map<string, Promise<NotificationActionResult>>();
  const handled = new Set<string>();

  async function execute(action: HabitNotificationAction, requestedAt: number): Promise<NotificationActionResult> {
    const habit = await HabitRepository.findById(action.habitId);
    if (!habit || habit.deletedAt || getHabitsDueOnDate([habit], action.dateKey).length === 0) return 'ignored';

    const completed = await HabitCompletionRepository.findByHabitAndDate(habit.id, action.dateKey);
    if (action.actionIdentifier === markHabitCompleteActionId) {
      if (!completed?.completed) {
        await HabitCompletionRepository.upsert({ habitId: habit.id, date: action.dateKey, completed: true });
      }
      emitAppEvent('habitsChanged');
      const settings = await SettingsRepository.get();
      await gateway.refresh(habit, action, settings.notificationsEnabled && habit.remindersEnabled);
      await gateway.dismiss(action.notificationId);
      return 'handled';
    }

    const settings = await SettingsRepository.get();
    if (completed?.completed || !settings.notificationsEnabled || !habit.remindersEnabled) {
      if (!completed?.completed) await HabitRepository.update(habit.id, { notificationId: undefined });
      await gateway.dismiss(action.notificationId);
      return 'handled';
    }
    const snoozeId = await gateway.snooze(habit, action, requestedAt);
    if (!snoozeId) throw new Error('Could not postpone the habit reminder.');
    await HabitRepository.update(habit.id, { notificationId: snoozeId });
    await gateway.dismiss(action.notificationId);
    return 'handled';
  }

  return {
    process(value: unknown): Promise<NotificationActionResult> {
      const action = parseHabitNotificationAction(value);
      if (!action) return Promise.resolve('ignored');
      const key = JSON.stringify([action.notificationId, action.actionIdentifier]);
      if (handled.has(key)) return Promise.resolve('handled');
      const existing = pending.get(key);
      if (existing) return existing;
      const requestedAt = Date.now();
      const operation = tail.then(() => execute(action, requestedAt)).then((result) => {
        if (result === 'handled') {
          handled.add(key);
          if (handled.size > 512) {
            const oldest = handled.values().next().value;
            if (oldest !== undefined) handled.delete(oldest);
          }
        }
        return result;
      }).finally(() => { pending.delete(key); });
      pending.set(key, operation);
      tail = operation.catch(() => undefined);
      return operation;
    },
    runExclusive<T>(work: () => Promise<T>): Promise<T> {
      const operation = tail.then(work);
      tail = operation.catch(() => undefined);
      return operation;
    },
    reset(): void { pending.clear(); handled.clear(); tail = Promise.resolve(); },
  };
}
