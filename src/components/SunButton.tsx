import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { sunPath } from '../lib/sun';
import { motionOff, usePressScale } from './Motion';

type Props = {
  label: string;
  caption: string;
  shape: 'sun' | 'circle'; // sun for waking, a plain disc for bedtime
  onPress: () => void;
};

const SIZE = 184;
// Material's "sunny" shape: a disc with ten soft scallops.
const OUTLINE = sunPath(SIZE);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The one big button on Today. It is the app's only playful shape.
export default function SunButton({ label, caption, shape, onPress }: Props) {
  const theme = useTheme<MD3Theme>();
  const ink = { color: theme.colors.onPrimaryContainer };
  const press = usePressScale(0.92);

  // The sun turns once a minute. Its label stays upright.
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (shape !== 'sun' || motionOff()) return;
    const spin = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 60_000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [shape, turn]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={caption}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.wrap, { transform: [{ scale: press.scale }] }]}
    >
      {shape === 'sun' ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
          ]}
        >
          <Svg width={SIZE} height={SIZE}>
            <Path d={OUTLINE} fill={theme.colors.primaryContainer} />
          </Svg>
        </Animated.View>
      ) : (
        <>
          <View style={[styles.disc, { backgroundColor: theme.colors.primaryContainer }]} />
          <Zs color={theme.colors.onSurface} />
        </>
      )}
      <Text variant="headlineSmall" style={[styles.label, ink]}>
        {label}
      </Text>
      <Text variant="labelMedium" style={ink}>
        {caption}
      </Text>
    </AnimatedPressable>
  );
}

const Z_DRIFT = 1800;
// Where a Z is along its path, from leaving the button (0) to fading out (1).
const Z_PATH = [0, 0.15, 0.7, 1];

// Zs drift off the "In bed" button at uneven moments. They share one path, so
// a wait of at least 0.75s keeps each one clear of the one before it, and no
// more than three are ever on their way.
function Zs({ color }: { color: string }) {
  const still = motionOff();
  // With reduced motion they stand in a rising line instead.
  const pool = useRef([0.15, 0.45, 0.7].map((at) => new Animated.Value(still ? at : 0))).current;
  useEffect(() => {
    if (still) return;
    let sent = 0;
    let timer: ReturnType<typeof setTimeout>;
    const send = () => {
      const z = pool[sent++ % pool.length];
      z.setValue(0);
      Animated.timing(z, {
        toValue: 1,
        duration: Z_DRIFT,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
      timer = setTimeout(send, 750 + Math.random() * 850);
    };
    timer = setTimeout(send, 300);
    return () => {
      clearTimeout(timer);
      pool.forEach((z) => z.stopAnimation());
    };
  }, [pool, still]);

  return pool.map((z, i) => (
    <Animated.Text
      key={i}
      style={[
        styles.z,
        {
          color,
          opacity: z.interpolate({ inputRange: Z_PATH, outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: z.interpolate({ inputRange: Z_PATH, outputRange: [0, 4, 20, 30] }) },
            { translateY: z.interpolate({ inputRange: Z_PATH, outputRange: [0, -7, -35, -50] }) },
            { scale: z.interpolate({ inputRange: Z_PATH, outputRange: [0.4, 1, 1.32, 1.5] }) },
            { rotate: z.interpolate({ inputRange: Z_PATH, outputRange: ['-10deg', '-4deg', '5deg', '10deg'] }) },
          ],
        },
      ]}
    >
      Z
    </Animated.Text>
  ));
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  disc: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: SIZE - 12,
    height: SIZE - 12,
    borderRadius: SIZE / 2,
  },
  z: { position: 'absolute', left: 148, top: 14, fontFamily: 'Rubik_500Medium', fontSize: 22 },
  label: { fontFamily: 'Rubik_500Medium' },
});
