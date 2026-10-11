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
import { DEFAULT_CONFIG } from './lib/time';
import { load, parseConfig, parseRecords, persist, saveConfig, saveWake } from './storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('parseRecords', () => {
  test('missing, unparsable or non-object data is empty', () => {
    expect(parseRecords(null)).toEqual({});
    expect(parseRecords('{oops')).toEqual({});
    expect(parseRecords('null')).toEqual({});
    expect(parseRecords('[1,2]')).toEqual({});
    expect(parseRecords('"06:00"')).toEqual({});
  });

  test('the prototype format of plain time strings is dropped', () => {
    expect(parseRecords('{"2026-10-12":"06:45"}')).toEqual({});
  });

  test('keeps valid entries and drops invalid ones', () => {
    const raw = JSON.stringify({
      '2026-10-12': { time: '06:45', target: '06:00' },
      '2026-10-13': { time: '25:00', target: '06:00' },
      '2026-10-14': { time: '06:00' },
      'not-a-date': { time: '06:00', target: '06:00' },
    });
    expect(parseRecords(raw)).toEqual({ '2026-10-12': { time: '06:45', target: '06:00' } });
  });
});

describe('parseConfig', () => {
  test('missing or unparsable data gives the defaults', () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(parseConfig('{oops')).toEqual(DEFAULT_CONFIG);
  });

  test('keeps valid fields and defaults the rest', () => {
    const raw = JSON.stringify({ wakeTarget: '09:00', bedEnabled: 'yes', bedTarget: '9pm' });
    expect(parseConfig(raw)).toEqual({ ...DEFAULT_CONFIG, wakeTarget: '09:00' });
  });

  test('settings saved before time format and theme existed load with "device"', () => {
    const raw = JSON.stringify({
      wakeTarget: '09:00',
      bedEnabled: true,
      bedTarget: '23:00',
      applyTargetsToPast: true,
    });
    expect(parseConfig(raw)).toMatchObject({ timeFormat: 'device', theme: 'device' });
  });

  test('keeps a valid time format and theme, and defaults unknown ones', () => {
    expect(parseConfig(JSON.stringify({ timeFormat: '24h', theme: 'dark' }))).toMatchObject({
      timeFormat: '24h',
      theme: 'dark',
    });
    expect(parseConfig(JSON.stringify({ timeFormat: 'military', theme: 7 }))).toMatchObject({
      timeFormat: 'device',
      theme: 'device',
    });
  });
});

describe('load', () => {
  test('returns empty records and default config on first run', async () => {
    expect(await load()).toEqual({ wake: {}, bed: {}, config: DEFAULT_CONFIG });
  });

  test('returns what was saved', async () => {
    const wake = { '2026-10-12': { time: '06:45', target: '06:00' } };
    const config = { ...DEFAULT_CONFIG, bedEnabled: true };
    await saveWake(wake);
    await saveConfig(config);
    expect(await load()).toEqual({ wake, bed: {}, config });
  });

  test('a corrupt value is treated as empty', async () => {
    await AsyncStorage.setItem('rise.wake', '{oops');
    expect((await load()).wake).toEqual({});
  });

  test('rejects when storage cannot be read', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('disk'));
    await expect(load()).rejects.toThrow('disk');
  });
});

describe('persist', () => {
  test('sets the new value and reports success', async () => {
    const set = jest.fn();
    const save = jest.fn(async () => {});
    expect(await persist('old', 'new', set, save)).toBe(true);
    expect(set.mock.calls).toEqual([['new']]);
    expect(save).toHaveBeenCalledWith('new');
  });

  test('reverts to the previous value when the save fails', async () => {
    const set = jest.fn();
    const save = jest.fn(async () => {
      throw new Error('full');
    });
    expect(await persist('old', 'new', set, save)).toBe(false);
    expect(set.mock.calls).toEqual([['new'], ['old']]);
  });
});
