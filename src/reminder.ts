import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { type Config, formatTime, parseTime, targetOnWeekday } from './lib/time';

const CHANNEL = 'reminder';

// Expo Go on Android no longer includes notifications, and the package throws
// as soon as it is loaded there. The reminder works on iPhone in Expo Go and
// in the app's own build on both.
export const reminderAvailable = () => !(Platform.OS === 'android' && isRunningInExpoGo());

// The package is loaded on first use, never at start-up, so that the app
// still opens where it cannot be loaded. Call only when reminderAvailable().
let ready = false;
async function notifications() {
  // require, not import: an import at the top of the file would load it at start-up.
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  if (!ready) {
    ready = true;
    // Show the reminder even if it arrives while the app is open.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    // Android files every notification under a channel, and only asks the
    // user for permission once one exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Wake-up reminder',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  }
  return Notifications;
}

// True if the phone lets Rise send notifications. Asks the user if they have
// not decided yet.
export async function allowReminder(): Promise<boolean> {
  if (!reminderAvailable()) return false;
  const Notifications = await notifications();
  if ((await Notifications.getPermissionsAsync()).granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Makes what is scheduled match the settings: nothing when the reminder is
// off, or one notification for each day of the week at that day's wake-up target.
//
// `loggedAt` is the current time, given only when today's wake-up is already
// logged. A reminder still ahead today would then tell someone to get up who
// already has, so today's is put off to the same time next week.
export async function syncReminder(
  config: Config,
  hour24: boolean,
  loggedAt: Date | null = null,
): Promise<void> {
  if (!reminderAvailable()) return;
  const Notifications = await notifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!config.reminder) return;
  for (let day = 0; day < 7; day++) {
    const target = targetOnWeekday(config, 'wake', day);
    const minutes = parseTime(target);
    const [hour, minute] = [Math.floor(minutes / 60), minutes % 60];
    const skipToday =
      loggedAt !== null &&
      loggedAt.getDay() === day &&
      loggedAt.getHours() * 60 + loggedAt.getMinutes() < minutes;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Time to get up', body: `Your target is ${formatTime(target, hour24)}.` },
      trigger: skipToday
        ? {
            // ponytail: a single reminder a week from now stands in for this
            // weekday's repeating one. The repeating one returns the next time
            // the app syncs, which happens every time it is opened; if the app
            // stays closed for two weeks, this weekday goes quiet until then.
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(loggedAt.getFullYear(), loggedAt.getMonth(), loggedAt.getDate() + 7, hour, minute),
            channelId: CHANNEL,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1, // 1 is Sunday
            hour,
            minute,
            channelId: CHANNEL,
          },
    });
  }
}
