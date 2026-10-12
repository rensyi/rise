import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, type MD3Theme, useTheme } from 'react-native-paper';
import BigTitle from '../components/BigTitle';
import { Enter } from '../components/Motion';
import MonthCalendar, { Legend } from '../components/MonthCalendar';
import { Panel } from '../components/Panel';
import Pills from '../components/Pills';
import StatsRow from '../components/StatsRow';
import StreakView, { type StreakSource } from '../components/StreakView';
import { type Config, type Mode, type MonthView, type Records, monthStats, spreadMinutes } from '../lib/time';
import { rowColor } from '../theme';
import { MODES } from './TodayScreen';

type Props = {
  view: MonthView;
  mode: Mode;
  bedEnabled: boolean;
  records: Records;
  targetOn: (key: string) => string; // the current target for a day
  applyToPast: boolean;
  hour24: boolean;
  todayKey: string;
  config: Config;
  streak: StreakSource;
  onMode: (mode: Mode) => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (key: string) => void;
  onConfig: (next: Config) => void;
};

// The month: its name in large type, then one of three tabs. Wake and Bedtime
// show the month's numbers and one tile per day; Streak shows the streak.
export default function CalendarScreen({
  view,
  mode,
  bedEnabled,
  records,
  targetOn,
  applyToPast,
  hour24,
  todayKey,
  config,
  streak,
  onMode,
  onPrev,
  onNext,
  onSelectDay,
  onConfig,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const first = new Date(view.year, view.month, 1);
  const round = { containerColor: rowColor(theme), iconColor: theme.colors.onSurface, size: 22 };
  // A new month slides in from the side it was reached from: its title and its grid.
  const [slide, setSlide] = useState(0);
  const month = `${view.year}-${view.month}`;
  // Streak is a tab here only; Today keeps to Wake and Bedtime.
  const [onStreak, setOnStreak] = useState(false);
  const tabs: { value: Mode | 'streak'; label: string }[] = [
    ...(bedEnabled ? MODES : MODES.slice(0, 1)),
    { value: 'streak', label: 'Streak' },
  ];

  return (
    <View style={styles.screen}>
      <BigTitle
        title={first.toLocaleDateString(undefined, { month: 'long' })}
        subtitle={String(view.year)}
        slide={slide}
      >
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Previous month"
          onPress={() => {
            setSlide(-24);
            onPrev();
          }}
          {...round}
        />
        <IconButton
          icon="chevron-right"
          accessibilityLabel="Next month"
          onPress={() => {
            setSlide(24);
            onNext();
          }}
          {...round}
        />
      </BigTitle>
      <Pills
        options={tabs}
        value={onStreak ? 'streak' : mode}
        onChange={(tab) => {
          setOnStreak(tab === 'streak');
          if (tab !== 'streak') onMode(tab);
        }}
      />
      {onStreak ? (
        <StreakView
          view={view}
          slide={slide}
          config={config}
          streak={streak}
          hour24={hour24}
          todayKey={todayKey}
          onChange={onConfig}
        />
      ) : (
        <>
          <StatsRow
            stats={monthStats(records, view.year, view.month, mode, targetOn, applyToPast)}
            spread={spreadMinutes(records, view.year, view.month, mode)}
          />
          <Panel>
            <Enter key={month} x={slide} off={!slide} style={styles.grid}>
              <MonthCalendar
                key={`${month}-${mode}`}
                year={view.year}
                month={view.month}
                records={records}
                mode={mode}
                targetOn={targetOn}
                applyToPast={applyToPast}
                hour24={hour24}
                todayKey={todayKey}
                onSelectDay={onSelectDay}
              />
            </Enter>
          </Panel>
          <Legend />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20 },
  grid: { padding: 6 },
});
