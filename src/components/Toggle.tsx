import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { type MD3Theme, useTheme } from 'react-native-paper';
import { rowSecondaryColor } from '../theme';
import { SPRING, motionOff } from './Motion';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
};

const TRACK = { width: 52, height: 32, border: 2 };
const DOT = 16;
// The dot sits one gap in from either end, and grows by half when on.
const GAP = (TRACK.height - 2 * TRACK.border - DOT) / 2;
const TRAVEL = TRACK.width - 2 * TRACK.border - 2 * GAP - DOT;

// The app's on/off switch, in the Material 3 shape: an outlined track with a
// small dot when off, a filled track with a larger dot when on. It is drawn
// here, not taken from the phone, so it looks the same on Android and iPhone
// and follows the ink colours of the theme.
export default function Toggle({ value, onValueChange, accessibilityLabel }: Props) {
  const theme = useTheme<MD3Theme>();
  const offColor = rowSecondaryColor(theme);
  const onColor = theme.colors.onSurface;

  // 0 is off and 1 is on. The dot springs from one to the other.
  const t = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (motionOff()) return t.setValue(value ? 1 : 0);
    const slide = Animated.spring(t, { ...SPRING, toValue: value ? 1 : 0 });
    slide.start();
    return () => slide.stop();
  }, [value, t]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={[
        styles.track,
        { borderColor: value ? onColor : offColor, backgroundColor: value ? onColor : 'transparent' },
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: value ? theme.colors.background : offColor,
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) },
              { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK.width,
    height: TRACK.height,
    borderRadius: TRACK.height / 2,
    borderWidth: TRACK.border,
    justifyContent: 'center',
    paddingLeft: GAP,
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
