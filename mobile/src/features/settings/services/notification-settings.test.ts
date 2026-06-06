import { HabitRepository } from '@/features/habits/repositories';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { TodoRepository } from '@/features/todos/repositories';

import { SettingsRepository } from '../repositories/settings-repository';
import type { UserSettings } from '../types';
import { reconcileExistingRemindersAsync, setNotificationsEnabledPreferenceAsync } from './notification-settings';

jest.mock('@/features/habits/repositories', () => ({
  HabitRepository: {
    clearAllNotificationIds: jest.fn(),
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/todos/repositories', () => ({
  TodoRepository: {
    clearAllNotificationIds: jest.fn(),
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: {
    cancelAllAsync: jest.fn(),
    cancelHabitRemindersAsync: jest.fn(),
    getHabitReminderScheduledOccurrenceTarget: jest.fn(),
    getScheduledHabitReminderCountsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleHabitReminderAsync: jest.fn(),
    scheduleTodoReminderAsync: jest.fn(),
  },
}));

jest.mock('../repositories/settings-repository', () => ({
  SettingsRepository: {
    update: jest.fn(),
  },
}));

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

const disabledSettings: UserSettings = {
  ...enabledSettings,
  notificationsEnabled: false,
};

describe('setNotificationsEnabledPreferenceAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(HabitRepository.clearAllNotificationIds).mockResolvedValue(0);
    jest.mocked(HabitRepository.listActive).mockResolvedValue([]);
    jest.mocked(TodoRepository.clearAllNotificationIds).mockResolvedValue(0);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([]);
    jest.mocked(NotificationService.cancelHabitRemindersAsync).mockResolvedValue(undefined);
    jest.mocked(NotificationService.getHabitReminderScheduledOccurrenceTarget).mockReturnValue(14);
    jest.mocked(NotificationService.getScheduledHabitReminderCountsAsync).mockResolvedValue(new Map());
    jest.mocked(SettingsRepository.update).mockImplementation(async (input) => ({
      ...enabledSettings,
      ...input,
    }));
  });

  it('reschedules existing eligible reminders when notifications are enabled', async () => {
    jest.mocked(NotificationService.requestPermissionsAsync).mockResolvedValue(true);
    jest.mocked(NotificationService.scheduleHabitReminderAsync).mockResolvedValue('habit-notification');
    jest.mocked(NotificationService.scheduleTodoReminderAsync).mockResolvedValue('todo-notification');
    jest.mocked(HabitRepository.listActive).mockResolvedValue([
      {
        id: 'habit_1',
        name: 'Read',
        recurrenceType: 'daily',
        reminderTime: '08:15',
        remindersEnabled: true,
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
      {
        id: 'habit_2',
        name: 'Walk',
        recurrenceType: 'daily',
        remindersEnabled: false,
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([
      {
        id: 'todo_1',
        title: 'Pay rent',
        priority: 1,
        status: 'pending',
        dueAt: '2099-01-01',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
      {
        id: 'todo_2',
        title: 'Done already',
        priority: 2,
        status: 'completed',
        completedAt: '2026-05-31T00:00:00.000Z',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-31T00:00:00.000Z',
      },
    ]);

    await expect(setNotificationsEnabledPreferenceAsync(true, 'en')).resolves.toMatchObject({
      notificationsEnabled: true,
    });

    expect(NotificationService.cancelAllAsync).toHaveBeenCalledTimes(1);
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith(
      expect.objectContaining({ habit: expect.objectContaining({ id: 'habit_1' }), language: 'en' })
    );
    expect(NotificationService.scheduleTodoReminderAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pay rent', language: 'en' })
    );
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_1', {
      notificationId: 'habit-notification',
    });
    expect(TodoRepository.update).toHaveBeenCalledWith('todo_1', {
      notificationId: 'todo-notification',
    });
    expect(SettingsRepository.update).toHaveBeenCalledWith({ notificationsEnabled: true });
  });

  it('cancels all notifications and disables the preference when turned off', async () => {
    jest.mocked(SettingsRepository.update).mockResolvedValue(disabledSettings);

    await expect(setNotificationsEnabledPreferenceAsync(false, 'en')).resolves.toEqual(disabledSettings);

    expect(NotificationService.cancelAllAsync).toHaveBeenCalledTimes(1);
    expect(HabitRepository.clearAllNotificationIds).toHaveBeenCalledTimes(1);
    expect(TodoRepository.clearAllNotificationIds).toHaveBeenCalledTimes(1);
    expect(NotificationService.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(SettingsRepository.update).toHaveBeenCalledWith({ notificationsEnabled: false });
  });

  it('leaves notifications disabled when permission is denied', async () => {
    jest.mocked(NotificationService.requestPermissionsAsync).mockResolvedValue(false);
    jest.mocked(SettingsRepository.update).mockResolvedValue(disabledSettings);

    await expect(setNotificationsEnabledPreferenceAsync(true, 'en')).resolves.toEqual(disabledSettings);

    expect(NotificationService.cancelAllAsync).not.toHaveBeenCalled();
    expect(HabitRepository.listActive).not.toHaveBeenCalled();
    expect(TodoRepository.listActive).not.toHaveBeenCalled();
    expect(SettingsRepository.update).toHaveBeenCalledWith({ notificationsEnabled: false });
  });
});

describe('reconcileExistingRemindersAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NotificationService.cancelHabitRemindersAsync).mockResolvedValue(undefined);
    jest.mocked(NotificationService.getHabitReminderScheduledOccurrenceTarget).mockReturnValue(14);
    jest.mocked(NotificationService.getScheduledHabitReminderCountsAsync).mockResolvedValue(new Map([['habit_fresh', 14]]));
    jest.mocked(NotificationService.scheduleHabitReminderAsync).mockResolvedValue('next-habit-notification');
    jest.mocked(NotificationService.scheduleTodoReminderAsync).mockResolvedValue('next-todo-notification');
    jest.mocked(HabitRepository.update).mockResolvedValue(null);
    jest.mocked(TodoRepository.update).mockResolvedValue(null);
  });

  it('only reconciles stale or missing reminders without clearing everything', async () => {
    jest.mocked(HabitRepository.listActive).mockResolvedValue([
      {
        id: 'habit_fresh',
        name: 'Fresh',
        recurrenceType: 'daily',
        reminderTime: '08:15',
        remindersEnabled: true,
        notificationId: 'existing-id',
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
      {
        id: 'habit_stale',
        name: 'Stale',
        recurrenceType: 'daily',
        reminderTime: '08:15',
        remindersEnabled: true,
        notificationId: 'stale-id',
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([
      {
        id: 'todo_missing',
        title: 'Pay rent',
        priority: 1,
        status: 'pending',
        dueAt: '2099-01-01',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
      {
        id: 'todo_existing',
        title: 'Already scheduled',
        priority: 2,
        status: 'pending',
        dueAt: '2099-01-02',
        notificationId: 'todo-id',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);

    await expect(reconcileExistingRemindersAsync('en')).resolves.toBeUndefined();

    expect(NotificationService.cancelAllAsync).not.toHaveBeenCalled();
    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledTimes(1);
    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledWith('habit_stale', 'stale-id');
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith(
      expect.objectContaining({ habit: expect.objectContaining({ id: 'habit_stale' }), language: 'en' })
    );
    expect(NotificationService.scheduleTodoReminderAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pay rent', language: 'en' })
    );
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_stale', {
      notificationId: 'next-habit-notification',
    });
    expect(TodoRepository.update).toHaveBeenCalledWith('todo_missing', {
      notificationId: 'next-todo-notification',
    });
  });

  it('does not schedule disabled habit reminders or completed todos during reconciliation', async () => {
    jest.mocked(HabitRepository.listActive).mockResolvedValue([
      {
        id: 'habit_disabled',
        name: 'Disabled',
        recurrenceType: 'daily',
        reminderTime: '08:15',
        remindersEnabled: false,
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([
      {
        id: 'todo_completed',
        title: 'Already done',
        priority: 2,
        status: 'completed',
        dueAt: '2099-01-02',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);

    await expect(reconcileExistingRemindersAsync('en')).resolves.toBeUndefined();

    expect(NotificationService.cancelHabitRemindersAsync).not.toHaveBeenCalled();
    expect(NotificationService.scheduleHabitReminderAsync).not.toHaveBeenCalled();
    expect(NotificationService.scheduleTodoReminderAsync).not.toHaveBeenCalled();
    expect(HabitRepository.update).not.toHaveBeenCalled();
    expect(TodoRepository.update).not.toHaveBeenCalled();
  });

  it('refreshes habits whose stored notification id exists but scheduled occurrence count is short', async () => {
    jest.mocked(NotificationService.getScheduledHabitReminderCountsAsync).mockResolvedValue(new Map([['habit_short', 2]]));
    jest.mocked(HabitRepository.listActive).mockResolvedValue([
      {
        id: 'habit_short',
        name: 'Short',
        recurrenceType: 'daily',
        reminderTime: '08:15',
        remindersEnabled: true,
        notificationId: 'existing-id',
        isActive: true,
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
      },
    ]);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([]);

    await expect(reconcileExistingRemindersAsync('es')).resolves.toBeUndefined();

    expect(NotificationService.cancelHabitRemindersAsync).toHaveBeenCalledWith('habit_short', 'existing-id');
    expect(NotificationService.scheduleHabitReminderAsync).toHaveBeenCalledWith(
      expect.objectContaining({ habit: expect.objectContaining({ id: 'habit_short' }), language: 'es' })
    );
    expect(HabitRepository.update).toHaveBeenCalledWith('habit_short', {
      notificationId: 'next-habit-notification',
    });
  });
});
