// Expo Go on Android no longer includes notifications: the package throws as
// soon as it is loaded there, which once stopped the whole app from opening.
jest.mock('expo', () => ({ isRunningInExpoGo: () => true }));
jest.mock('expo-notifications', () => {
  throw new Error('expo-notifications was loaded');
});

import { Platform } from 'react-native';
import { DEFAULT_CONFIG } from './lib/time';
import { allowReminder, reminderAvailable, syncReminder } from './reminder';

test('inside Expo Go on Android the notifications package is never loaded', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');

  expect(reminderAvailable()).toBe(false);
  expect(await allowReminder()).toBe(false);
  await expect(syncReminder({ ...DEFAULT_CONFIG, reminder: true }, false)).resolves.toBeUndefined();
});

test('on an iPhone in Expo Go the reminder is available', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');

  expect(reminderAvailable()).toBe(true);
});
