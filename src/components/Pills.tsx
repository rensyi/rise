import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  fill?: boolean; // pills share the full width equally
};

// A row of separate pills where one is selected. Used for the Wake / Bedtime
// tabs and for three-way settings. The selected pill is ink, never gold.
export default function Pills<T extends string>({ options, value, onChange, fill }: Props<T>) {
  const theme = useTheme<MD3Theme>();

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableRipple
            key={option.value}
            borderless
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              fill && styles.fill,
              { backgroundColor: selected ? theme.colors.primary : theme.colors.elevation.level1 },
            ]}
          >
            <Text
              variant="labelLarge"
              numberOfLines={1}
              style={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}
            >
              {option.label}
            </Text>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8 },
  pill: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { flex: 1, paddingHorizontal: 6 },
});
