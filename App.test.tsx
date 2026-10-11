// Mounts the whole app and drives its main flows. Only the edges are replaced:
// storage (in memory), the device's 12/24-hour switch, safe-area insets, the
// icon font, and the time picker (covered in src/components/TimeField.test.tsx;
// its package ships syntax Jest cannot load).
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from 'react';
import { PaperProvider } from 'react-native-paper';
import renderer, { type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import App from './App';

let tree: ReactTestRenderer;

const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
const screen = () => JSON.stringify(tree.toJSON());
const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');
const monthTitle = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

function find(what: string, match: (node: ReactTestInstance) => boolean): ReactTestInstance {
  const found = tree.root.findAll(match);
  if (found.length === 0) throw new Error(`not on screen: ${what}`);
  return found[0];
}
const logButton = (label: string) =>
  find(`"${label}" button`, (n) => n.props.label === label && typeof n.props.onPress === 'function');
const labelled = (what: string, match: (label: string) => boolean) =>
  find(
    what,
    (n) =>
      typeof n.props.onPress === 'function' &&
      typeof n.props.accessibilityLabel === 'string' &&
      match(n.props.accessibilityLabel),
  );
const textButton = (label: string) =>
  find(`"${label}" button`, (n) => typeof n.props.onPress === 'function' && n.props.children === label);
const toggle = (label: string) =>
  find(
    `"${label}" switch`,
    (n) => n.props.accessibilityLabel === label && typeof n.props.onValueChange === 'function',
  );
// The segmented control that offers `value` as one of its choices.
const choice = (value: string) =>
  find(
    `choice of "${value}"`,
    (n) =>
      typeof n.props.onValueChange === 'function' &&
      Array.isArray(n.props.buttons) &&
      n.props.buttons.some((button: { value: string }) => button.value === value),
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
async function mount() {
  await act(async () => {
    tree = renderer.create(<App />);
  });
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 12, 6, 12)); // Monday 12 October 2026, 06:12
  await AsyncStorage.clear();
});

afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});

test('first run shows a wake-only home screen', async () => {
  await mount();

  const text = screen();
  expect(text).toContain('Rise');
  expect(text).toContain("I'm up");
  expect(text).toContain('Target wake-up 6:00 AM');
  expect(text).toContain(monthTitle(2026, 9));
  for (const stat of ['Logged', 'On time', 'Avg late']) expect(text).toContain(stat);
  expect(text).not.toContain('Bedtime');
});

test('one tap logs today against the current target and hides the button', async () => {
  await mount();
  await press(logButton("I'm up"));

  expect(await stored('rise.wake')).toEqual({ '2026-10-12': { time: '06:12', target: '06:00' } });
  expect(screen()).toContain('Logged 6:12 AM');
  expect(screen()).not.toContain("I'm up");
});

test('a logged day can be opened and deleted', async () => {
  await mount();
  await press(logButton("I'm up"));
  await press(labelled("today's tile", (label) => label.includes('today')));

  expect(screen()).toContain('Wake-up');
  await press(textButton('Delete'));

  expect(await stored('rise.wake')).toEqual({});
  expect(screen()).toContain("I'm up");
});

test('bedtime tracking adds the mode switch, and turning it off returns to Wake', async () => {
  await mount();
  await press(labelled('settings', (label) => label === 'Settings'));
  expect(screen()).not.toContain('Target bedtime');

  await change(toggle('Track bedtime'), true);
  expect((await stored('rise.config')).bedEnabled).toBe(true);
  await change(choice('bed'), 'bed');
  expect(screen()).toContain('Target bedtime 10:00 PM');
  // Wake data is untouched by anything done in Bedtime mode.
  expect(await stored('rise.wake')).toBeNull();

  await change(toggle('Track bedtime'), false);
  await change(toggle('Track bedtime'), true);
  expect(screen()).toContain('Target wake-up 6:00 AM');
});

test('the time format setting changes how times are shown', async () => {
  await mount();
  await press(labelled('settings', (label) => label === 'Settings'));

  await change(choice('24h'), '24h');
  expect(screen()).toContain('Target wake-up 06:00');
  expect(screen()).not.toContain('6:00 AM');
  expect((await stored('rise.config')).timeFormat).toBe('24h');

  await change(choice('12h'), '12h');
  expect(screen()).toContain('Target wake-up 6:00 AM');
});

test('the theme setting overrides the device theme', async () => {
  await mount();
  const dark = () => tree.root.findByType(PaperProvider).props.theme.dark;
  await press(labelled('settings', (label) => label === 'Settings'));
  expect(dark()).toBe(false);

  await change(choice('dark'), 'dark');
  expect(dark()).toBe(true);
  expect((await stored('rise.config')).theme).toBe('dark');

  await change(choice('light'), 'light');
  expect(dark()).toBe(false);
});

test('left open overnight into a new month, the calendar and button follow today', async () => {
  jest.setSystemTime(new Date(2026, 9, 31, 7, 0)); // 31 October, 07:00
  await mount();
  await press(logButton("I'm up"));
  expect(screen()).toContain(monthTitle(2026, 9));
  expect(screen()).not.toContain("I'm up");

  // The app stays on screen; nothing brings it back to the foreground.
  jest.setSystemTime(new Date(2026, 10, 1, 6, 30)); // 1 November, 06:30
  await act(async () => {
    await jest.advanceTimersByTimeAsync(61_000);
  });

  expect(screen()).toContain(monthTitle(2026, 10));
  expect(screen()).toContain("I'm up");

  await press(logButton("I'm up"));
  expect(Object.keys(await stored('rise.wake'))).toEqual(['2026-10-31', '2026-11-01']);
});
