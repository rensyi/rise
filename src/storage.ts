import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Config,
  DEFAULT_CONFIG,
  type Records,
  type ThemeChoice,
  type TimeFormat,
  isTime,
} from './lib/time';

const KEYS = { wake: 'rise.wake', bed: 'rise.bed', config: 'rise.config' } as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TIME_FORMATS: readonly unknown[] = ['device', '12h', '24h'];
const THEMES: readonly unknown[] = ['device', 'light', 'dark'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Unreadable or wrongly shaped data is dropped entry by entry; valid entries are kept.
export function parseRecords(raw: string | null): Records {
  const data = parseJson(raw);
  if (!isObject(data)) return {};
  const records: Records = {};
  for (const [key, value] of Object.entries(data)) {
    if (DATE_RE.test(key) && isObject(value) && isTime(value.time) && isTime(value.target)) {
      records[key] = { time: value.time, target: value.target };
    }
  }
  return records;
}

export function parseConfig(raw: string | null): Config {
  const data = parseJson(raw);
  if (!isObject(data)) return DEFAULT_CONFIG;
  return {
    wakeTarget: isTime(data.wakeTarget) ? data.wakeTarget : DEFAULT_CONFIG.wakeTarget,
    bedEnabled: typeof data.bedEnabled === 'boolean' ? data.bedEnabled : DEFAULT_CONFIG.bedEnabled,
    bedTarget: isTime(data.bedTarget) ? data.bedTarget : DEFAULT_CONFIG.bedTarget,
    applyTargetsToPast:
      typeof data.applyTargetsToPast === 'boolean'
        ? data.applyTargetsToPast
        : DEFAULT_CONFIG.applyTargetsToPast,
    timeFormat: TIME_FORMATS.includes(data.timeFormat)
      ? (data.timeFormat as TimeFormat)
      : DEFAULT_CONFIG.timeFormat,
    theme: THEMES.includes(data.theme) ? (data.theme as ThemeChoice) : DEFAULT_CONFIG.theme,
  };
}

// Rejects if a read fails, so the app never saves over data it could not read.
export async function load(): Promise<{ wake: Records; bed: Records; config: Config }> {
  const [wake, bed, config] = await Promise.all([
    AsyncStorage.getItem(KEYS.wake),
    AsyncStorage.getItem(KEYS.bed),
    AsyncStorage.getItem(KEYS.config),
  ]);
  return { wake: parseRecords(wake), bed: parseRecords(bed), config: parseConfig(config) };
}

export const saveWake = (records: Records) => AsyncStorage.setItem(KEYS.wake, JSON.stringify(records));
export const saveBed = (records: Records) => AsyncStorage.setItem(KEYS.bed, JSON.stringify(records));
export const saveConfig = (config: Config) => AsyncStorage.setItem(KEYS.config, JSON.stringify(config));

// Shows `next` at once, then reverts to `prev` if the save fails.
export async function persist<T>(
  prev: T,
  next: T,
  set: (value: T) => void,
  save: (value: T) => Promise<void>,
): Promise<boolean> {
  set(next);
  try {
    await save(next);
    return true;
  } catch {
    set(prev);
    return false;
  }
}
