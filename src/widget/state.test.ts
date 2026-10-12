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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG } from '../lib/time';
import { type Data, load } from '../storage';
import { logWakeFromWidget, widgetState } from './state';

const monday = new Date(2026, 9, 12, 6, 12); // Monday 12 October 2026, 06:12
const at = (time: string) => ({ time, target: '06:00' });
const data = (over: Partial<Data> = {}): Data => ({ wake: {}, bed: {}, config: DEFAULT_CONFIG, ...over });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('widgetState', () => {
  test('before today is logged, the log widget offers the button and names the target', () => {
    const state = widgetState(data(), monday, false);

    expect(state.logged).toBeNull();
    expect(state.target).toBe('6:00 AM');
  });

  test('after logging, it shows the time, how late it was, and the tile level for the colour', () => {
    const state = widgetState(data({ wake: { '2026-10-12': at('06:12') } }), monday, true);

    expect(state.logged).toEqual({ time: '06:12', label: '12mins late', level: 3 });
  });

  test('the week is the seven days ending today, oldest first, each with its level', () => {
    const wake = { '2026-10-06': at('06:00'), '2026-10-10': at('07:30'), '2026-10-12': at('06:20') };
    const state = widgetState(data({ wake }), monday, false);

    // Tuesday 6 to Monday 12.
    expect(state.week.map((day) => day.letter).join('')).toBe('TWTFSSM');
    expect(state.week.map((day) => day.level)).toEqual([4, 0, 0, 0, 1, 0, 3]);
  });

  test('the streak is counted the way the user set it up', () => {
    const wake = { '2026-10-10': at('06:00'), '2026-10-11': at('06:20'), '2026-10-12': at('07:30') };
    const rows = widgetState(data({ wake }), monday, false);
    expect(rows.streak).toEqual(['3', 'days in a row']);

    const seven = { ...DEFAULT_CONFIG, streakRule: 'near' as const, streakStyle: 'seven' as const };
    expect(widgetState(data({ wake, config: seven }), monday, false).streak).toEqual(['2/7', 'of the last 7 days']);
  });

  test('a streak that follows bedtimes shows bedtime days, but only while bedtime tracking is on', () => {
    const bed = { '2026-10-10': { time: '22:00', target: '22:00' } };
    const follow = { ...DEFAULT_CONFIG, streakFor: 'bed' as const };

    expect(widgetState(data({ bed, config: { ...follow, bedEnabled: true } }), monday, false).streak[0]).toBe('1');
    expect(widgetState(data({ bed, config: follow }), monday, false).streak[0]).toBe('0');
  });
});

describe('logWakeFromWidget', () => {
  test('saves now as today\'s wake-up, against today\'s target', async () => {
    const saturday = new Date(2026, 9, 10, 7, 0);
    const config = { ...DEFAULT_CONFIG, weekendTargets: true };
    const next = await logWakeFromWidget(data({ config }), saturday);

    expect(next.wake).toEqual({ '2026-10-10': { time: '07:00', target: '08:00' } });
    expect((await load()).wake).toEqual(next.wake);
  });

  test('never overwrites a day that is already logged', async () => {
    const before = data({ wake: { '2026-10-12': at('05:55') } });
    const next = await logWakeFromWidget(before, monday);

    expect(next).toBe(before);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
