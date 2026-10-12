import { Pressable, StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';

type Props = {
  label: string;
  caption: string;
  shape: 'sun' | 'circle'; // sun for waking, a plain disc for bedtime
  onPress: () => void;
};

const SIZE = 184;
const PETAL = 156;
// Three rounded squares turned 30 degrees apart overlap into Material's
// "sunny" shape: a disc with twelve soft scallops.
const TURNS = ['0deg', '30deg', '60deg'];

// The one big button on Today. It is the app's only playful shape.
export default function SunButton({ label, caption, shape, onPress }: Props) {
  const theme = useTheme<MD3Theme>();
  const fill = { backgroundColor: theme.colors.primaryContainer };
  const ink = { color: theme.colors.onPrimaryContainer };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={caption}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {shape === 'sun' ? (
        TURNS.map((turn) => (
          <View key={turn} style={[styles.petal, fill, { transform: [{ rotate: turn }] }]} />
        ))
      ) : (
        <View style={[styles.disc, fill]} />
      )}
      <Text variant="headlineSmall" style={[styles.label, ink]}>
        {label}
      </Text>
      <Text variant="labelMedium" style={ink}>
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.95 }] },
  petal: {
    position: 'absolute',
    left: (SIZE - PETAL) / 2,
    top: (SIZE - PETAL) / 2,
    width: PETAL,
    height: PETAL,
    borderRadius: 46,
  },
  disc: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: SIZE - 12,
    height: SIZE - 12,
    borderRadius: SIZE / 2,
  },
  label: { fontFamily: 'Rubik_500Medium' },
});
