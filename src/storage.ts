import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Config,
  DEFAULT_CONFIG,
  type Mode,
  type Records,
  type StreakRule,
  type StreakStyle,
  type ThemeChoice,
  type TimeFormat,
  dateKey,
  isTime,
} from './lib/time';

const KEYS = { wake: 'rise.wake', bed: 'rise.bed', config: 'rise.config' } as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TIME_FORMATS: readonly unknown[] = ['device', '12h', '24h'];
const THEMES: readonly unknown[] = ['device', 'light', 'dark'];
const MODES: readonly unknown[] = ['wake', 'bed'];
const STREAK_RULES: readonly unknown[] = ['logged', 'near', 'onTime'];
const STREAK_STYLES: readonly unknown[] = ['row', 'seven', 'week'];

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

export type Data = { wake: Records; bed: Records; config: Config };

// Unreadable or wrongly shaped data is dropped entry by entry; valid entries are kept.
export const parseRecords = (raw: string | null): Records => toRecords(parseJson(raw));
export const parseConfig = (raw: string | null): Config => toConfig(parseJson(raw));

function toRecords(data: unknown): Records {
  if (!isObject(data)) return {};
  const records: Records = {};
  for (const [key, value] of Object.entries(data)) {
    if (DATE_RE.test(key) && isObject(value) && isTime(value.time) && isTime(value.target)) {
      records[key] = { time: value.time, target: value.target };
    }
  }
  return records;
}

// Settings saved by an older version lack the newer fields; those take their defaults.
function toConfig(data: unknown): Config {
  if (!isObject(data)) return DEFAULT_CONFIG;
  const time = (key: 'wakeTarget' | 'bedTarget' | 'weekendWakeTarget' | 'weekendBedTarget') =>
    isTime(data[key]) ? data[key] : DEFAULT_CONFIG[key];
  const flag = (key: 'bedEnabled' | 'weekendTargets' | 'reminder' | 'applyTargetsToPast') =>
    typeof data[key] === 'boolean' ? data[key] : DEFAULT_CONFIG[key];
  return {
    wakeTarget: time('wakeTarget'),
    bedEnabled: flag('bedEnabled'),
    bedTarget: time('bedTarget'),
    weekendTargets: flag('weekendTargets'),
    weekendWakeTarget: time('weekendWakeTarget'),
    weekendBedTarget: time('weekendBedTarget'),
    reminder: flag('reminder'),
    streakFor: MODES.includes(data.streakFor) ? (data.streakFor as Mode) : DEFAULT_CONFIG.streakFor,
    streakRule: STREAK_RULES.includes(data.streakRule)
      ? (data.streakRule as StreakRule)
      : DEFAULT_CONFIG.streakRule,
    streakStyle: STREAK_STYLES.includes(data.streakStyle)
      ? (data.streakStyle as StreakStyle)
      : DEFAULT_CONFIG.streakStyle,
    applyTargetsToPast: flag('applyTargetsToPast'),
    timeFormat: TIME_FORMATS.includes(data.timeFormat)
      ? (data.timeFormat as TimeFormat)
      : DEFAULT_CONFIG.timeFormat,
    theme: THEMES.includes(data.theme) ? (data.theme as ThemeChoice) : DEFAULT_CONFIG.theme,
  };
}

// A backup is everything the app stores, in one file.
export const backupName = (now: Date) => `rise-backup-${dateKey(now)}.json`;

export function makeBackup(data: Data, now: Date): string {
  return JSON.stringify({ app: 'rise', version: 1, exportedAt: now.toISOString(), ...data }, null, 2);
}

// null unless the text is a Rise backup. Inside one, entries and settings are
// checked exactly as they are when the app loads.
export function parseBackup(raw: string): Data | null {
  const data = parseJson(raw);
  if (!isObject(data) || data.app !== 'rise' || !isObject(data.wake) || !isObject(data.bed)) return null;
  return { wake: toRecords(data.wake), bed: toRecords(data.bed), config: toConfig(data.config) };
}

export async function replaceAll(data: Data): Promise<void> {
  await Promise.all([saveWake(data.wake), saveBed(data.bed), saveConfig(data.config)]);
}

// Rejects if a read fails, so the app never saves over data it could not read.
export async function load(): Promise<Data> {
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
