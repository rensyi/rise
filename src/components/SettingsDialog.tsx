import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Portal, SegmentedButtons, Switch, Text } from 'react-native-paper';
import type { Config } from '../lib/time';
import TimeField from './TimeField';

type Props = {
  visible: boolean;
  config: Config;
  hour24: boolean;
  onChange: (next: Config) => void;
  onDismiss: () => void;
};

// Every change applies at once; there is no separate save step.
export default function SettingsDialog({ visible, config, hour24, onChange, onDismiss }: Props) {
  const { height } = useWindowDimensions();
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <Portal>
      {/* Capped and scrollable so every setting stays reachable on a short screen. */}
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: height * 0.85 }}>
        <Dialog.Title>Settings</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            <Row label="Target wake-up time">
              <TimeField
                label="Target wake-up time"
                value={config.wakeTarget}
                hour24={hour24}
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
                  hour24={hour24}
                  onChange={(bedTarget) => set({ bedTarget })}
                />
              </Row>
            )}
            <Choice label="Time format">
              <SegmentedButtons
                value={config.timeFormat}
                onValueChange={(timeFormat) => set({ timeFormat })}
                buttons={[
                  { value: 'device', label: 'Device' },
                  { value: '12h', label: '12-hour' },
                  { value: '24h', label: '24-hour' },
                ]}
              />
            </Choice>
            <Choice label="Theme">
              <SegmentedButtons
                value={config.theme}
                onValueChange={(theme) => set({ theme })}
                buttons={[
                  { value: 'device', label: 'Device' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </Choice>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button mode="contained" onPress={onDismiss}>
            Done
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

// A setting with its control beside the label.
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

// A setting with its control below the label, for three-way choices.
function Choice({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.choice}>
      <Text variant="bodyLarge">{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1 },
  choice: { gap: 8 },
});
