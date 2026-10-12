import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Surface, Text, useTheme } from 'react-native-paper';
import type { MonthStats } from '../lib/time';
import { tileColor, tileTextColor } from '../theme';

type Props = { stats: MonthStats };

export default function StatsRow({ stats }: Props) {
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

  return (
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
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 24 },
  round: { borderRadius: 999 },
});
