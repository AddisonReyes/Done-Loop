// Runs the notification services without requiring React Native's native Jest preset.
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  transform: { '[.][jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: [
    '<rootDir>/src/features/notifications/services/notification-actions.test.ts',
    '<rootDir>/src/features/notifications/services/notification-service.test.ts',
    '<rootDir>/src/features/notifications/tasks/notification-action-task.test.ts',
    '<rootDir>/src/features/habits/hooks/use-habits-notification-refresh.test.tsx',
    '<rootDir>/src/features/settings/services/notification-settings.test.ts',
  ],
};
