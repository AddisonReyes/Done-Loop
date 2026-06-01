import { HabitRepository } from '@/features/habits/repositories';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { TodoRepository } from '@/features/todos/repositories';

import { SettingsRepository } from '../repositories/settings-repository';
import type { UserSettings } from '../types';
import { setNotificationsEnabledPreferenceAsync } from './notification-settings';

jest.mock('@/features/habits/repositories', () => ({
  HabitRepository: {
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/todos/repositories', () => ({
  TodoRepository: {
    listActive: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: {
    cancelAllAsync: jest.fn(),
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
  accentColor: 'purple',
  dateFormat: 'dmy',
  language: 'en',
  notificationsEnabled: true,
  privacyPolicyUrl: 'https://done-loop.pages.dev/privacy',
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
    jest.mocked(HabitRepository.listActive).mockResolvedValue([]);
    jest.mocked(TodoRepository.listActive).mockResolvedValue([]);
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
      expect.objectContaining({ habitId: 'habit_1', language: 'en' })
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
