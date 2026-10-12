import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Surface, Text, useTheme } from 'react-native-paper';
import { type MonthStats, formatDuration } from '../lib/time';
import { tileColor, tileTextColor } from '../theme';

type Props = {
  stats: MonthStats;
  spread: number | null; // how many minutes the month's times vary by; null with too few days
};

// The month's numbers: three cards, and the consistency score under them.
export default function StatsRow({ stats, spread }: Props) {
  const theme = useTheme<MD3Theme>();
  const card = { bg: theme.colors.elevation.level1, fg: theme.colors.onSurface, round: false };
  const avgLate = stats.avgLate === null ? '—' : stats.avgLate === 0 ? '0m' : `+${stats.avgLate}m`;
  const cards = [
    { label: 'Logged', value: String(stats.logged), ...card },
    // Wins take the gold of an on-time tile and a full pill shape.
    {
      label: 'On time',
      value: String(stats.onTime),
      bg: tileColor(4),
      fg: tileTextColor(4, theme),
      round: true,
    },
    { label: 'Avg late', value: avgLate, ...card },
  ];
  // One point is lost for each minute the times vary by.
  const score = spread === null ? '—' : `${Math.max(0, 100 - spread)}%`;
  const hint = spread === null ? 'Needs two logged days' : `Your times vary by about ${formatDuration(spread)}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {cards.map(({ label, value, bg, fg, round }) => (
          <Surface
            key={label}
            mode="flat"
            elevation={0}
            style={[styles.card, round && styles.round, { backgroundColor: bg }]}
            accessible
            accessibilityLabel={`${label}: ${value}`}
          >
            <Text variant="headlineSmall" style={{ color: fg }}>
              {value}
            </Text>
            <Text variant="labelMedium" style={{ color: fg }}>
              {label}
            </Text>
          </Surface>
        ))}
      </View>
      <Surface
        mode="flat"
        elevation={0}
        style={[styles.wide, { backgroundColor: card.bg }]}
        accessible
        accessibilityLabel={`Consistency: ${spread === null ? '' : `${score}, `}${hint[0].toLowerCase()}${hint.slice(1)}`}
      >
        <View style={styles.wideText}>
          <Text variant="titleMedium">Consistency</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {hint}
          </Text>
        </View>
        <Text variant="headlineSmall">{score}</Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 24 },
  round: { borderRadius: 999 },
  wide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  wideText: { flex: 1, gap: 2 },
});
