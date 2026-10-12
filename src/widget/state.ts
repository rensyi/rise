import {
  type Level,
  type Mode,
  addEntry,
  countedDays,
  dateKey,
  dateOfKey,
  diffMinutes,
  effectiveTarget,
  formatTime,
  latenessLabel,
  level,
  logDateFor,
  recentKeys,
  streakCount,
  streakText,
  targetFor,
  timeOf,
} from '../lib/time';
import { type Data, saveWake } from '../storage';

// What the home-screen widgets show, worked out from what is stored. No
// widget code here, so it can be tested on its own.
export type WidgetState = {
  target: string; // today's wake-up target, ready to show
  logged: { time: string; label: string; level: Level } | null; // today's wake-up
  week: { letter: string; level: Level | 0 }[]; // seven days, oldest first
  streak: [value: string, caption: string];
};

export function widgetState(data: Data, now: Date, hour24: boolean): WidgetState {
  const { config } = data;
  const measured = (mode: Mode, key: string) =>
    effectiveTarget(
      (mode === 'wake' ? data.wake : data.bed)[key],
      targetFor(config, mode, key),
      config.applyTargetsToPast,
    );

  // The log widget is always about waking up.
  const today = dateKey(now);
  const entry = data.wake[today];

  // The streak follows wake-ups or bedtimes, as set up on its tab, and the
  // week beside it shows the same days.
  const mode: Mode = config.bedEnabled ? config.streakFor : 'wake';
  const records = mode === 'wake' ? data.wake : data.bed;
  const end = logDateFor(mode, now);
  const counted = countedDays(
    records,
    mode,
    config.streakRule,
    (key) => targetFor(config, mode, key),
    config.applyTargetsToPast,
  );

  return {
    target: formatTime(targetFor(config, 'wake', today), hour24),
    logged: entry
      ? {
          time: formatTime(entry.time, hour24),
          label: latenessLabel(diffMinutes(measured('wake', today), entry.time, 'wake')),
          level: level(measured('wake', today), entry.time, 'wake'),
        }
      : null,
    week: recentKeys(end, 7)
      .reverse()
      .map((key) => ({
        letter: 'SMTWTFS'[dateOfKey(key).getDay()],
        level: records[key] ? level(measured(mode, key), records[key].time, mode) : 0,
      })),
    streak: streakText(config.streakStyle, streakCount(config.streakStyle, counted, end, end in records)),
  };
}

// The widget's one-tap log: the same rule as in the app. It never overwrites
// a day that already has an entry.
export async function logWakeFromWidget(data: Data, now: Date): Promise<Data> {
  const key = dateKey(now);
  const wake = addEntry(data.wake, key, timeOf(now), targetFor(data.config, 'wake', key));
  if (wake === data.wake) return data;
  await saveWake(wake);
  return { ...data, wake };
}
