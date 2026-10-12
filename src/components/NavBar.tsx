import { StyleSheet, View } from 'react-native';
import { Icon, type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { rowColor } from '../theme';

export type Tab = 'today' | 'calendar' | 'settings';

const ITEMS: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'today', label: 'Today', icon: 'white-balance-sunny' },
  { tab: 'calendar', label: 'Calendar', icon: 'calendar-month-outline' },
  { tab: 'settings', label: 'Settings', icon: 'tune-variant' },
];

// Height the bar takes up above the bottom inset, for screens to pad their content by.
export const NAV_SPACE = 96;

type Props = { tab: Tab; bottomInset: number; onChange: (tab: Tab) => void };

// The floating bottom bar: clear of the screen edges, with a pill behind the active item.
export default function NavBar({ tab, bottomInset, onChange }: Props) {
  const theme = useTheme<MD3Theme>();

  return (
    <View
      style={[
        styles.bar,
        { bottom: bottomInset + 12, backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant },
      ]}
    >
      {ITEMS.map((item) => {
        const active = item.tab === tab;
        const color = active ? theme.colors.onSurface : theme.colors.onSurfaceVariant;
        return (
          <TouchableRipple
            key={item.tab}
            borderless
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.tab)}
            style={styles.item}
          >
            <View style={styles.itemContent}>
              <View style={[styles.iconPill, active && { backgroundColor: rowColor(theme) }]}>
                <Icon source={item.icon} size={22} color={color} />
              </View>
              <Text variant={active ? 'labelLarge' : 'labelMedium'} style={{ color }}>
                {item.label}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    borderRadius: 32,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, borderRadius: 24 },
  itemContent: { alignItems: 'center', gap: 4, paddingVertical: 4 },
  iconPill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 20 },
});
