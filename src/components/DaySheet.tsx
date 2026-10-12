import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, type MD3Theme, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { type Entry, type Mode, effectiveTarget } from '../lib/time';
import LatenessPill from './LatenessPill';
import TimeField from './TimeField';

type Props = {
  dateKey: string;
  mode: Mode;
  entry: Entry | undefined;
  currentTarget: string;
  applyToPast: boolean;
  hour24: boolean;
  bottomInset: number;
  onSave: (time: string) => void;
  onDelete: () => void;
  onDismiss: () => void;
};

// The sheet for adding, changing or deleting one day. It slides up from the
// bottom edge. Mount it with key={dateKey} so the time starts fresh for each day.
export default function DaySheet({
  dateKey,
  mode,
  entry,
  currentTarget,
  applyToPast,
  hour24,
  bottomInset,
  onSave,
  onDelete,
  onDismiss,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const [time, setTime] = useState(entry?.time ?? currentTarget);
  const target = entry ? effectiveTarget(entry, currentTarget, applyToPast) : currentTarget;
  const name = mode === 'wake' ? 'Wake-up' : 'Bedtime';
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const rise = useRef(new Animated.Value(48)).current;
  useEffect(() => {
    Animated.spring(rise, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
  }, [rise]);

  return (
    <Portal>
      <Modal
        visible
        onDismiss={onDismiss}
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
        {/* Order: title, date, lateness, time, then the buttons. */}
        <Text variant="headlineMedium" accessibilityRole="header" style={styles.title}>
          {name}
        </Text>
        <Text variant="bodyLarge">{date}</Text>
        <LatenessPill target={target} time={time} mode={mode} />
        <TimeField large label={`${name} time`} value={time} hour24={hour24} onChange={setTime} />
        <View style={styles.actions}>
          {/* Delete sits at the far left, apart from Cancel and Save, and is the one red control. */}
          {entry && (
            <Button textColor={theme.colors.error} style={styles.deleteButton} onPress={onDelete}>
              Delete
            </Button>
          )}
          <Button textColor={theme.colors.onSurface} onPress={onDismiss}>
            Cancel
          </Button>
          <Button mode="contained" onPress={() => onSave(time)}>
            Save
          </Button>
        </View>
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
  title: { fontFamily: 'Rubik_500Medium' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  deleteButton: { marginRight: 'auto' },
});
