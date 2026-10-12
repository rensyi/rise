import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';
import {
  CELL_WIDTH,
  type Level,
  type Mode,
  type Records,
  dateKey,
  diffMinutes,
  effectiveTarget,
  formatTime,
  latenessLabel,
  level,
  monthCells,
} from '../lib/time';
import { tileColor, tileTextColor } from '../theme';
import { Enter, useEntered } from './Motion';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const LEGEND: [Level, string][] = [
  [4, 'On time'],
  [3, 'Up to 30m late'],
  [2, 'Up to 60m late'],
  [1, 'Later'],
];

type Props = {
  year: number;
  month: number; // 0-based
  records: Records;
  mode: Mode;
  targetOn: (key: string) => string; // the current target for a day
  applyToPast: boolean;
  hour24: boolean;
  todayKey: string;
  onSelectDay: (key: string) => void;
  // The Streak tab passes the days that count. Only those are filled, in their
  // usual colours, and tapping a day opens nothing.
  counted?: Set<string>;
};

export default function MonthCalendar({
  year,
  month,
  records,
  mode,
  targetOn,
  applyToPast,
  hour24,
  todayKey,
  onSelectDay,
  counted,
}: Props) {
  const theme = useTheme<MD3Theme>();
  // When the month first appears its tiles pop in one after another, as a wave.
  // Give the calendar a new key to play the wave again.
  const entered = useEntered();

  return (
    <View>
      <View style={styles.grid}>
        {WEEKDAYS.map((name, i) => (
          <View key={`weekday-${i}`} style={styles.weekday}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {name}
            </Text>
          </View>
        ))}
        {monthCells(year, month).map((day, i) => {
          if (day === null) return <View key={`blank-${i}`} style={styles.cell} />;

          const date = new Date(year, month, day);
          const key = dateKey(date);
          const entry = records[key];
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const target = entry ? effectiveTarget(entry, targetOn(key), applyToPast) : targetOn(key);
          const hit = counted?.has(key);
          // On the Streak tab a day that does not count is left empty, whatever was logged.
          const tileLevel = entry && (!counted || hit) ? level(target, entry.time, mode) : 0;
          // Colour is never the only signal: the label carries the time and lateness.
          const spoken = [
            date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }),
            isToday ? 'today' : null,
            counted
              ? hit
                ? 'counts towards your streak'
                : 'does not count'
              : entry
                ? `${formatTime(entry.time, hour24)}, ${latenessLabel(diffMinutes(target, entry.time, mode))}`
                : 'no entry',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            // The key holds the level, so a tile pops again when a save or delete changes its colour.
            <Enter
              key={`${key}-${tileLevel}`}
              pop
              delay={entered.current ? 0 : day * 12}
              style={styles.cell}
            >
              <TouchableRipple
                borderless
                disabled={isFuture || !!counted}
                onPress={() => onSelectDay(key)}
                accessibilityRole="button"
                accessibilityLabel={spoken}
                style={[
                  styles.tile,
                  { borderColor: theme.colors.outlineVariant },
                  tileLevel !== 0 && { backgroundColor: tileColor(tileLevel), borderWidth: 0 },
                  isToday && { borderWidth: 2, borderColor: theme.colors.onSurface },
                  isFuture && styles.future,
                ]}
              >
                <Text variant="labelLarge" style={{ color: tileTextColor(tileLevel, theme) }}>
                  {day}
                </Text>
              </TouchableRipple>
            </Enter>
          );
        })}
      </View>
    </View>
  );
}

// The four tile colours and what each means. On the Streak tab, `streak` is
// the lowest level that counts: the legend then shows the colours of the days
// that count together, and an empty tile for the rest.
export function Legend({ streak }: { streak?: Level }) {
  const theme = useTheme<MD3Theme>();
  const swatch = (legendLevel: Level | 0) => (
    <View
      key={legendLevel}
      style={[
        styles.swatch,
        legendLevel === 0
          ? { borderWidth: 1, borderColor: theme.colors.outline }
          : { backgroundColor: tileColor(legendLevel) },
      ]}
    />
  );
  const item = (swatches: (Level | 0)[], label: string) => (
    <View key={label} style={styles.legendItem}>
      {swatches.map(swatch)}
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
  const levels = LEGEND.map(([legendLevel]) => legendLevel);

  return (
    <View style={styles.legend}>
      {streak
        ? [item(levels.filter((legendLevel) => legendLevel >= streak), 'Counts'), item([0], 'Does not count')]
        : LEGEND.map(([legendLevel, label]) => item([legendLevel], label))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: CELL_WIDTH, alignItems: 'center', paddingVertical: 4 },
  cell: { width: CELL_WIDTH, aspectRatio: 1, padding: 2 },
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1 },
  future: { opacity: 0.38 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});
