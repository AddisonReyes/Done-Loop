import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { handleNotificationActionAsync } from '../services/notification-service';

const mockRegisterTask = jest.fn<(name: string) => Promise<void>>();

jest.mock('expo', () => ({ isRunningInExpoGo: jest.fn(), requireOptionalNativeModule: jest.fn() }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn(), isTaskDefined: jest.fn(),
  isAvailableAsync: jest.fn(), isTaskRegisteredAsync: jest.fn() }));
jest.mock('../services/notification-service', () => ({
  getNotificationsModuleAsync: jest.fn(async () => ({ registerTaskAsync: mockRegisterTask })),
  handleNotificationActionAsync: jest.fn(),
}));

function loadTask() {
  let task!: typeof import('./notification-action-task');
  jest.isolateModules(() => { task = require('./notification-action-task'); });
  return task;
}

describe('headless notification task', () => {
  const registerTask = mockRegisterTask;
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    jest.mocked(isRunningInExpoGo).mockReturnValue(false);
    jest.mocked(requireOptionalNativeModule).mockReturnValue({});
    jest.mocked(TaskManager.isTaskDefined).mockReturnValue(false);
    jest.mocked(TaskManager.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(TaskManager.isTaskRegisteredAsync).mockResolvedValue(false);
    registerTask.mockResolvedValue(undefined);
    jest.mocked(handleNotificationActionAsync).mockResolvedValue('handled');
  });

  it('defines synchronously and shares registration between startup and scheduling', async () => {
    const task = loadTask();
    expect(TaskManager.defineTask).toHaveBeenCalledTimes(1);
    await Promise.all([task.ensureNotificationActionTaskAsync(), task.ensureNotificationActionTaskAsync()]);
    expect(registerTask).toHaveBeenCalledTimes(1);
    expect(registerTask).toHaveBeenCalledWith(task.notificationActionTaskName);
  });

  it('passes the Android response to the shared processor without mounting navigation', async () => {
    const task = loadTask();
    await task.ensureNotificationActionTaskAsync();
    const callback = jest.mocked(TaskManager.defineTask).mock.calls[0][1];
    const data = { actionIdentifier: 'mark_habit_complete', notification: { request: {
      identifier: 'n1', content: { dataString: '{"type":"habit_reminder"}' },
    } } };
    await callback({ data, error: null, executionInfo: { eventId: 'event', taskName: task.notificationActionTaskName } });
    expect(handleNotificationActionAsync).toHaveBeenCalledWith(data);
  });

  it('does not register a native task twice across JS launches', async () => {
    jest.mocked(TaskManager.isTaskRegisteredAsync).mockResolvedValue(true);
    await loadTask().ensureNotificationActionTaskAsync();
    expect(registerTask).not.toHaveBeenCalled();
  });

  it.each(['Expo Go', 'missing module', 'unavailable'] as const)('handles %s without crashing', async (condition) => {
    if (condition === 'Expo Go') jest.mocked(isRunningInExpoGo).mockReturnValue(true);
    if (condition === 'missing module') jest.mocked(requireOptionalNativeModule).mockReturnValue(null);
    if (condition === 'unavailable') jest.mocked(TaskManager.isAvailableAsync).mockResolvedValue(false);
    expect(await loadTask().ensureNotificationActionTaskAsync()).toBe(false);
    expect(registerTask).not.toHaveBeenCalled();
    if (condition !== 'unavailable') expect(TaskManager.defineTask).not.toHaveBeenCalled();
  });
});
