// The widget package reaches for native code as soon as it is loaded, and
// Expo Go does not have that code. Loading it there would stop the app from
// opening, as the notifications package once did.
jest.mock('expo', () => ({ isRunningInExpoGo: () => true }));
jest.mock('react-native-android-widget', () => {
  throw new Error('react-native-android-widget was loaded');
});

import { Platform } from 'react-native';
import { DEFAULT_CONFIG } from '../lib/time';
import { refreshWidgets, registerWidgets, widgetsAvailable } from './index';

const data = { wake: {}, bed: {}, config: DEFAULT_CONFIG };

test('inside Expo Go on Android the widget package is never loaded', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');

  expect(widgetsAvailable()).toBe(false);
  expect(() => registerWidgets()).not.toThrow();
  await expect(refreshWidgets(data, false)).resolves.toBeUndefined();
});

test('on an iPhone there are no widgets, so it is not loaded there either', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  expect(widgetsAvailable()).toBe(false);
  expect(() => registerWidgets()).not.toThrow();
  await expect(refreshWidgets(data, false)).resolves.toBeUndefined();
});
