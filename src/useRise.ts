import { useCallback, useEffect, useState } from 'react';
import {
  type Config,
  DEFAULT_CONFIG,
  type Mode,
  type Records,
  addEntry,
  formatTime,
  logDateFor,
  removeEntry,
  timeOf,
  upsertEntry,
} from './lib/time';
import { load, persist, saveBed, saveConfig, saveWake } from './storage';

const SAVE_FAILED = "Couldn't save. Try again.";

export function useRise() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [wake, setWake] = useState<Records>({});
  const [bed, setBed] = useState<Records>({});
  const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
  const [message, setMessage] = useState<string | null>(null);

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

  // Wake and bedtime are separate stores; each write touches exactly one.
  const write = async (mode: Mode, next: Records, done: string | null) => {
    const saved =
      mode === 'wake'
        ? await persist(wake, next, setWake, saveWake)
        : await persist(bed, next, setBed, saveBed);
    setMessage(saved ? done : SAVE_FAILED);
  };

  const recordsOf = (mode: Mode) => (mode === 'wake' ? wake : bed);
  const targetOf = (mode: Mode) => (mode === 'wake' ? config.wakeTarget : config.bedTarget);

  // Reads the clock at tap time, so an app left open overnight logs under the right day.
  const logNow = async (mode: Mode) => {
    const now = new Date();
    const records = recordsOf(mode);
    const next = addEntry(records, logDateFor(mode, now), timeOf(now), targetOf(mode));
    if (next !== records) await write(mode, next, `Logged ${formatTime(timeOf(now))}`);
  };

  const setEntry = (mode: Mode, key: string, time: string) =>
    write(mode, upsertEntry(recordsOf(mode), key, time, targetOf(mode)), null);

  const deleteEntry = (mode: Mode, key: string) =>
    write(mode, removeEntry(recordsOf(mode), key), null);

  const setConfig = async (next: Config) => {
    if (!(await persist(config, next, setConfigState, saveConfig))) setMessage(SAVE_FAILED);
  };

  return {
    status,
    reload,
    wake,
    bed,
    config,
    message,
    clearMessage: () => setMessage(null),
    logNow,
    setEntry,
    deleteEntry,
    setConfig,
  };
}
