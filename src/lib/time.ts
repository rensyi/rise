export type Mode = 'wake' | 'bed';
export type Entry = { time: string; target: string };
export type Records = Record<string, Entry>;
export type Level = 1 | 2 | 3 | 4;
export type TimeFormat = 'device' | '12h' | '24h';
export type ThemeChoice = 'device' | 'light' | 'dark';
// A day counts when it is logged at all, within 30 minutes of target, or on time.
export type StreakRule = 'logged' | 'near' | 'onTime';
// Counted as days in a row, out of the last seven days, or since Sunday.
export type StreakStyle = 'row' | 'seven' | 'week';
export type Config = {
  wakeTarget: string;
  bedEnabled: boolean;
  bedTarget: string;
  weekendTargets: boolean; // a different target on weekends
  weekendWakeTarget: string;
  weekendBedTarget: string;
  reminder: boolean; // a notification at the wake-up target
  streakFor: Mode; // the streak follows wake-ups or bedtimes
  streakRule: StreakRule;
  streakStyle: StreakStyle;
  applyTargetsToPast: boolean;
  timeFormat: TimeFormat;
  theme: ThemeChoice;
};
export type MonthView = { year: number; month: number }; // month is 0-based
export type MonthStats = { logged: number; onTime: number; avgLate: number | null };

export const DEFAULT_CONFIG: Config = {
  wakeTarget: '06:00',
  bedEnabled: false,
  bedTarget: '22:00',
  weekendTargets: false,
  weekendWakeTarget: '08:00',
  weekendBedTarget: '23:00',
  reminder: false,
  streakFor: 'wake',
  streakRule: 'logged',
  streakStyle: 'row',
  applyTargetsToPast: false,
  timeFormat: 'device',
  theme: 'device',
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const pad = (n: number) => String(n).padStart(2, '0');

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeOf(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// A bedtime logged before noon belongs to the night before.
export function bedDateFor(now: Date): string {
  const date = new Date(now);
  if (date.getHours() < 12) date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function logDateFor(mode: Mode, now: Date): string {
  return mode === 'bed' ? bedDateFor(now) : dateKey(now);
}

// True while two moments would log to the same day in both modes. It turns
// false at midnight (a new day) and at noon (bedtimes start counting for today).
export function sameLogDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b) && bedDateFor(a) === bedDateFor(b);
}

// Bedtimes cross midnight, so bed mode compares on a noon-to-noon clock.
export function diffMinutes(target: string, logged: string, mode: Mode): number {
  const place = (min: number) => (mode === 'bed' && min < 720 ? min + 1440 : min);
  return place(parseTime(logged)) - place(parseTime(target));
}

export function level(target: string, logged: string, mode: Mode): Level {
  const diff = diffMinutes(target, logged, mode);
  if (diff <= 0) return 4;
  if (diff <= 30) return 3;
  if (diff <= 60) return 2;
  return 1;
}

// "45mins", "1hr", "2hrs 30mins". Times are stored to the minute, so there are no seconds.
export function formatDuration(minutes: number): string {
  const plural = (n: number, unit: string) => `${n}${unit}${n === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return plural(rest, 'min');
  return rest === 0 ? plural(hours, 'hr') : `${plural(hours, 'hr')} ${plural(rest, 'min')}`;
}

// `short` drops the minutes once there is a full hour ("5hrs early"), for
// places with little room.
export function latenessLabel(diff: number, short = false): string {
  if (diff === 0) return 'On time';
  const size = Math.abs(diff);
  const shown = short && size >= 60 ? size - (size % 60) : size;
  return `${formatDuration(shown)} ${diff < 0 ? 'early' : 'late'}`;
}

// "1 wake-up", "28 bedtimes".
export function countOf(records: Records, noun: string): string {
  const count = Object.keys(records).length;
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function effectiveTarget(entry: Entry, currentTarget: string, applyToPast: boolean): string {
  return applyToPast ? currentTarget : entry.target;
}

// The local date a day's key stands for.
export function dateOfKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// The current target for a day of the week (0 is Sunday). With weekend targets
// on, weekend mornings are Saturday and Sunday, and weekend nights are the
// ones before them: Friday and Saturday.
export function targetOnWeekday(config: Config, mode: Mode, weekday: number): string {
  const wake = mode === 'wake';
  const weekend = config.weekendTargets && (weekday === 6 || weekday === (wake ? 0 : 5));
  if (wake) return weekend ? config.weekendWakeTarget : config.wakeTarget;
  return weekend ? config.weekendBedTarget : config.bedTarget;
}

// The current target for the day an entry is logged under.
export function targetFor(config: Config, mode: Mode, key: string): string {
  return targetOnWeekday(config, mode, dateOfKey(key).getDay());
}

// The streak is set up by the user: which days count, and how they are counted.
// The lowest tile level that counts under each rule; any logged day has at least 1.
export const RULE_LEVEL: Record<StreakRule, Level> = { logged: 1, near: 3, onTime: 4 };

// The days that count towards the streak, oldest first.
export function countedDays(
  records: Records,
  mode: Mode,
  rule: StreakRule,
  targetOn: (key: string) => string,
  applyToPast: boolean,
): Set<string> {
  const counts = (key: string) =>
    level(effectiveTarget(records[key], targetOn(key), applyToPast), records[key].time, mode) >= RULE_LEVEL[rule];
  return new Set(Object.keys(records).sort().filter(counts));
}

// The streak's number, for the day a tap would log to.
// - row: days in a row ending there. If that day is not logged yet it does
//   not break the run, which then ends the day before.
// - seven: how many of the seven days ending there count. It never resets.
// - week: how many count since the most recent Sunday.
export function streakCount(
  style: StreakStyle,
  counted: Set<string>,
  endKey: string,
  endLogged: boolean,
): number {
  if (style !== 'row') {
    const span = style === 'seven' ? 7 : dateOfKey(endKey).getDay() + 1;
    return recentKeys(endKey, span).filter((key) => counted.has(key)).length;
  }
  const end = dateOfKey(endKey);
  const back = (days: number) =>
    dateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - days));
  const start = endLogged ? 0 : 1;
  let count = 0;
  while (counted.has(back(start + count))) count++;
  return count;
}

// The streak as it is shown: the number, and what it counts.
export function streakText(style: StreakStyle, count: number): [value: string, caption: string] {
  if (style === 'seven') return [`${count}/7`, 'of the last 7 days'];
  if (style === 'week') return [String(count), 'this week, since Sunday'];
  return [String(count), count === 1 ? 'day in a row' : 'days in a row'];
}

// The longest stretch of counted days in a row, ever.
export function bestRun(counted: Set<string>): number {
  let best = 0;
  let run = 0;
  let expected = '';
  for (const key of [...counted].sort()) {
    run = key === expected ? run + 1 : 1;
    best = Math.max(best, run);
    const date = dateOfKey(key);
    expected = dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
  }
  return best;
}

const inMonth = (records: Records, year: number, month: number) =>
  Object.keys(records).filter((key) => key.startsWith(`${year}-${pad(month + 1)}-`));

// How close together a month's times are, whatever the target: the average
// distance from the mean time, in minutes. null with fewer than two days.
export function spreadMinutes(records: Records, year: number, month: number, mode: Mode): number | null {
  // Measured from noon, so bedtimes either side of midnight sit next to each other.
  const times = inMonth(records, year, month).map((key) => diffMinutes('12:00', records[key].time, mode));
  if (times.length < 2) return null;
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  return Math.round(times.reduce((sum, time) => sum + Math.abs(time - mean), 0) / times.length);
}

// month is 0-based, as in Date. `targetOn` gives the current target for a day.
export function monthStats(
  records: Records,
  year: number,
  month: number,
  mode: Mode,
  targetOn: (key: string) => string,
  applyToPast: boolean,
): MonthStats {
  const diffs = inMonth(records, year, month).map((key) =>
    diffMinutes(effectiveTarget(records[key], targetOn(key), applyToPast), records[key].time, mode),
  );
  if (diffs.length === 0) return { logged: 0, onTime: 0, avgLate: null };
  const late = diffs.reduce((sum, diff) => sum + Math.max(0, diff), 0);
  return {
    logged: diffs.length,
    onTime: diffs.filter((diff) => diff <= 0).length,
    avgLate: Math.round(late / diffs.length),
  };
}

export function shiftMonth(year: number, month: number, delta: number): MonthView {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

// A day and the days before it, newest first.
export function recentKeys(endKey: string, count: number): string[] {
  const [year, month, day] = endKey.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => dateKey(new Date(year, month - 1, day - i)));
}

export function monthOfKey(key: string): MonthView {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

// When "today" moves into a new month, the calendar follows it, but only if it
// was showing the old current month. A month the user browsed to is left alone.
export function followMonth(view: MonthView, before: Date, after: Date): MonthView {
  const moved =
    before.getFullYear() !== after.getFullYear() || before.getMonth() !== after.getMonth();
  const showedCurrent = view.year === before.getFullYear() && view.month === before.getMonth();
  return moved && showedCurrent ? { year: after.getFullYear(), month: after.getMonth() } : view;
}

// Width of one calendar cell; seven make a week row. Kept just under 100/7:
// at exactly 100/7 the row overflows by a rounding error on some screen widths
// and the seventh day wraps onto the next line.
export const CELL_WIDTH = '14.28%';

// Leading nulls pad the first week so day 1 lands under its weekday (Sunday first).
export function monthCells(year: number, month: number): (number | null)[] {
  const blanks = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array<null>(blanks).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

// One-tap logging: never overwrites a day that already has an entry.
export function addEntry(records: Records, key: string, time: string, currentTarget: string): Records {
  if (records[key]) return records;
  return { ...records, [key]: { time, target: currentTarget } };
}

// Day sheet: a new entry stores the current target, an edit keeps the stored one.
export function upsertEntry(records: Records, key: string, time: string, currentTarget: string): Records {
  return { ...records, [key]: { time, target: records[key]?.target ?? currentTarget } };
}

export function removeEntry(records: Records, key: string): Records {
  const { [key]: _removed, ...rest } = records;
  return rest;
}

// Formats a stored HH:mm time for display. Done by hand, not with Intl: Intl
// follows the language region and ignores the phone's own 12/24-hour switch.
export function formatTime(time: string, hour24: boolean): string {
  if (hour24) return time;
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

export function resolveHour24(choice: TimeFormat, deviceHour24: boolean): boolean {
  return choice === 'device' ? deviceHour24 : choice === '24h';
}

export function resolveDark(choice: ThemeChoice, deviceDark: boolean): boolean {
  return choice === 'device' ? deviceDark : choice === 'dark';
}
