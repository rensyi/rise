import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Switch, Text } from 'react-native-paper';
import type { Config } from '../lib/time';
import TimeField from './TimeField';

type Props = {
  visible: boolean;
  config: Config;
  onChange: (next: Config) => void;
  onDismiss: () => void;
};

// Every change applies at once; there is no separate save step.
export default function SettingsDialog({ visible, config, onChange, onDismiss }: Props) {
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Settings</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Row label="Target wake-up time">
            <TimeField
              label="Target wake-up time"
              value={config.wakeTarget}
              onChange={(wakeTarget) => set({ wakeTarget })}
            />
          </Row>
          <Row
            label="Apply targets to past days"
            hint="Off: each day keeps the target it was logged with."
          >
            <Switch
              accessibilityLabel="Apply targets to past days"
              value={config.applyTargetsToPast}
              onValueChange={(applyTargetsToPast) => set({ applyTargetsToPast })}
            />
          </Row>
          <Row label="Track bedtime">
            <Switch
              accessibilityLabel="Track bedtime"
              value={config.bedEnabled}
              onValueChange={(bedEnabled) => set({ bedEnabled })}
            />
          </Row>
          {config.bedEnabled && (
            <Row label="Target bedtime">
              <TimeField
                label="Target bedtime"
                value={config.bedTarget}
                onChange={(bedTarget) => set({ bedTarget })}
              />
            </Row>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="contained" onPress={onDismiss}>
            Done
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text variant="bodyLarge">{label}</Text>
        {hint && <Text variant="bodySmall">{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1 },
});
