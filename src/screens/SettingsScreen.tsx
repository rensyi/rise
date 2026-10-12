import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';
import BigTitle from '../components/BigTitle';
import { Panel, Row, Rows } from '../components/Panel';
import Pills from '../components/Pills';
import TimeField from '../components/TimeField';
import Toggle from '../components/Toggle';
import type { Config, ThemeChoice, TimeFormat } from '../lib/time';
import { rowSecondaryColor } from '../theme';

const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: 'device', label: 'Device' },
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];
const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'device', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type Props = {
  config: Config;
  hour24: boolean;
  onChange: (next: Config) => void;
  onExport: () => void;
  onRestore: () => void;
};

// Settings as a page of grouped rows. Every change applies at once.
export default function SettingsScreen({ config, hour24, onChange, onExport, onRestore }: Props) {
  const theme = useTheme<MD3Theme>();
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });
  const label = (text: string, hint?: string) => (
    <View style={styles.label}>
      <Text variant="bodyLarge">{text}</Text>
      {hint && (
        <Text variant="bodySmall" style={{ color: rowSecondaryColor(theme) }}>
          {hint}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <BigTitle title="Settings" subtitle="Targets, bedtime, display and data" />

      <Panel title="Wake-up">
        <Rows>
          <Row>
            {label('Target wake-up time')}
            <TimeField
              label="Target wake-up time"
              value={config.wakeTarget}
              hour24={hour24}
              onChange={(wakeTarget) => set({ wakeTarget })}
            />
          </Row>
          <Row>
            {label('Different target on weekends')}
            <Toggle
              accessibilityLabel="Different target on weekends"
              value={config.weekendTargets}
              onValueChange={(weekendTargets) => set({ weekendTargets })}
            />
          </Row>
          {config.weekendTargets && (
            <Row>
              {label('Weekend wake-up time', 'Saturday and Sunday')}
              <TimeField
                label="Weekend wake-up time"
                value={config.weekendWakeTarget}
                hour24={hour24}
                onChange={(weekendWakeTarget) => set({ weekendWakeTarget })}
              />
            </Row>
          )}
          <Row>
            {label('Wake-up reminder', 'A notification at your target time.')}
            <Toggle
              accessibilityLabel="Wake-up reminder"
              value={config.reminder}
              onValueChange={(reminder) => set({ reminder })}
            />
          </Row>
          <Row>
            {label('Apply targets to past days', 'Off: each day keeps the target it was logged with.')}
            <Toggle
              accessibilityLabel="Apply targets to past days"
              value={config.applyTargetsToPast}
              onValueChange={(applyTargetsToPast) => set({ applyTargetsToPast })}
            />
          </Row>
        </Rows>
      </Panel>

      <Panel title="Bedtime">
        <Rows>
          <Row>
            {label('Track bedtime')}
            <Toggle
              accessibilityLabel="Track bedtime"
              value={config.bedEnabled}
              onValueChange={(bedEnabled) => set({ bedEnabled })}
            />
          </Row>
          {config.bedEnabled && (
            <Row>
              {label('Target bedtime')}
              <TimeField
                label="Target bedtime"
                value={config.bedTarget}
                hour24={hour24}
                onChange={(bedTarget) => set({ bedTarget })}
              />
            </Row>
          )}
          {config.bedEnabled && config.weekendTargets && (
            <Row>
              {label('Weekend bedtime', 'Friday and Saturday nights')}
              <TimeField
                label="Weekend bedtime"
                value={config.weekendBedTarget}
                hour24={hour24}
                onChange={(weekendBedTarget) => set({ weekendBedTarget })}
              />
            </Row>
          )}
        </Rows>
      </Panel>

      <Panel title="Display">
        <Rows>
          <Row stacked>
            <Text variant="bodyLarge">Time format</Text>
            <Pills fill options={TIME_FORMATS} value={config.timeFormat} onChange={(timeFormat) => set({ timeFormat })} />
          </Row>
          <Row stacked>
            <Text variant="bodyLarge">Theme</Text>
            <Pills fill options={THEMES} value={config.theme} onChange={(theme) => set({ theme })} />
          </Row>
        </Rows>
      </Panel>

      <Panel title="Data">
        <Rows>
          <Row accessibilityLabel="Export backup" onPress={onExport}>
            {label('Export backup', 'Saves everything to one file.')}
          </Row>
          <Row accessibilityLabel="Restore from backup" onPress={onRestore}>
            {label('Restore from backup', 'Replaces what is on this phone.')}
          </Row>
        </Rows>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20 },
  label: { flex: 1, gap: 2 },
});
