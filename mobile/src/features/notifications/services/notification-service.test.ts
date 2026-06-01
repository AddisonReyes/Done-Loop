import {
  NotificationService,
  resetNotificationModuleLoaderForTests,
  setNotificationModuleLoaderForTests,
} from './notification-service';

type NotificationsModule = typeof import('expo-notifications');

function createNotificationsModule(): NotificationsModule {
  return {
    SchedulableTriggerInputTypes: {
      DAILY: 'daily',
      DATE: 'date',
    },
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
  } as unknown as NotificationsModule;
}

describe('NotificationService', () => {
  let notifications: NotificationsModule;

  beforeEach(() => {
    jest.clearAllMocks();
    notifications = createNotificationsModule();
    setNotificationModuleLoaderForTests(async () => notifications);
  });

  afterEach(() => {
    resetNotificationModuleLoaderForTests();
  });

  it('does not schedule todo reminders without a due date', async () => {
    await expect(NotificationService.scheduleTodoReminderAsync({ title: 'Pay rent' })).resolves.toBeUndefined();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not crash or schedule when notifications are unavailable', async () => {
    setNotificationModuleLoaderForTests(async () => null);

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habitId: 'habit_1',
        habitName: 'Read',
        reminderTime: '08:15',
      })
    ).resolves.toBeUndefined();
    await expect(NotificationService.requestPermissionsAsync()).resolves.toBe(false);
    await expect(NotificationService.cancelAllAsync()).resolves.toBeUndefined();
  });

  it('does not schedule todo reminders for past dates', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);

    await expect(
      NotificationService.scheduleTodoReminderAsync({ title: 'Old', dueAt: '2000-01-01' })
    ).resolves.toBeUndefined();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules habit reminders only when permissions and time are valid', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.scheduleNotificationAsync).mockResolvedValue('notification-id');

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habitId: 'habit_1',
        habitName: 'Read',
        reminderTime: '08:15',
      })
    ).resolves.toBe('notification-id');

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 8, minute: 15 }),
      })
    );
  });

  it('requests permissions at the point of need', async () => {
    jest.mocked(notifications.getPermissionsAsync).mockResolvedValue({ granted: false } as Awaited<
      ReturnType<NotificationsModule['getPermissionsAsync']>
    >);
    jest.mocked(notifications.requestPermissionsAsync).mockResolvedValue({ granted: false } as Awaited<
      ReturnType<NotificationsModule['requestPermissionsAsync']>
    >);

    await expect(
      NotificationService.scheduleHabitReminderAsync({
        habitId: 'habit_1',
        habitName: 'Read',
        reminderTime: '08:15',
      })
    ).resolves.toBeUndefined();

    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('configures foreground notification presentation when available', async () => {
    await expect(NotificationService.configureForegroundHandlingAsync()).resolves.toBe(true);

    expect(notifications.setNotificationHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    });
  });
});
