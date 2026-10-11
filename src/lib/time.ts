export type Mode = 'wake' | 'bed';
export type Entry = { time: string; target: string };
export type Records = Record<string, Entry>;
export type Level = 1 | 2 | 3 | 4;
export type Config = {
  wakeTarget: string;
  bedEnabled: boolean;
  bedTarget: string;
  applyTargetsToPast: boolean;
};
export type MonthStats = { logged: number; onTime: number; avgLate: number | null };

export const DEFAULT_CONFIG: Config = {
  wakeTarget: '06:00',
  bedEnabled: false,
  bedTarget: '22:00',
  applyTargetsToPast: false,
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

export function latenessLabel(diff: number): string {
  if (diff === 0) return 'On time';
  if (diff < 0) return `${-diff}m early`;
  if (diff < 120) return `${diff}m late`;
  return `${Math.round(diff / 6) / 10}h late`;
}

export function effectiveTarget(entry: Entry, currentTarget: string, applyToPast: boolean): string {
  return applyToPast ? currentTarget : entry.target;
}

// month is 0-based, as in Date.
export function monthStats(
  records: Records,
  year: number,
  month: number,
  mode: Mode,
  currentTarget: string,
  applyToPast: boolean,
): MonthStats {
  const prefix = `${year}-${pad(month + 1)}-`;
  const diffs = Object.keys(records)
    .filter((key) => key.startsWith(prefix))
    .map((key) =>
      diffMinutes(effectiveTarget(records[key], currentTarget, applyToPast), records[key].time, mode),
    );
  if (diffs.length === 0) return { logged: 0, onTime: 0, avgLate: null };
  const late = diffs.reduce((sum, diff) => sum + Math.max(0, diff), 0);
  return {
    logged: diffs.length,
    onTime: diffs.filter((diff) => diff <= 0).length,
    avgLate: Math.round(late / diffs.length),
  };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

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

// Day dialog: a new entry stores the current target, an edit keeps the stored one.
export function upsertEntry(records: Records, key: string, time: string, currentTarget: string): Records {
  return { ...records, [key]: { time, target: records[key]?.target ?? currentTarget } };
}

export function removeEntry(records: Records, key: string): Records {
  const { [key]: _removed, ...rest } = records;
  return rest;
}

export function formatTime(time: string, locale?: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(2000, 0, 1, h, m),
  );
}

export function uses24Hour(locale?: string): boolean {
  return !new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12;
}
