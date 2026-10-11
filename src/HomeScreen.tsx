import { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  FAB,
  type MD3Theme,
  SegmentedButtons,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DayDialog from './components/DayDialog';
import MonthCalendar, { Legend } from './components/MonthCalendar';
import SettingsDialog from './components/SettingsDialog';
import StatsRow from './components/StatsRow';
import {
  type Mode,
  type MonthView,
  dateKey,
  followMonth,
  formatTime,
  logDateFor,
  monthOfKey,
  monthStats,
  sameLogDay,
  shiftMonth,
} from './lib/time';
import { palette } from './theme';
import type { Rise } from './useRise';

export default function HomeScreen({ rise }: { rise: Rise }) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());
  const [picked, setPicked] = useState<Mode>('wake');
  const [view, setView] = useState<MonthView>(() => ({
    year: now.getFullYear(),
    month: now.getMonth(),
  }));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // The app is often left open overnight. "Today" is re-checked when the app
  // returns to the foreground and once a minute while it stays on screen, and
  // the calendar follows today into a new month.
  useEffect(() => {
    const refresh = () => {
      const fresh = new Date();
      if (sameLogDay(now, fresh)) return;
      setView((current) => followMonth(current, now, fresh));
      setNow(fresh);
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [now]);

  const screen = [styles.screen, { backgroundColor: theme.colors.background }];

  if (rise.status === 'loading') {
    return (
      <View style={[screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  // Shown instead of an empty app, so a later save cannot overwrite data that failed to load.
  if (rise.status === 'failed') {
    return (
      <View style={[screen, styles.centered]}>
        <Text variant="bodyLarge">Couldn't load your data.</Text>
        <Button mode="contained" onPress={rise.reload}>
          Try again
        </Button>
      </View>
    );
  }

  // With bedtime tracking off there is only Wake mode.
  const mode: Mode = rise.config.bedEnabled ? picked : 'wake';
  const records = mode === 'wake' ? rise.wake : rise.bed;
  const target = mode === 'wake' ? rise.config.wakeTarget : rise.config.bedTarget;
  const applyToPast = rise.config.applyTargetsToPast;
  const canLog = !records[logDateFor(mode, now)];

  return (
    <View style={screen}>
      <Appbar.Header>
        <Appbar.Content title="Rise" />
        <Appbar.Action icon="cog" accessibilityLabel="Settings" onPress={() => setSettingsOpen(true)} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {rise.config.bedEnabled && (
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setPicked(value as Mode)}
            buttons={[
              { value: 'wake', label: 'Wake', icon: 'white-balance-sunny' },
              { value: 'bed', label: 'Bedtime', icon: 'bed' },
            ]}
          />
        )}
        {/* Peach blush is a fill only: text on it is always deep plum. */}
        <Chip style={styles.chip} textStyle={{ color: palette.deepPlum }}>
          {`Target ${mode === 'wake' ? 'wake-up' : 'bedtime'} ${formatTime(target, rise.hour24)}`}
        </Chip>
        <StatsRow stats={monthStats(records, view.year, view.month, mode, target, applyToPast)} />
        <MonthCalendar
          year={view.year}
          month={view.month}
          records={records}
          mode={mode}
          currentTarget={target}
          applyToPast={applyToPast}
          hour24={rise.hour24}
          todayKey={dateKey(now)}
          onPrev={() => setView(shiftMonth(view.year, view.month, -1))}
          onNext={() => setView(shiftMonth(view.year, view.month, 1))}
          onSelectDay={setSelectedKey}
        />
        <Legend />
      </ScrollView>

      {canLog && (
        <FAB
          icon={mode === 'wake' ? 'white-balance-sunny' : 'bed'}
          label={mode === 'wake' ? "I'm up" : 'In bed'}
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          onPress={() => {
            const fresh = new Date();
            setNow(fresh);
            // Show the month the entry lands in.
            setView(monthOfKey(logDateFor(mode, fresh)));
            rise.logNow(mode);
          }}
        />
      )}

      {selectedKey && (
        <DayDialog
          key={selectedKey}
          dateKey={selectedKey}
          mode={mode}
          entry={records[selectedKey]}
          currentTarget={target}
          applyToPast={applyToPast}
          hour24={rise.hour24}
          onSave={(time) => {
            rise.setEntry(mode, selectedKey, time);
            setSelectedKey(null);
          }}
          onDelete={() => {
            rise.deleteEntry(mode, selectedKey);
            setSelectedKey(null);
          }}
          onDismiss={() => setSelectedKey(null)}
        />
      )}

      <SettingsDialog
        visible={settingsOpen}
        config={rise.config}
        hour24={rise.hour24}
        onChange={(next) => {
          // Turning bedtime tracking off always returns to Wake, even if it is turned on again.
          if (!next.bedEnabled) setPicked('wake');
          rise.setConfig(next);
        }}
        onDismiss={() => setSettingsOpen(false)}
      />

      <Snackbar visible={rise.message !== null} onDismiss={rise.clearMessage} duration={3000}>
        {rise.message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  content: { padding: 16, paddingBottom: 96, gap: 16 },
  chip: { alignSelf: 'center', backgroundColor: palette.peachBlush },
  fab: { position: 'absolute', right: 16 },
});
