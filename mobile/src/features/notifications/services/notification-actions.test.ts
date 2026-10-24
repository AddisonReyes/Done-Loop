import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HabitCompletionRepository, HabitRepository } from '@/features/habits/repositories';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { getDatabaseAsync } from '@/storage/database/client';
import { runMigrationsAsync } from '@/storage/migrations';
import { createSqliteTestDatabase } from '@/test/sqlite-test-database';
import { createNotificationActionProcessor, parseHabitNotificationAction, type NotificationActionGateway } from './notification-actions';

jest.mock('@/storage/database/client', () => ({ getDatabaseAsync: jest.fn() }));

function response(actionIdentifier = 'mark_habit_complete', id = 'original') {
  return { actionIdentifier, notification: { date: new Date(2026, 5, 2, 8).getTime(), request: {
    identifier: id, content: { data: { type: 'habit_reminder', habitId: 'habit_1', dateKey: '2026-06-02' } },
  } } };
}

describe('notification actions with real SQLite', () => {
  const { database, sqlite } = createSqliteTestDatabase();
  const dismiss = jest.fn<(id: string) => Promise<void>>();
  const refresh = jest.fn<NotificationActionGateway['refresh']>();
  const snooze = jest.fn<NotificationActionGateway['snooze']>();
  let processor = createNotificationActionProcessor({ dismiss, refresh, snooze });

  beforeAll(async () => {
    jest.mocked(getDatabaseAsync).mockResolvedValue(database);
    await runMigrationsAsync(database);
  });
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 3, 12));
    jest.clearAllMocks();
    dismiss.mockResolvedValue(undefined);
    refresh.mockResolvedValue(undefined);
    snooze.mockResolvedValue('snooze_original');
    processor = createNotificationActionProcessor({ dismiss, refresh, snooze });
    await database.execAsync('DELETE FROM habit_completions; DELETE FROM habits;');
    await SettingsRepository.update({ notificationsEnabled: true });
    const habit = await HabitRepository.create({ name: 'Read', recurrenceType: 'daily',
      startDate: '2026-06-01', remindersEnabled: true, reminderTime: '08:15' });
    await database.runAsync('UPDATE habits SET id = ? WHERE id = ?;', 'habit_1', habit.id);
  });
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });
  afterAll(async () => { await database.closeAsync(); });

  it('persists the original day before dismissing and leaves other days unchanged', async () => {
    dismiss.mockImplementation(async () => {
      expect(await HabitCompletionRepository.findByHabitAndDate('habit_1', '2026-06-02'))
        .toMatchObject({ completed: true });
    });
    await expect(processor.process(response())).resolves.toBe('handled');
    expect(await HabitCompletionRepository.findByHabitAndDate('habit_1', '2026-06-03')).toBeNull();
    expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ id: 'habit_1' }),
      expect.objectContaining({ dateKey: '2026-06-02' }), true);
  });

  it('shares concurrent deliveries and never toggles an already completed day off', async () => {
    let release!: () => void;
    refresh.mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }));
    const first = processor.process(response());
    expect(processor.process(response())).toBe(first);
    for (let index = 0; index < 30 && !release; index++) await Promise.resolve();
    release();
    await first;
    await processor.process(response());
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM habit_completions').get()).toEqual({ count: 1 });
    await processor.process(response('mark_habit_complete', 'another'));
    expect(await HabitCompletionRepository.findByHabitAndDate('habit_1', '2026-06-02'))
      .toMatchObject({ completed: true });
  });

  it('retains the notification on a SQLite failure and recovers its queue on retry', async () => {
    jest.spyOn(HabitCompletionRepository, 'upsert').mockRejectedValueOnce(new Error('database busy'));
    await expect(processor.process(response())).rejects.toThrow('database busy');
    expect(dismiss).not.toHaveBeenCalled();
    await expect(processor.process(response())).resolves.toBe('handled');
    expect(dismiss).toHaveBeenCalledWith('original');
  });

  it('keeps a failed scheduling action retryable without undoing the saved completion', async () => {
    refresh.mockRejectedValueOnce(new Error('scheduler unavailable'));
    await expect(processor.process(response())).rejects.toThrow('scheduler unavailable');
    expect(dismiss).not.toHaveBeenCalled();
    await expect(processor.process(response())).resolves.toBe('handled');
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM habit_completions').get()).toEqual({ count: 1 });
  });

  it('schedules snooze before dismissal using the interaction time, preserving the original day', async () => {
    const requestedAt = Date.now();
    await processor.process(response('remind_habit_in_30_minutes'));
    expect(snooze).toHaveBeenCalledWith(expect.objectContaining({ id: 'habit_1' }),
      expect.objectContaining({ notificationId: 'original', dateKey: '2026-06-02' }), requestedAt);
    expect(snooze.mock.invocationCallOrder[0]).toBeLessThan(dismiss.mock.invocationCallOrder[0]);
    expect(await HabitCompletionRepository.findByHabitAndDate('habit_1', '2026-06-02')).toBeNull();
    expect(await HabitRepository.findById('habit_1')).toMatchObject({ notificationId: 'snooze_original' });
  });

  it('does not dismiss when snooze scheduling fails, and allows retry', async () => {
    snooze.mockResolvedValueOnce(undefined);
    await expect(processor.process(response('remind_habit_in_30_minutes'))).rejects.toThrow('postpone');
    expect(dismiss).not.toHaveBeenCalled();
    await expect(processor.process(response('remind_habit_in_30_minutes'))).resolves.toBe('handled');
  });

  it('does not snooze completed habits or when reminders have been disabled', async () => {
    await HabitCompletionRepository.upsert({ habitId: 'habit_1', date: '2026-06-02', completed: true });
    await processor.process(response('remind_habit_in_30_minutes'));
    await SettingsRepository.update({ notificationsEnabled: false });
    await processor.process(response('remind_habit_in_30_minutes', 'disabled'));
    expect(snooze).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledTimes(2);
  });

  it('ignores nonexistent and deleted habits, including old notifications', async () => {
    await HabitRepository.deleteById('habit_1', '2026-06-03');
    await expect(processor.process(response())).resolves.toBe('ignored');
    await database.execAsync('DELETE FROM habits;');
    await expect(processor.process(response())).resolves.toBe('ignored');
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('serializes different actions so a queued snooze observes completion', async () => {
    await Promise.all([processor.process(response()), processor.process(response('remind_habit_in_30_minutes'))]);
    expect(snooze).not.toHaveBeenCalled();
  });

  it('accepts Android headless dataString and rejects malformed, invalid date, or normal taps', () => {
    const original = response();
    const content = { dataString: JSON.stringify(original.notification.request.content.data) };
    expect(parseHabitNotificationAction({ ...original, notification: { ...original.notification,
      request: { ...original.notification.request, content } } })).toMatchObject({ dateKey: '2026-06-02' });
    for (const invalid of [null, {}, response('expo.modules.notifications.actions.DEFAULT'),
      { ...original, actionIdentifier: 1 }, { ...original, notification: { request: { identifier: 'x',
        content: { data: { ...original.notification.request.content.data, dateKey: '2026-02-31' } } } } }]) {
      expect(parseHabitNotificationAction(invalid)).toBeNull();
    }
  });
});
