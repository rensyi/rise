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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from 'react';
import { PaperProvider } from 'react-native-paper';
import renderer, { type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import App from './App';
import { lightTheme } from './src/theme';

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
