import { StyleSheet, View } from 'react-native';
import { IconButton, type MD3Theme, useTheme } from 'react-native-paper';
import BigTitle from '../components/BigTitle';
import MonthCalendar, { Legend } from '../components/MonthCalendar';
import { Panel } from '../components/Panel';
import Pills from '../components/Pills';
import StatsRow from '../components/StatsRow';
import { type Mode, type MonthView, type Records, monthStats } from '../lib/time';
import { rowColor } from '../theme';
import { MODES } from './TodayScreen';

type Props = {
  view: MonthView;
  mode: Mode;
  bedEnabled: boolean;
  records: Records;
  target: string;
  applyToPast: boolean;
  hour24: boolean;
  todayKey: string;
  onMode: (mode: Mode) => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (key: string) => void;
};

// The month: its name in large type, this month's numbers, and one tile per day.
export default function CalendarScreen({
  view,
  mode,
  bedEnabled,
  records,
  target,
  applyToPast,
  hour24,
  todayKey,
  onMode,
  onPrev,
  onNext,
  onSelectDay,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const first = new Date(view.year, view.month, 1);
  const round = { containerColor: rowColor(theme), iconColor: theme.colors.onSurface, size: 22 };

  return (
    <View style={styles.screen}>
      <BigTitle
        title={first.toLocaleDateString(undefined, { month: 'long' })}
        subtitle={String(view.year)}
      >
        <IconButton icon="chevron-left" accessibilityLabel="Previous month" onPress={onPrev} {...round} />
        <IconButton icon="chevron-right" accessibilityLabel="Next month" onPress={onNext} {...round} />
      </BigTitle>
      {bedEnabled && <Pills options={MODES} value={mode} onChange={onMode} />}
      <StatsRow stats={monthStats(records, view.year, view.month, mode, target, applyToPast)} />
      <Panel>
        <View style={styles.grid}>
          <MonthCalendar
            year={view.year}
            month={view.month}
            records={records}
            mode={mode}
            currentTarget={target}
            applyToPast={applyToPast}
            hour24={hour24}
            todayKey={todayKey}
            onSelectDay={onSelectDay}
          />
        </View>
      </Panel>
      <Legend />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20 },
  grid: { padding: 6 },
});
