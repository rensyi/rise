import { type ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

// Everything that moves in the app goes through this file, so the device's
// "reduce motion" setting can switch all of it off in one place.
let reduced = false;
export const motionOff = () => reduced;

// Follows the device setting. Call it from an effect; it returns the cleanup.
export function watchReduceMotion() {
  AccessibilityInfo.isReduceMotionEnabled().then((on) => {
    reduced = on;
  });
  const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => {
    reduced = on;
  });
  return () => subscription.remove();
}

export const EASE = Easing.bezier(0.2, 0, 0, 1);
const SPRING = { tension: 220, friction: 16, useNativeDriver: true };

type EnterProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  x?: number; // starts this far to the right
  y?: number; // starts this far down
  scaleX?: number; // starts this wide
  pop?: boolean; // springs up from a smaller size instead of easing in
  delay?: number;
  off?: boolean; // appear in place, with no movement
};

// Fades its children in when it mounts. Change its key to play it again.
export function Enter({ children, style, x = 0, y = 0, scaleX = 1, pop, delay = 0, off }: EnterProps) {
  const still = off || reduced;
  const t = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    const animation = pop
      ? Animated.spring(t, { ...SPRING, toValue: 1, delay })
      : Animated.timing(t, { toValue: 1, duration: 300, delay, easing: EASE, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
    // Its props are read once, when it mounts.
  }, []);
  const from = (start: number, end: number) => t.interpolate({ inputRange: [0, 1], outputRange: [start, end] });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateX: from(x, 0) },
            { translateY: from(y, 0) },
            { scaleX: from(scaleX, 1) },
            { scale: from(pop ? 0.84 : 1, 1) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// False while a screen draws for the first time, true after. Pass
// off={!entered.current} so a movement answers a tap but does not replay
// every time the screen is opened.
export function useEntered() {
  const entered = useRef(false);
  useEffect(() => {
    entered.current = true;
  }, []);
  return entered;
}

// A scale that dips while a control is pressed and springs back on release.
// bump() plays the same dip once, for a control that was just chosen.
export function usePressScale(pressed = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (toValue: number) => Animated.spring(scale, { ...SPRING, toValue }).start();
  return {
    scale,
    onPressIn: () => {
      if (!reduced) springTo(pressed);
    },
    onPressOut: () => springTo(1),
    bump: () => {
      if (reduced) return;
      scale.setValue(0.9);
      springTo(1);
    },
  };
}
