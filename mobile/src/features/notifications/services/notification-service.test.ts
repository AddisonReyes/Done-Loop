import * as Notifications from 'expo-notifications';

import { NotificationService } from './notification-service';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    DATE: 'date',
  },
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mockedNotifications = jest.mocked(Notifications);

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not schedule todo reminders without a due date', async () => {
    await expect(NotificationService.scheduleTodoReminderAsync({ title: 'Pay rent' })).resolves.toBeUndefined();
    expect(mockedNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not schedule todo reminders for past dates', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ granted: true } as Notifications.NotificationPermissionsStatus);

    await expect(
      NotificationService.scheduleTodoReminderAsync({ title: 'Old', dueAt: '2000-01-01' })
    ).resolves.toBeUndefined();
    expect(mockedNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules habit reminders only when permissions and time are valid', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ granted: true } as Notifications.NotificationPermissionsStatus);
    mockedNotifications.scheduleNotificationAsync.mockResolvedValue('notification-id');

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habitId: 'habit_1',
        habitName: 'Read',
        reminderTime: '08:15',
      })
    ).resolves.toBe('notification-id');

    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 8, minute: 15 }),
      })
    );
  });

  it('requests permissions at the point of need', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({ granted: false } as Notifications.NotificationPermissionsStatus);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({ granted: false } as Notifications.NotificationPermissionsStatus);

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habitId: 'habit_1',
        habitName: 'Read',
        reminderTime: '08:15',
      })
    ).resolves.toBeUndefined();

    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockedNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

