jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly', DATE: 'date' },
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
}));

import * as Notifications from 'expo-notifications';
import { DEFAULT_CONFIG } from './lib/time';
import { allowReminder, syncReminder } from './reminder';

const scheduled = () =>
  jest.mocked(Notifications.scheduleNotificationAsync).mock.calls.map(([request]) => request);
const triggers = () => scheduled().map(({ trigger }) => trigger as Record<string, unknown>);

beforeEach(() => jest.clearAllMocks());

describe('syncReminder', () => {
  test('with the reminder off, it clears what was scheduled and schedules nothing', async () => {
    await syncReminder(DEFAULT_CONFIG, false);

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(scheduled()).toEqual([]);
  });

  test('with the reminder on, it schedules one for each day of the week at the target', async () => {
    await syncReminder({ ...DEFAULT_CONFIG, reminder: true, wakeTarget: '06:45' }, false);

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(triggers().map((t) => t.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const trigger of triggers()) expect(trigger).toMatchObject({ type: 'weekly', hour: 6, minute: 45 });
    expect(scheduled()[0].content.body).toContain('6:45 AM');
  });

  test('with weekend targets on, Saturday and Sunday use the weekend time', async () => {
    const config = { ...DEFAULT_CONFIG, reminder: true, weekendTargets: true, weekendWakeTarget: '08:30' };
    await syncReminder(config, true);

    // Weekday 1 is Sunday and 7 is Saturday.
    expect(triggers().map((t) => `${t.hour}:${t.minute}`)).toEqual([
      '8:30',
      '6:0',
      '6:0',
      '6:0',
      '6:0',
      '6:0',
      '8:30',
    ]);
    expect(scheduled()[0].content.body).toContain('08:30');
  });
});

describe('syncReminder on a day that is already logged', () => {
  const config = { ...DEFAULT_CONFIG, reminder: true };
  const monday = (hour: number, minute: number) => new Date(2026, 9, 12, hour, minute); // Monday 12 October 2026

  test('a reminder still ahead today is put off to the same time next week', async () => {
    await syncReminder(config, false, monday(5, 30));

    // Monday is weekday 2. The other six days keep their weekly reminder.
    expect(triggers().filter((t) => t.type === 'weekly').map((t) => t.weekday)).toEqual([1, 3, 4, 5, 6, 7]);
    expect(triggers().filter((t) => t.type === 'date')).toEqual([
      expect.objectContaining({ date: new Date(2026, 9, 19, 6, 0) }),
    ]);
  });

  test('a reminder that has already gone off today is left as it is', async () => {
    await syncReminder(config, false, monday(6, 30));

    expect(triggers().map((t) => t.type)).toEqual(Array(7).fill('weekly'));
  });
});

describe('allowReminder', () => {
  const granted = (value: boolean) => ({ granted: value }) as Notifications.NotificationPermissionsStatus;

  test('does not ask again when notifications are already allowed', async () => {
    expect(await allowReminder()).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('asks when it has not been decided, and reports the answer', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(granted(false));
    expect(await allowReminder()).toBe(true);

    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(granted(false));
    expect(await allowReminder()).toBe(false);
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(granted(true));
  });
});
