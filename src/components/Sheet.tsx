import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { type MD3Theme, Modal, Portal, useTheme } from 'react-native-paper';
import { motionOff } from './Motion';

// How far below its resting place the sheet starts and ends: more than its own height.
const AWAY = 480;

type Props = {
  bottomInset: number;
  onDismiss: () => void;
  // Given `leave`, which slides the sheet away and then runs what it is handed.
  // Buttons that close the sheet go through it.
  children: (leave: (then: () => void) => void) => ReactNode;
};

// A panel that slides up from the bottom edge and back down. Mount it to open it.
export default function Sheet({ bottomInset, onDismiss, children }: Props) {
  const theme = useTheme<MD3Theme>();
  const [open, setOpen] = useState(true);
  const rise = useRef(new Animated.Value(motionOff() ? 0 : AWAY)).current;
  useEffect(() => {
    Animated.timing(rise, {
      toValue: 0,
      duration: 440,
      easing: Easing.bezier(0.2, 0.9, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const leave = (then: () => void) => {
    if (motionOff()) return then();
    setOpen(false);
    Animated.timing(rise, {
      toValue: AWAY,
      duration: 240,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => then());
  };

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={() => leave(onDismiss)}
        style={styles.wrapper}
        contentContainerStyle={[
          styles.sheet,
          {
            backgroundColor: theme.colors.elevation.level3,
            paddingBottom: bottomInset + 20,
            transform: [{ translateY: rise }],
          },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: theme.colors.outline }]} />
        {children(leave)}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  // The sheet reaches the bottom edge, so the modal's own bottom margin is removed.
  wrapper: { justifyContent: 'flex-end', marginBottom: 0 },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 24,
    gap: 12,
    justifyContent: 'flex-start',
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, opacity: 0.6, marginBottom: 6 },
});
