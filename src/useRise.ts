import { useCalendars } from 'expo-localization';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  type Config,
  DEFAULT_CONFIG,
  type Mode,
  type Records,
  addEntry,
  countOf,
  dateKey,
  formatTime,
  logDateFor,
  removeEntry,
  resolveHour24,
  targetFor,
  timeOf,
  upsertEntry,
} from './lib/time';
import { type PickedBackup, pickBackup, shareBackup } from './backup';
import { allowReminder, reminderAvailable, syncReminder } from './reminder';
import { type Data, load, persist, replaceAll, saveBed, saveConfig, saveWake } from './storage';
import { refreshWidgets, widgetsAvailable } from './widget';

const SAVE_FAILED = "Couldn't save. Try again.";

export type Rise = ReturnType<typeof useRise>;

export function useRise() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [wake, setWake] = useState<Records>({});
  const [bed, setBed] = useState<Records>({});
  const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
  const [message, setMessageText] = useState<string | null>(null);
  // The entry the current message can undo: only a one-tap log offers it.
  const [undoable, setUndoable] = useState<{ mode: Mode; key: string } | null>(null);
  // Any new message, or none, takes the offer to undo away with the old one.
  const setMessage = (text: string | null) => {
    setUndoable(null);
    setMessageText(text);
  };
  // The phone's own 12/24-hour switch, used when the time format setting is "device".
  const deviceHour24 = useCalendars()[0]?.uses24hourClock ?? false;
  const hour24 = resolveHour24(config.timeFormat, deviceHour24);

  const reload = useCallback(() => {
    setStatus('loading');
    load().then(
      (data) => {
        setWake(data.wake);
        setBed(data.bed);
        setConfigState(data.config);
        setStatus('ready');
      },
      () => setStatus('failed'),
    );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Home-screen widgets (Android, in the app's own build). They are redrawn
  // whenever what they show changes.
  useEffect(() => {
    if (status === 'ready') refreshWidgets({ wake, bed, config }, hour24).catch(() => {});
  }, [status, wake, bed, config, hour24]);

  // A wake-up logged from a widget is saved while the app is in the
  // background, so what is stored is read again when the app comes back.
  useEffect(() => {
    if (!widgetsAvailable()) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      load().then(
        (data) => {
          setWake(data.wake);
          setBed(data.bed);
          setConfigState(data.config);
        },
        () => {},
      );
    });
    return () => subscription.remove();
  }, []);

  // Wake and bedtime are separate stores; each write touches exactly one.
  const write = async (mode: Mode, next: Records, done: string | null) => {
    const saved =
      mode === 'wake'
        ? await persist(wake, next, setWake, saveWake)
        : await persist(bed, next, setBed, saveBed);
    setMessage(saved ? done : SAVE_FAILED);
    return saved;
  };

  const recordsOf = (mode: Mode) => (mode === 'wake' ? wake : bed);

  // Reads the clock at tap time, so an app left open overnight logs under the right day.
  const logNow = async (mode: Mode) => {
    const now = new Date();
    const records = recordsOf(mode);
    const key = logDateFor(mode, now);
    const next = addEntry(records, key, timeOf(now), targetFor(config, mode, key));
    if (next === records) return;
    if (await write(mode, next, `Logged ${formatTime(timeOf(now), hour24)}`)) setUndoable({ mode, key });
  };

  const setEntry = (mode: Mode, key: string, time: string) =>
    write(mode, upsertEntry(recordsOf(mode), key, time, targetFor(config, mode, key)), null);

  const deleteEntry = (mode: Mode, key: string) =>
    write(mode, removeEntry(recordsOf(mode), key), null);

  const setConfig = async (next: Config) => {
    // The reminder can only be turned on if the phone allows notifications.
    if (next.reminder && !config.reminder) {
      if (!reminderAvailable()) {
        setMessage("The reminder can't run inside Expo Go on Android. It needs the app's own build.");
        return;
      }
      if (!(await allowReminder().catch(() => false))) {
        setMessage("Notifications are off for Rise. Allow them in your phone's settings.");
        return;
      }
    }
    if (!(await persist(config, next, setConfigState, saveConfig))) setMessage(SAVE_FAILED);
  };

  // Keeps the scheduled reminder in step with the settings it depends on.
  const { reminder, wakeTarget, weekendTargets, weekendWakeTarget } = config;
  // Today's date once today's wake-up is logged, so logging (or undoing it)
  // syncs again and today's reminder is not sent to someone already up.
  const today = dateKey(new Date());
  const loggedToday = today in wake ? today : null;
  useEffect(() => {
    if (status !== 'ready') return;
    syncReminder(
      { ...DEFAULT_CONFIG, reminder, wakeTarget, weekendTargets, weekendWakeTarget },
      hour24,
      loggedToday ? new Date() : null,
    ).catch(() => {
      if (reminder) setMessage("Couldn't set the reminder.");
    });
  }, [status, reminder, wakeTarget, weekendTargets, weekendWakeTarget, hour24, loggedToday]);

  const exportData = () =>
    shareBackup({ wake, bed, config }).catch(() => setMessage("Couldn't export your data."));

  // Lets the user choose a backup file. Nothing changes until restore() is called with it.
  const chooseBackup = async (): Promise<PickedBackup | null> => {
    try {
      return await pickBackup();
    } catch {
      setMessage('That file is not a Rise backup.');
      return null;
    }
  };

  const restore = async (restored: Data) => {
    // A reminder in the backup only comes back on if this phone allows notifications.
    const allowed = !restored.config.reminder || (await allowReminder().catch(() => false));
    const data = allowed ? restored : { ...restored, config: { ...restored.config, reminder: false } };
    try {
      await replaceAll(data);
      setWake(data.wake);
      setBed(data.bed);
      setConfigState(data.config);
      setMessage(`Restored ${countOf(data.wake, 'wake-up')} and ${countOf(data.bed, 'bedtime')}`);
    } catch {
      // Part of it may have been written, so show what is really stored.
      reload();
      setMessage(SAVE_FAILED);
    }
  };

  return {
    status,
    reload,
    wake,
    bed,
    config,
    hour24,
    message,
    clearMessage: () => setMessage(null),
    // Takes back the log the message is about; null when there is nothing to undo.
    undo: undoable ? () => deleteEntry(undoable.mode, undoable.key) : null,
    logNow,
    setEntry,
    deleteEntry,
    setConfig,
    exportData,
    chooseBackup,
    restore,
  };
}
