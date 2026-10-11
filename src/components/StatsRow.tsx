import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Surface, Text, useTheme } from 'react-native-paper';
import type { MonthStats } from '../lib/time';
import { palette } from '../theme';

type Props = { stats: MonthStats };

export default function StatsRow({ stats }: Props) {
  const theme = useTheme<MD3Theme>();
  const card = { bg: theme.colors.elevation.level1, fg: theme.colors.onSurface };
  const avgLate = stats.avgLate === null ? '—' : stats.avgLate === 0 ? '0m' : `+${stats.avgLate}m`;
  const cards = [
    { label: 'Logged', value: String(stats.logged), ...card },
    // Butter sun marks wins. It is a fill only: text on it is always deep plum.
    { label: 'On time', value: String(stats.onTime), bg: palette.butterSun, fg: palette.deepPlum },
    { label: 'Avg late', value: avgLate, ...card },
  ];

  return (
    <View style={styles.row}>
      {cards.map(({ label, value, bg, fg }) => (
        <Surface
          key={label}
          mode="flat"
          elevation={0}
          style={[styles.card, { backgroundColor: bg }]}
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
  card: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
});
