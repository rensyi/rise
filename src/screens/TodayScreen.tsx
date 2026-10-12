import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';
import BigTitle from '../components/BigTitle';
import LatenessPill from '../components/LatenessPill';
import { Enter, useEntered } from '../components/Motion';
import { Panel, Row, Rows } from '../components/Panel';
import Pills from '../components/Pills';
import SunButton from '../components/SunButton';
import {
  type Mode,
  type Records,
  dateKey,
  diffMinutes,
  effectiveTarget,
  formatTime,
  latenessLabel,
  logDateFor,
  recentKeys,
} from '../lib/time';
import { rowSecondaryColor } from '../theme';

export const MODES: { value: Mode; label: string }[] = [
  { value: 'wake', label: 'Wake' },
  { value: 'bed', label: 'Bedtime' },
];

type Props = {
  now: Date;
  mode: Mode;
  bedEnabled: boolean;
  records: Records;
  targetOn: (key: string) => string; // the current target for a day
  applyToPast: boolean;
  hour24: boolean;
  onMode: (mode: Mode) => void;
  onLog: () => void;
  onSelectDay: (key: string) => void;
};

const dateOf = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// The first screen: the day in large type, one big button to log, and the last few days.
export default function TodayScreen({
  now,
  mode,
  bedEnabled,
  records,
  targetOn,
  applyToPast,
  hour24,
  onMode,
  onLog,
  onSelectDay,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const todayKey = dateKey(now);
  // The day a tap would log to. For bedtime before noon this is yesterday.
  const logKey = logDateFor(mode, now);
  const logged = records[logKey];
  // What a day is measured against: its own stored target, unless targets apply to past days.
  const targetFor = (key: string) =>
    records[key] ? effectiveTarget(records[key], targetOn(key), applyToPast) : targetOn(key);  // What a tap brings in springs into place. It stays still when the screen is opened.
  const entered = useEntered();
  const pop = { pop: true, off: !entered.current };

  return (
    <View style={styles.screen}>
      <BigTitle
        title={now.toLocaleDateString(undefined, { weekday: 'long' })}
        subtitle={now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
      />
      {bedEnabled && <Pills options={MODES} value={mode} onChange={onMode} />}

      {logged ? (
        // Once logged, the button gives way to what was saved.
        <Enter
          key={`${mode}-result`}
          {...pop}
          style={[styles.result, { backgroundColor: theme.colors.elevation.level1 }]}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {mode === 'wake' ? 'You got up at' : 'You went to bed at'}
          </Text>
          <Text variant="displayLarge" style={styles.resultTime}>
            {formatTime(logged.time, hour24)}
          </Text>
          <Enter {...pop} delay={180}>
            <LatenessPill target={targetFor(logKey)} time={logged.time} mode={mode} />
          </Enter>
        </Enter>
      ) : (
        <Enter key={`${mode}-button`} {...pop} style={styles.hero}>
          <SunButton
            label={mode === 'wake' ? "I'm up" : 'In bed'}
            caption={`Target ${formatTime(targetOn(logKey), hour24)}`}
            shape={mode === 'wake' ? 'sun' : 'circle'}
            onPress={onLog}
          />
        </Enter>
      )}

      <Panel title="Last seven days">
        <Rows>
          {recentKeys(logKey, 7).map((key) => {
            const entry = records[key];
            const name =
              key === todayKey
                ? 'Today'
                : dateOf(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' });
            const none = key === logKey ? 'Not logged yet' : 'No entry';
            const spoken = entry
              ? `${name}, ${formatTime(entry.time, hour24)}, ${latenessLabel(diffMinutes(targetFor(key), entry.time, mode))}`
              : `${name}, no entry`;
            return (
              <Row key={key} accessibilityLabel={spoken} onPress={() => onSelectDay(key)}>
                <Text variant="bodyLarge" style={styles.rowName}>
                  {name}
                </Text>
                {entry ? (
                  <Enter {...pop} style={styles.rowValue}>
                    <Text variant="bodyMedium" style={{ color: rowSecondaryColor(theme) }}>
                      {formatTime(entry.time, hour24)}
                    </Text>
                    <LatenessPill short target={targetFor(key)} time={entry.time} mode={mode} />
                  </Enter>
                ) : (
                  <Text variant="bodyMedium" style={{ color: rowSecondaryColor(theme) }}>
                    {none}
                  </Text>
                )}
              </Row>
            );
          })}
        </Rows>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20 },
  hero: { paddingVertical: 12 },
  result: { borderRadius: 36, padding: 24, gap: 10, alignItems: 'flex-start' },
  resultTime: { fontFamily: 'Rubik_500Medium', letterSpacing: -1 },
  rowName: { flex: 1 },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
