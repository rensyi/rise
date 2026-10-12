import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { usePressScale } from './Motion';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  fill?: boolean; // pills share the full width equally
};

// A row of separate pills where one is selected. Used for the Wake / Bedtime
// tabs and for three-way settings. The selected pill is ink, never gold.
export default function Pills<T extends string>({ options, value, onChange, fill }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <Pill
          key={option.value}
          label={option.label}
          selected={option.value === value}
          fill={fill}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

type PillProps = { label: string; selected: boolean; fill?: boolean; onPress: () => void };

function Pill({ label, selected, fill, onPress }: PillProps) {
  const theme = useTheme<MD3Theme>();
  const press = usePressScale();

  // A pill that was just chosen dips and springs back.
  const was = useRef(selected);
  useEffect(() => {
    if (selected && !was.current) press.bump();
    was.current = selected;
  });

  return (
    <Animated.View style={[fill && styles.fill, { transform: [{ scale: press.scale }] }]}>
      <TouchableRipple
        borderless
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.pill,
          fill && styles.fillPill,
          { backgroundColor: selected ? theme.colors.primary : theme.colors.elevation.level1 },
        ]}
      >
        <Text
          variant="labelLarge"
          numberOfLines={1}
          style={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}
        >
          {label}
        </Text>
      </TouchableRipple>
    </Animated.View>
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
  fill: { flex: 1 },
  fillPill: { paddingHorizontal: 6 },
});
