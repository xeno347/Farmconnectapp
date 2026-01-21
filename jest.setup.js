// Jest setup for React Native libraries
import 'react-native-gesture-handler/jestSetup';

// Mock Reanimated v2/v3 per library docs
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Some versions expose this path; make it optional.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.resolve('react-native-reanimated/src/NativeReanimatedHelper');
  jest.mock('react-native-reanimated/src/NativeReanimatedHelper');
} catch {
  // ignore
}
