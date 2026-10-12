import { useEffect, useState } from 'react';
import { AppState, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, type MD3Theme, Snackbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PickedBackup } from './backup';
import DaySheet from './components/DaySheet';
import { Enter, watchReduceMotion } from './components/Motion';
import NavBar, { NAV_SPACE, type Tab } from './components/NavBar';
import RestoreSheet from './components/RestoreSheet';
import {
  type Mode,
  type MonthView,
  dateKey,
  followMonth,
  logDateFor,
  monthOfKey,
  sameLogDay,
  shiftMonth,
  targetFor,
} from './lib/time';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import TodayScreen from './screens/TodayScreen';
import type { Rise } from './useRise';

// The frame around the three screens: it holds what they share (the date, the
// mode, the month in view, the open day) and draws the bottom bar over them.
export default function Shell({ rise }: { rise: Rise }) {
  const theme = useTheme<MD3Theme>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('today');
  const [now, setNow] = useState(() => new Date());
  const [picked, setPicked] = useState<Mode>('wake');
  const [view, setView] = useState<MonthView>(() => ({
    year: now.getFullYear(),
    month: now.getMonth(),
  }));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // A backup file the user chose, waiting for them to confirm the restore.
  const [backup, setBackup] = useState<PickedBackup | null>(null);

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

  useEffect(watchReduceMotion, []);

  // Android's back button returns to Today before it leaves the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'today') return false;
      setTab('today');
      return true;
    });
    return () => subscription.remove();
  }, [tab]);

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
  const bedEnabled = rise.config.bedEnabled;
  const mode: Mode = bedEnabled ? picked : 'wake';
  const records = mode === 'wake' ? rise.wake : rise.bed;
  // The current target depends on the day once weekend targets are on.
  const targetOn = (key: string) => targetFor(rise.config, mode, key);
  const applyToPast = rise.config.applyTargetsToPast;
  const shared = { mode, bedEnabled, records, targetOn, applyToPast, hour24: rise.hour24 };
  // The streak follows wake-ups or bedtimes, whichever the user chose on its tab.
  const streakMode: Mode = bedEnabled ? rise.config.streakFor : 'wake';
  const streak = {
    mode: streakMode,
    records: streakMode === 'wake' ? rise.wake : rise.bed,
    targetOn: (key: string) => targetFor(rise.config, streakMode, key),
    endKey: logDateFor(streakMode, now),
  };

  return (
    <View style={screen}>
      {/* key={tab} gives each screen its own scroll position, starting at the top. */}
      <ScrollView
        key={tab}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + NAV_SPACE + 24 },
        ]}
      >
        {/* Each screen fades in and rises a little when it is opened. */}
        <Enter y={14}>
          {tab === 'today' && (
            <TodayScreen
              {...shared}
              now={now}
              onMode={setPicked}
              onLog={() => {
                const fresh = new Date();
                setNow(fresh);
                // Keep the calendar on the month the entry lands in.
                setView(monthOfKey(logDateFor(mode, fresh)));
                rise.logNow(mode);
              }}
              onSelectDay={setSelectedKey}
            />
          )}
          {tab === 'calendar' && (
            <CalendarScreen
              {...shared}
              view={view}
              todayKey={dateKey(now)}
              config={rise.config}
              streak={streak}
              onConfig={rise.setConfig}
              onMode={setPicked}
              onPrev={() => setView(shiftMonth(view.year, view.month, -1))}
              onNext={() => setView(shiftMonth(view.year, view.month, 1))}
              onSelectDay={setSelectedKey}
            />
          )}
          {tab === 'settings' && (
            <SettingsScreen
              config={rise.config}
              hour24={rise.hour24}
              onChange={(next) => {
                // Turning bedtime tracking off always returns to Wake, even if it is turned on again.
                if (!next.bedEnabled) setPicked('wake');
                rise.setConfig(next);
              }}
              onExport={rise.exportData}
              onRestore={async () => setBackup(await rise.chooseBackup())}
            />
          )}
        </Enter>
      </ScrollView>

      <NavBar tab={tab} bottomInset={insets.bottom} onChange={setTab} />

      {selectedKey && (
        <DaySheet
          key={selectedKey}
          dateKey={selectedKey}
          mode={mode}
          entry={records[selectedKey]}
          currentTarget={targetOn(selectedKey)}
          applyToPast={applyToPast}
          hour24={rise.hour24}
          bottomInset={insets.bottom}
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

      {backup && (
        <RestoreSheet
          backup={backup}
          bottomInset={insets.bottom}
          onRestore={() => {
            rise.restore(backup.data);
            setBackup(null);
          }}
          onDismiss={() => setBackup(null)}
        />
      )}

      {/* Messages sit above the bottom bar. */}
      <Snackbar
        visible={rise.message !== null}
        onDismiss={rise.clearMessage}
        // A message with Undo stays a little longer, to leave time to reach it.
        duration={rise.undo ? 5000 : 3000}
        action={rise.undo ? { label: 'Undo', onPress: rise.undo } : undefined}
        style={{ borderWidth: 1, borderColor: theme.colors.outlineVariant }}
        wrapperStyle={{ bottom: insets.bottom + NAV_SPACE }}
      >
        {rise.message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  content: { paddingHorizontal: 16 },
});
