import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, type MD3Theme, Portal, Text, useTheme } from 'react-native-paper';
import {
  type Entry,
  type Mode,
  diffMinutes,
  effectiveTarget,
  formatTime,
  latenessLabel,
  level,
} from '../lib/time';
import { tileColor, tileTextColor } from '../theme';
import TimeField from './TimeField';

type Props = {
  dateKey: string;
  mode: Mode;
  entry: Entry | undefined;
  currentTarget: string;
  applyToPast: boolean;
  hour24: boolean;
  onSave: (time: string) => void;
  onDelete: () => void;
  onDismiss: () => void;
};

// Mount with key={dateKey} so the time field starts fresh for each day.
export default function DayDialog({
  dateKey,
  mode,
  entry,
  currentTarget,
  applyToPast,
  hour24,
  onSave,
  onDelete,
  onDismiss,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const [time, setTime] = useState(entry?.time ?? currentTarget);
  const target = entry ? effectiveTarget(entry, currentTarget, applyToPast) : currentTarget;
  const tileLevel = level(target, time, mode);
  const name = mode === 'wake' ? 'Wake-up' : 'Bedtime';
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>{name}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodyLarge">{date}</Text>
          <Text variant="bodyMedium">Target {formatTime(target, hour24)}</Text>
          <TimeField label={`${name} time`} value={time} hour24={hour24} onChange={setTime} />
          {/* The preview sits on the screen background so it matches the calendar tile. */}
          <View style={[styles.preview, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.previewFill, { backgroundColor: tileColor(tileLevel) }]}>
              <Text variant="labelLarge" style={{ color: tileTextColor(tileLevel, theme) }}>
                {latenessLabel(diffMinutes(target, time, mode))}
              </Text>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          {entry && (
            <Button textColor={theme.colors.onSurface} onPress={onDelete}>
              Delete
            </Button>
          )}
          <Button textColor={theme.colors.onSurface} onPress={onDismiss}>
            Cancel
          </Button>
          <Button mode="contained" onPress={() => onSave(time)}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  preview: { borderRadius: 8, overflow: 'hidden' },
  previewFill: { alignItems: 'center', paddingVertical: 10 },
});
