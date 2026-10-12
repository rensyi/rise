import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, type MD3Theme, Text, useTheme } from 'react-native-paper';
import { type Entry, type Mode, dateOfKey, effectiveTarget } from '../lib/time';
import LatenessPill from './LatenessPill';
import Sheet from './Sheet';
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

// The sheet for adding, changing or deleting one day. Mount it with
// key={dateKey} so the time starts fresh for each day.
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
  const date = dateOfKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Sheet bottomInset={bottomInset} onDismiss={onDismiss}>
      {(leave) => (
        <>
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
              <Button textColor={theme.colors.error} style={styles.deleteButton} onPress={() => leave(onDelete)}>
                Delete
              </Button>
            )}
            <Button textColor={theme.colors.onSurface} onPress={() => leave(onDismiss)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => leave(() => onSave(time))}>
              Save
            </Button>
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Rubik_500Medium' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  deleteButton: { marginRight: 'auto' },
});
