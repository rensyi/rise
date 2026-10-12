// Mounts the whole app and drives its main flows. Only the edges are replaced:
// storage (in memory), the device's 12/24-hour switch, safe-area insets, the
// icon font, font loading, and the time picker (covered in
// src/components/TimeField.test.tsx; its package ships syntax Jest cannot load).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
    },
  };
});
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-paper-dates', () => ({
  TimePickerModal: () => null,
  registerTranslation: () => {},
  en: {},
}));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({ __esModule: true, default: () => null }));
jest.mock('expo-localization', () => ({ useCalendars: () => [{ uses24hourClock: false }] }));
// [loaded, error], as the real useFonts returns. Tests change it to act out slow or failed loading.
let mockFonts: [boolean, Error | null] = [true, null];
jest.mock('expo-font', () => ({ useFonts: () => mockFonts }));
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
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
// Files live in memory, keyed by where they were written.
const mockFiles = new Map<string, string>();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache/' },
  File: class {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join('');
    }
    create() {}
    write(text: string) {
      mockFiles.set(this.uri, text);
    }
    async text() {
      return mockFiles.get(this.uri) ?? '';
    }
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { act } from 'react';
import { AccessibilityInfo } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import renderer, { type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import App from './App';
import * as reminder from './src/reminder';
import { lightTheme, tileColor } from './src/theme';

let tree: ReactTestRenderer;

const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
const screen = () => JSON.stringify(tree.toJSON());
const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');
const monthName = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long' });

function find(what: string, match: (node: ReactTestInstance) => boolean): ReactTestInstance {
  const found = tree.root.findAll(match);
  if (found.length === 0) throw new Error(`not on screen: ${what}`);
  return found[0];
}
// Anything pressable, found by the label a screen reader would speak.
const labelled = (what: string, match: (label: string) => boolean) =>
  find(
    what,
    (n) =>
      typeof n.props.onPress === 'function' &&
      typeof n.props.accessibilityLabel === 'string' &&
      match(n.props.accessibilityLabel),
  );
const named = (label: string) => labelled(`"${label}"`, (found) => found === label);
const isShown = (label: string) =>
  tree.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label).length > 0;
const textButton = (label: string) =>
  find(`"${label}" button`, (n) => typeof n.props.onPress === 'function' && n.props.children === label);
const toggle = (label: string) =>
  find(
    `"${label}" switch`,
    (n) => n.props.accessibilityLabel === label && typeof n.props.onValueChange === 'function',
  );

async function press(node: ReactTestInstance) {
  await act(async () => {
    node.props.onPress();
  });
  await settle();
}
async function change(node: ReactTestInstance, value: unknown) {
  await act(async () => {
    node.props.onValueChange(value);
  });
  await settle();
}
const go = (place: 'Today' | 'Calendar' | 'Settings') => press(named(place));
async function mount() {
  await act(async () => {
    tree = renderer.create(<App />);
  });
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 12, 6, 12)); // Monday 12 October 2026, 06:12
  mockFonts = [true, null];
  mockFiles.clear();
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});

test('first run opens on Today with the log button and no bedtime tabs', async () => {
  await mount();

  const text = screen();
  expect(text).toContain('Monday');
  expect(text).toContain("I'm up");
  expect(text).toContain('Target 6:00 AM');
  expect(text).toContain('Last few days');
  for (const place of ['Today', 'Calendar', 'Settings']) expect(isShown(place)).toBe(true);
  expect(isShown('Bedtime')).toBe(false);
});

test('one tap logs today against the current target and shows the time', async () => {
  await mount();
  await press(named("I'm up"));

  expect(await stored('rise.wake')).toEqual({ '2026-10-12': { time: '06:12', target: '06:00' } });
  expect(isShown("I'm up")).toBe(false);
  const text = screen();
  expect(text).toContain('You got up at');
  expect(text).toContain('12mins late');
  expect(text).toContain('Logged 6:12 AM');
});

test('a log can be undone from its message', async () => {
  await mount();
  await press(named("I'm up"));
  expect(screen()).toContain('Logged 6:12 AM');

  await press(textButton('Undo'));
  expect(await stored('rise.wake')).toEqual({});
  expect(isShown("I'm up")).toBe(true);
  expect(screen()).not.toContain('Logged 6:12 AM');
});

test('only a log offers Undo, and it goes when the message does', async () => {
  const offered = () => tree.root.findAll((n) => n.props.children === 'Undo').length > 0;
  await mount();
  await go('Settings');
  await press(named('Export backup'));
  expect(offered()).toBe(false);

  await go('Today');
  await press(named("I'm up"));
  expect(offered()).toBe(true);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(6000);
  });
  expect(offered()).toBe(false);
  expect(Object.keys(await stored('rise.wake'))).toEqual(['2026-10-12']);
});

test('the calendar shows the month, its stats and its tiles', async () => {
  await mount();
  await press(named("I'm up"));
  await go('Calendar');

  const text = screen();
  expect(text).toContain(monthName(2026, 9));
  for (const stat of ['Logged', 'On time', 'Avg late']) expect(text).toContain(stat);
  // Today's tile speaks its date, time and lateness.
  expect(labelled("today's tile", (label) => label.includes('today')).props.accessibilityLabel).toContain(
    '6:12 AM, 12mins late',
  );
});

test('a logged day opens as a sheet: title, date, lateness, time, then the buttons', async () => {
  await mount();
  await press(named("I'm up"));
  await go('Calendar');
  await press(labelled("today's tile", (label) => label.includes('today')));

  const text = screen();
  const sheet = text.lastIndexOf('"Wake-up"');
  const label = text.indexOf('12mins late', sheet);
  const time = text.indexOf('6:12 AM', sheet);
  expect(sheet).toBeGreaterThan(-1);
  expect(label).toBeGreaterThan(sheet);
  expect(time).toBeGreaterThan(label);

  // The sheet does not repeat the target, and Delete is the one red control.
  const targetLines = tree.root.findAll(
    (n) => Array.isArray(n.props.children) && n.props.children[0] === 'Target ',
  );
  expect(targetLines.length).toBe(0);
  expect(textButton('Delete').props.textColor).toBe(lightTheme.colors.error);
  expect(textButton('Cancel').props.textColor).toBe(lightTheme.colors.onSurface);
});

test('deleting a day from the sheet brings the log button back', async () => {
  await mount();
  await press(named("I'm up"));
  await go('Calendar');
  await press(labelled("today's tile", (label) => label.includes('today')));
  await press(textButton('Delete'));

  expect(await stored('rise.wake')).toEqual({});
  await go('Today');
  expect(isShown("I'm up")).toBe(true);
});

test('a day can be opened from the list on Today', async () => {
  await mount();
  await press(labelled('a past day row', (label) => label.includes('no entry')));

  expect(screen()).toContain('"Wake-up"');
  expect(screen()).toContain('On time');
  // No entry yet, so there is nothing to delete.
  expect(tree.root.findAll((n) => n.props.children === 'Delete').length).toBe(0);
});

test('bedtime tracking adds Wake and Bedtime tabs, and turning it off returns to Wake', async () => {
  await mount();
  await go('Settings');
  expect(screen()).not.toContain('Target bedtime');

  await change(toggle('Track bedtime'), true);
  expect((await stored('rise.config')).bedEnabled).toBe(true);
  await go('Today');
  await press(named('Bedtime'));
  expect(isShown('In bed')).toBe(true);
  expect(screen()).toContain('Target 10:00 PM');
  // Wake data is untouched by anything done in Bedtime mode.
  expect(await stored('rise.wake')).toBeNull();

  await go('Settings');
  await change(toggle('Track bedtime'), false);
  await change(toggle('Track bedtime'), true);
  await go('Today');
  expect(isShown("I'm up")).toBe(true);
});

test('a switch flips when it is pressed, and says whether it is on', async () => {
  await mount();
  await go('Settings');
  const bedtime = () =>
    find(
      'the Track bedtime switch',
      (n) =>
        n.props.accessibilityRole === 'switch' &&
        n.props.accessibilityLabel === 'Track bedtime' &&
        typeof n.props.onPress === 'function',
    );
  expect(bedtime().props.accessibilityState).toEqual({ checked: false });

  await press(bedtime());
  expect(bedtime().props.accessibilityState).toEqual({ checked: true });
  expect((await stored('rise.config')).bedEnabled).toBe(true);
});

test('the time format setting changes how times are shown', async () => {
  await mount();
  await go('Settings');
  expect(screen()).toContain('6:00 AM');

  await press(named('24-hour'));
  expect(screen()).toContain('06:00');
  expect(screen()).not.toContain('6:00 AM');
  expect((await stored('rise.config')).timeFormat).toBe('24h');

  await press(named('12-hour'));
  expect(screen()).toContain('6:00 AM');
});

test('the theme setting overrides the device theme', async () => {
  await mount();
  const dark = () => tree.root.findByType(PaperProvider).props.theme.dark;
  await go('Settings');
  expect(dark()).toBe(false);

  await press(named('Dark'));
  expect(dark()).toBe(true);
  expect((await stored('rise.config')).theme).toBe('dark');

  await press(named('Light'));
  expect(dark()).toBe(false);
});

test('left open overnight into a new month, Today and the calendar follow the date', async () => {
  jest.setSystemTime(new Date(2026, 9, 31, 7, 0)); // Saturday 31 October, 07:00
  await mount();
  await press(named("I'm up"));
  expect(isShown("I'm up")).toBe(false);
  await go('Calendar');
  expect(screen()).toContain(monthName(2026, 9));

  // The app stays on screen; nothing brings it back to the foreground.
  jest.setSystemTime(new Date(2026, 10, 1, 6, 30)); // Sunday 1 November, 06:30
  await act(async () => {
    await jest.advanceTimersByTimeAsync(61_000);
  });

  expect(screen()).toContain(monthName(2026, 10));
  await go('Today');
  expect(screen()).toContain('Sunday');
  await press(named("I'm up"));
  expect(Object.keys(await stored('rise.wake'))).toEqual(['2026-10-31', '2026-11-01']);
});

test('the In bed button lets off Zs, and the wake button does not', async () => {
  const zs = () => screen().split('"Z"').length - 1;
  await mount();
  expect(zs()).toBe(0);

  await go('Settings');
  await change(toggle('Track bedtime'), true);
  await go('Today');
  await press(named('Bedtime'));
  expect(zs()).toBe(3);
});

test('the day sheet slides away before it closes', async () => {
  await mount();
  await press(labelled('a past day row', (label) => label.includes('no entry')));
  await act(async () => {
    textButton('Cancel').props.onPress();
  });
  expect(screen()).toContain('"Wake-up"');

  await settle();
  expect(screen()).not.toContain('"Wake-up"');
});

test('with reduced motion on, the day sheet closes at once', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  await mount();
  await press(labelled('a past day row', (label) => label.includes('no entry')));
  await act(async () => {
    textButton('Cancel').props.onPress();
  });

  expect(screen()).not.toContain('"Wake-up"');
});

const at = (time: string) => ({ time, target: '06:00' });

test('Today shows no streak; it has its own tab on Calendar', async () => {
  await AsyncStorage.setItem('rise.wake', JSON.stringify({ '2026-10-10': at('06:00'), '2026-10-11': at('06:20') }));
  await mount();
  expect(screen()).not.toContain('Streak');

  // Without bedtime tracking the tabs are Wake and Streak.
  await go('Calendar');
  expect(isShown('Wake')).toBe(true);
  expect(isShown('Streak')).toBe(true);
  expect(isShown('Bedtime')).toBe(false);
});

test('the Streak tab counts the way the user sets it up, and remembers the choice', async () => {
  // On time, 20 minutes late, and 70 minutes late.
  await AsyncStorage.setItem(
    'rise.wake',
    JSON.stringify({ '2026-10-09': at('06:00'), '2026-10-10': at('06:20'), '2026-10-11': at('07:10') }),
  );
  await mount();
  await go('Calendar');
  await press(named('Streak'));

  // To start with any logged day counts, in a row. Today is not logged yet, which does not break it.
  expect(screen()).toContain('Streak: 3 days in a row');
  expect(screen()).toContain('Best so far: 3');
  expect(labelled('the 11th', (label) => label.startsWith('October 11')).props.accessibilityLabel).toContain(
    'counts towards your streak',
  );
  // With bedtime tracking off there is nothing to choose between.
  expect(isShown('Bedtimes')).toBe(false);
  // Days that count keep the colour of their own tile: gold on time, darker the later.
  const tile = (d: number) =>
    JSON.stringify(labelled(`day ${d}`, (label) => label.startsWith(`October ${d},`)).props.style);
  expect(tile(9)).toContain(tileColor(4));
  expect(tile(10)).toContain(tileColor(3));
  expect(tile(11)).toContain(tileColor(1));

  await press(named('Within 30m'));
  expect(screen()).toContain('Streak: 0 days in a row');
  // A day that no longer counts is left empty, whatever was logged.
  expect(tile(10)).toContain(tileColor(3));
  expect(tile(11)).not.toContain(tileColor(1));
  expect(labelled('the 11th', (label) => label.startsWith('October 11')).props.accessibilityLabel).toContain(
    'does not count',
  );

  await press(named('Last 7 days'));
  expect(screen()).toContain('Streak: 2/7 of the last 7 days');
  expect(await stored('rise.config')).toMatchObject({ streakRule: 'near', streakStyle: 'seven' });
});

test('the streak can follow bedtimes when bedtime tracking is on', async () => {
  await AsyncStorage.setItem('rise.bed', JSON.stringify({ '2026-10-10': { time: '22:00', target: '22:00' } }));
  await AsyncStorage.setItem('rise.config', JSON.stringify({ bedEnabled: true }));
  await mount();
  await go('Calendar');
  await press(named('Streak'));
  expect(screen()).toContain('Streak: 0 days in a row');

  // At 06:12 a bedtime would still be logged for the night of the 11th. That
  // night is not logged yet, so the run of one on the 10th is still alive.
  await press(named('Bedtimes'));
  expect(screen()).toContain('Streak: 1 day in a row');
  expect(screen()).toContain('Best so far: 1');
  expect((await stored('rise.config')).streakFor).toBe('bed');
});

test('Today lists the last five days, with lateness shortened to the hour', async () => {
  await AsyncStorage.setItem('rise.wake', JSON.stringify({ '2026-10-08': at('11:23') }));
  await mount();

  // Monday 12 back to Thursday 8, and no further.
  expect(screen()).toContain('Last few days');
  expect(screen()).toContain('8 Thursday');
  expect(screen()).not.toContain('7 Wednesday');
  expect(screen()).toContain('"5hrs late"');
  expect(screen()).not.toContain('"5hrs 23mins late"');

  // The day's own sheet still gives the full figure.
  await press(labelled('the row for the 8th', (label) => label.startsWith('8 Thursday')));
  expect(screen()).toContain('"5hrs 23mins late"');
});

test('the calendar shows how consistent the month has been', async () => {
  await AsyncStorage.setItem(
    'rise.wake',
    JSON.stringify({ '2026-10-09': at('06:00'), '2026-10-10': at('06:20'), '2026-10-11': at('06:40') }),
  );
  await mount();
  await go('Calendar');

  expect(screen()).toContain('Consistency: 87%, your times vary by about 13mins');
});

test('with weekend targets on, a Saturday is logged against the weekend target', async () => {
  jest.setSystemTime(new Date(2026, 9, 10, 7, 0)); // Saturday 10 October, 07:00
  await mount();
  await go('Settings');
  expect(screen()).not.toContain('Weekend wake-up time');

  await change(toggle('Different target on weekends'), true);
  expect(screen()).toContain('Weekend wake-up time');
  await go('Today');
  expect(screen()).toContain('Target 8:00 AM');

  await press(named("I'm up"));
  expect(await stored('rise.wake')).toEqual({ '2026-10-10': { time: '07:00', target: '08:00' } });
  expect(screen()).toContain('1hr early');
});

test('turning the reminder on schedules it for every day of the week', async () => {
  await mount();
  await go('Settings');
  await change(toggle('Wake-up reminder'), true);

  expect((await stored('rise.config')).reminder).toBe(true);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
});

test('logging before the target puts off the reminder for that day', async () => {
  jest.setSystemTime(new Date(2026, 9, 12, 5, 30)); // Monday 12 October, 05:30: half an hour early
  await AsyncStorage.setItem('rise.config', JSON.stringify({ reminder: true }));
  await mount();
  const types = () =>
    jest
      .mocked(Notifications.scheduleNotificationAsync)
      .mock.calls.slice(-7)
      .map(([request]) => (request.trigger as { type: string }).type);
  expect(types()).toEqual(Array(7).fill('weekly'));

  await press(named("I'm up"));
  expect(types().filter((type) => type === 'date')).toHaveLength(1);

  // Undoing the log brings today's reminder back.
  await press(textButton('Undo'));
  expect(types()).toEqual(Array(7).fill('weekly'));
});

test('the reminder stays off when the phone does not allow notifications', async () => {
  const denied = { granted: false } as Notifications.NotificationPermissionsStatus;
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(denied);
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(denied);
  await mount();
  await go('Settings');
  await change(toggle('Wake-up reminder'), true);

  expect(toggle('Wake-up reminder').props.value).toBe(false);
  expect(screen()).toContain('Notifications are off for Rise');
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('inside Expo Go on Android the reminder stays off and says why', async () => {
  jest.spyOn(reminder, 'reminderAvailable').mockReturnValue(false);
  await mount();
  await go('Settings');
  await change(toggle('Wake-up reminder'), true);

  expect(toggle('Wake-up reminder').props.value).toBe(false);
  expect(screen()).toContain("The reminder can't run inside Expo Go on Android");
  jest.restoreAllMocks();
});

test('exporting writes one file and opens the share sheet', async () => {
  await mount();
  await press(named("I'm up"));
  await go('Settings');
  await press(named('Export backup'));

  expect(Sharing.shareAsync).toHaveBeenCalledWith('cache/rise-backup-2026-10-12.json', expect.anything());
  expect(JSON.parse(mockFiles.get('cache/rise-backup-2026-10-12.json')!).wake).toEqual({
    '2026-10-12': { time: '06:12', target: '06:00' },
  });
});

const pick = (uri: string) =>
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, name: 'rise-backup-2026-10-03.json' }],
  } as DocumentPicker.DocumentPickerResult);

test('restoring asks first, then replaces everything with what is in the file', async () => {
  const backup = { app: 'rise', version: 1, wake: { '2026-10-01': at('06:05') }, bed: {}, config: { wakeTarget: '07:00' } };
  mockFiles.set('picked.json', JSON.stringify(backup));
  pick('picked.json');
  await mount();
  await press(named("I'm up"));
  await go('Settings');
  await press(named('Restore from backup'));

  expect(screen()).toContain('Restore?');
  expect(screen()).toContain('1 wake-up and 0 bedtimes');
  // Nothing changes until it is confirmed.
  expect(Object.keys(await stored('rise.wake'))).toEqual(['2026-10-12']);

  await press(textButton('Replace'));
  expect(await stored('rise.wake')).toEqual(backup.wake);
  expect((await stored('rise.config')).wakeTarget).toBe('07:00');
  expect(screen()).toContain('Restored 1 wake-up and 0 bedtimes');
  expect(screen()).toContain('7:00 AM');
});

test('a file that is not a Rise backup is refused and nothing changes', async () => {
  mockFiles.set('notes.txt', 'shopping list');
  pick('notes.txt');
  await mount();
  await press(named("I'm up"));
  await go('Settings');
  await press(named('Restore from backup'));

  expect(screen()).toContain('That file is not a Rise backup.');
  expect(screen()).not.toContain('Restore?');
  expect(Object.keys(await stored('rise.wake'))).toEqual(['2026-10-12']);
});

test('nothing is drawn until the Rubik font has loaded', async () => {
  mockFonts = [false, null];
  await mount();

  expect(tree.toJSON()).toBeNull();
});

test('the app still opens if the Rubik font fails to load', async () => {
  mockFonts = [false, new Error('offline')];
  await mount();

  expect(isShown("I'm up")).toBe(true);
});
