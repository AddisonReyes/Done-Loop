jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// The SDK 58 mock imports the entry point, whose native CSS initializer is not usable in Jest.
jest.mock('react-native-reanimated/src/initializers.native', () => ({ initializeReanimatedModule: () => undefined }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
