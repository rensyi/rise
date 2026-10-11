import { StyleSheet, View } from 'react-native';
import { IconButton, type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';
import {
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
  currentTarget: string;
  applyToPast: boolean;
  todayKey: string;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (key: string) => void;
};

export default function MonthCalendar({
  year,
  month,
  records,
  mode,
  currentTarget,
  applyToPast,
  todayKey,
  onPrev,
  onNext,
  onSelectDay,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const title = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View>
      <View style={styles.header}>
        <IconButton icon="chevron-left" accessibilityLabel="Previous month" onPress={onPrev} />
        <Text variant="titleMedium">{title}</Text>
        <IconButton icon="chevron-right" accessibilityLabel="Next month" onPress={onNext} />
      </View>
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
          const target = entry ? effectiveTarget(entry, currentTarget, applyToPast) : currentTarget;
          const tileLevel = entry ? level(target, entry.time, mode) : 0;
          // Colour is never the only signal: the label carries the time and lateness.
          const spoken = [
            date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }),
            isToday ? 'today' : null,
            entry
              ? `${formatTime(entry.time)}, ${latenessLabel(diffMinutes(target, entry.time, mode))}`
              : 'no entry',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <View key={key} style={styles.cell}>
              <TouchableRipple
                borderless
                disabled={isFuture}
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
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function Legend() {
  const theme = useTheme<MD3Theme>();
  return (
    <View style={styles.legend}>
      {LEGEND.map(([legendLevel, label]) => (
        <View key={legendLevel} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: tileColor(legendLevel) }]} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const CELL_WIDTH = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: CELL_WIDTH, alignItems: 'center', paddingVertical: 4 },
  cell: { width: CELL_WIDTH, aspectRatio: 1, padding: 2 },
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  future: { opacity: 0.38 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
