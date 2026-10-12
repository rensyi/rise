import { StyleSheet, View } from 'react-native';
import { Button, type MD3Theme, Text, useTheme } from 'react-native-paper';
import type { PickedBackup } from '../backup';
import { countOf, dateOfKey } from '../lib/time';
import Sheet from './Sheet';

type Props = {
  backup: PickedBackup;
  bottomInset: number;
  onRestore: () => void;
  onDismiss: () => void;
};

// Restoring replaces everything, so this says what is in the file and asks first.
export default function RestoreSheet({ backup, bottomInset, onRestore, onDismiss }: Props) {
  const theme = useTheme<MD3Theme>();
  const { wake, bed } = backup.data;
  const latest = [...Object.keys(wake), ...Object.keys(bed)].sort().at(-1);
  const upTo = latest
    ? `, up to ${dateOfKey(latest).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '';
  const summary = `${countOf(wake, 'wake-up')} and ${countOf(bed, 'bedtime')}${upTo}.`;

  return (
    <Sheet bottomInset={bottomInset} onDismiss={onDismiss}>
      {(leave) => (
        <>
          <Text variant="headlineMedium" accessibilityRole="header" style={styles.title}>
            Restore?
          </Text>
          <Text variant="bodyLarge">{backup.name}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {`${summary} This replaces everything on this phone.`}
          </Text>
          <View style={styles.actions}>
            <Button textColor={theme.colors.onSurface} onPress={() => leave(onDismiss)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={() => leave(onRestore)}>
              Replace
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
});
