import { StyleSheet, View } from 'react-native';
import { type MD3Theme, Text, useTheme } from 'react-native-paper';
import {
  type Config,
  type Mode,
  type MonthView,
  RULE_LEVEL,
  type Records,
  type StreakRule,
  type StreakStyle,
  bestRun,
  countedDays,
  streakCount,
  streakText,
} from '../lib/time';
import { tileColor, tileTextColor } from '../theme';
import MonthCalendar, { Legend } from './MonthCalendar';
import { Enter, useEntered } from './Motion';
import { Panel, Row, Rows } from './Panel';
import Pills from './Pills';

// Named apart from the Wake and Bedtime tabs above them.
const FOLLOW: { value: Mode; label: string }[] = [
  { value: 'wake', label: 'Wake-ups' },
  { value: 'bed', label: 'Bedtimes' },
];
const RULES: { value: StreakRule; label: string }[] = [
  { value: 'logged', label: 'Logged' },
  { value: 'near', label: 'Within 30m' },
  { value: 'onTime', label: 'On time' },
];
const STYLES: { value: StreakStyle; label: string }[] = [
  { value: 'row', label: 'In a row' },
  { value: 'seven', label: 'Last 7 days' },
  { value: 'week', label: 'This week' },
];

export type StreakSource = {
  mode: Mode; // what the streak follows; wake when bedtime tracking is off
  records: Records; // that mode's entries
  targetOn: (key: string) => string; // the current target for a day
  endKey: string; // the day a tap would log to in that mode
};

type Props = {
  view: MonthView;
  slide: number; // how far a new month slides in from, as on the other tabs
  config: Config;
  streak: StreakSource;
  hour24: boolean;
  todayKey: string;
  onChange: (next: Config) => void;
};

// The Streak tab of Calendar: the streak, the days of the month that count
// towards it, and the choices for how it works.
export default function StreakView({ view, slide, config, streak, hour24, todayKey, onChange }: Props) {
  const theme = useTheme<MD3Theme>();
  const entered = useEntered();
  const { mode, records, targetOn, endKey } = streak;
  const counted = countedDays(records, mode, config.streakRule, targetOn, config.applyTargetsToPast);
  const count = streakCount(config.streakStyle, counted, endKey, endKey in records);
  const [value, caption] = streakText(config.streakStyle, count);
  const ink = { color: tileTextColor(4, theme) };
  const month = `${view.year}-${view.month}`;
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });

  return (
    <>
      {/* The key holds what is shown, so the card pops when a log or a choice changes it. */}
      <Enter key={`${value} ${caption}`} pop off={!entered.current}>
        <View
          accessible
          accessibilityLabel={`Streak: ${value} ${caption}`}
          style={[styles.hero, { backgroundColor: tileColor(4) }]}
        >
          <Text variant="displayMedium" style={[styles.count, ink]}>
            {value}
          </Text>
          <View style={styles.heroText}>
            <Text variant="titleMedium" style={ink}>
              {caption}
            </Text>
            {config.streakStyle === 'row' && (
              <Text variant="bodySmall" style={ink}>
                {`Best so far: ${bestRun(counted)}`}
              </Text>
            )}
          </View>
        </View>
      </Enter>

      <Panel>
        <Enter key={month} x={slide} off={!slide} style={styles.grid}>
          <MonthCalendar
            key={`${month}-streak`}
            year={view.year}
            month={view.month}
            records={records}
            mode={mode}
            targetOn={targetOn}
            applyToPast={config.applyTargetsToPast}
            hour24={hour24}
            todayKey={todayKey}
            counted={counted}
            onSelectDay={() => {}}
          />
        </Enter>
      </Panel>
      <Legend streak={RULE_LEVEL[config.streakRule]} />

      <Panel title="How your streak works">
        <Rows>
          {config.bedEnabled && (
            <Row stacked>
              <Text variant="bodyLarge">Follow</Text>
              <Pills fill options={FOLLOW} value={mode} onChange={(streakFor) => set({ streakFor })} />
            </Row>
          )}
          <Row stacked>
            <Text variant="bodyLarge">A day counts when it is</Text>
            <Pills fill options={RULES} value={config.streakRule} onChange={(streakRule) => set({ streakRule })} />
          </Row>
          <Row stacked>
            <Text variant="bodyLarge">Count</Text>
            <Pills fill options={STYLES} value={config.streakStyle} onChange={(streakStyle) => set({ streakStyle })} />
          </Row>
        </Rows>
      </Panel>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 36,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  count: { fontFamily: 'Rubik_500Medium', letterSpacing: -1 },
  heroText: { flex: 1, gap: 2 },
  grid: { padding: 6 },
});
