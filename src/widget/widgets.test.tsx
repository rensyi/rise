// The widgets can only really be seen on a phone. This checks the part that
// can be checked here: that each one can be drawn, in every state and theme,
// without failing.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getCalendars: () => [{ uses24hourClock: false }] }));

import { DEFAULT_CONFIG, type ThemeChoice } from '../lib/time';
import { widgetState } from './state';
import { widgetView } from './widgets';

const monday = new Date(2026, 9, 12, 6, 12);
const empty = { wake: {}, bed: {}, config: DEFAULT_CONFIG };
const logged = { ...empty, wake: { '2026-10-12': { time: '06:12', target: '06:00' } } };

test.each(['RiseLog', 'RiseWeek'])('%s can be drawn before and after logging, in each theme', (name) => {
  for (const data of [empty, logged]) {
    const state = widgetState(data, monday, false);
    for (const theme of ['light', 'dark'] as ThemeChoice[]) {
      expect(widgetView(name, state, theme)).toHaveProperty('props.state', state);
    }
    // With "Device", Android is handed both and picks one.
    expect(Object.keys(widgetView(name, state, 'device'))).toEqual(['light', 'dark']);
  }
});

test('the names here match the widgets declared in app.json', () => {
  const plugin = (require('../../app.json').expo.plugins as unknown[]).find(
    (entry) => Array.isArray(entry) && entry[0] === 'react-native-android-widget',
  ) as [string, { widgets: { name: string }[] }];

  expect(plugin[1].widgets.map((widget) => widget.name)).toEqual(['RiseLog', 'RiseWeek']);
});
