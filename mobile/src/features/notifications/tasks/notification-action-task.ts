import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import type * as TaskManagerModule from 'expo-task-manager';
import { Platform } from 'react-native';

import { getNotificationsModuleAsync, handleNotificationActionAsync } from '../services/notification-service';

export const notificationActionTaskName = 'done_loop_notification_actions_v1';

let taskManager: typeof TaskManagerModule | null = null;
let registration: Promise<boolean> | null = null;

// Definition must happen synchronously, before Router mounts, including headless launches.
// Gate the import itself: Expo Go and older APKs do not contain this native module.
if (Platform.OS === 'android' && !isRunningInExpoGo() && requireOptionalNativeModule('ExpoTaskManager')) {
  taskManager = require('expo-task-manager');
  if (taskManager && !taskManager.isTaskDefined(notificationActionTaskName)) {
    taskManager.defineTask<unknown>(notificationActionTaskName, async ({ data, error }) => {
      if (error) throw new Error(error.message);
      await handleNotificationActionAsync(data);
    });
  }
}

export function ensureNotificationActionTaskAsync(): Promise<boolean> {
  if (Platform.OS !== 'android') return Promise.resolve(true);
  if (!taskManager) return Promise.resolve(false);
  if (!registration) {
    const manager = taskManager;
    registration = (async () => {
      if (!(await manager.isAvailableAsync())) return false;
      if (!(await manager.isTaskRegisteredAsync(notificationActionTaskName))) {
        const notifications = await getNotificationsModuleAsync();
        if (!notifications) return false;
        await notifications.registerTaskAsync(notificationActionTaskName);
      }
      return true;
    })().then((registered) => {
      if (!registered) registration = null;
      return registered;
    }).catch((error: unknown) => {
      registration = null;
      throw error;
    });
  }
  return registration;
}

void ensureNotificationActionTaskAsync().catch((error: unknown) => {
  console.error('Could not register notification actions.', error);
});
