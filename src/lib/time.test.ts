import {
  CELL_WIDTH,
  DEFAULT_CONFIG,
  type Records,
  type StreakRule,
  addEntry,
  bedDateFor,
  bestRun,
  countedDays,
  dateKey,
  diffMinutes,
  effectiveTarget,
  followMonth,
  formatTime,
  isTime,
  latenessLabel,
  level,
  logDateFor,
  monthCells,
  monthOfKey,
  monthStats,
  parseTime,
  recentKeys,
  removeEntry,
  resolveDark,
  resolveHour24,
  sameLogDay,
  shiftMonth,
  spreadMinutes,
  streakCount,
  targetFor,
  timeOf,
  upsertEntry,
} from './time';

describe('isTime', () => {
  test('accepts 24-hour HH:mm', () => {
    expect(isTime('00:00')).toBe(true);
    expect(isTime('06:45')).toBe(true);
    expect(isTime('23:59')).toBe(true);
  });

  test('rejects anything else', () => {
    for (const bad of ['', '7:5', '24:00', '12:60', 'abc', 630, null, undefined]) {
      expect(isTime(bad)).toBe(false);
    }
  });
});

describe('parseTime', () => {
  test('returns minutes since midnight', () => {
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('06:45')).toBe(405);
  });
});

describe('dateKey and timeOf', () => {
  // Tests run in Asia/Manila (UTC+8), set in jest.global-setup.js.
  test('use the local date and time, not UTC', () => {
    const now = new Date('2026-10-12T22:30:00Z'); // 06:30 on the 13th in Manila
    expect(dateKey(now)).toBe('2026-10-13');
    expect(timeOf(now)).toBe('06:30');
  });

  test('pad single digits', () => {
    const now = new Date(2026, 0, 5, 7, 4);
    expect(dateKey(now)).toBe('2026-01-05');
    expect(timeOf(now)).toBe('07:04');
  });
});

describe('bedDateFor', () => {
  test('before noon belongs to the night before', () => {
    expect(bedDateFor(new Date(2026, 9, 12, 1, 0))).toBe('2026-10-11');
    expect(bedDateFor(new Date(2026, 9, 12, 11, 59))).toBe('2026-10-11');
  });

  test('from noon belongs to the same day', () => {
    expect(bedDateFor(new Date(2026, 9, 12, 12, 0))).toBe('2026-10-12');
    expect(bedDateFor(new Date(2026, 9, 12, 23, 10))).toBe('2026-10-12');
  });

  test('crosses month and year boundaries', () => {
    expect(bedDateFor(new Date(2026, 10, 1, 0, 30))).toBe('2026-10-31');
    expect(bedDateFor(new Date(2027, 0, 1, 1, 0))).toBe('2026-12-31');
  });
});

describe('logDateFor', () => {
  test('wake always logs under today', () => {
    expect(logDateFor('wake', new Date(2026, 9, 12, 5, 0))).toBe('2026-10-12');
  });

  test('bed uses bedDateFor', () => {
    expect(logDateFor('bed', new Date(2026, 9, 12, 5, 0))).toBe('2026-10-11');
  });
});

describe('level', () => {
  test('wake boundaries against a 06:00 target', () => {
    expect(level('06:00', '05:10', 'wake')).toBe(4);
    expect(level('06:00', '06:00', 'wake')).toBe(4); // diff 0
    expect(level('06:00', '06:30', 'wake')).toBe(3); // diff 30
    expect(level('06:00', '06:31', 'wake')).toBe(2); // diff 31
    expect(level('06:00', '07:00', 'wake')).toBe(2); // diff 60
    expect(level('06:00', '07:01', 'wake')).toBe(1); // diff 61
  });

  test('a user-chosen target earns the strongest level', () => {
    expect(level('09:00', '09:00', 'wake')).toBe(4);
  });
});

describe('diffMinutes in bed mode', () => {
  test('past midnight against an evening target is late', () => {
    expect(diffMinutes('22:00', '00:30', 'bed')).toBe(150);
    expect(level('22:00', '00:30', 'bed')).toBe(1);
  });

  test('before an evening target is early', () => {
    expect(diffMinutes('22:00', '21:45', 'bed')).toBe(-15);
  });

  test('against a past-midnight target', () => {
    expect(diffMinutes('01:00', '00:30', 'bed')).toBe(-30);
    expect(diffMinutes('01:00', '23:30', 'bed')).toBe(-90);
    expect(level('01:00', '00:30', 'bed')).toBe(4);
  });
});

describe('latenessLabel', () => {
  test('on time', () => {
    expect(latenessLabel(0)).toBe('On time');
  });

  test('under an hour is given in minutes', () => {
    expect(latenessLabel(1)).toBe('1min late');
    expect(latenessLabel(30)).toBe('30mins late');
    expect(latenessLabel(59)).toBe('59mins late');
    expect(latenessLabel(-12)).toBe('12mins early');
  });

  test('an hour or more is given in hours and minutes', () => {
    expect(latenessLabel(60)).toBe('1hr late');
    expect(latenessLabel(61)).toBe('1hr 1min late');
    expect(latenessLabel(90)).toBe('1hr 30mins late');
    expect(latenessLabel(120)).toBe('2hrs late');
    expect(latenessLabel(150)).toBe('2hrs 30mins late');
    expect(latenessLabel(-570)).toBe('9hrs 30mins early');
  });

  test('the short form drops the minutes once there is a full hour', () => {
    expect(latenessLabel(-323, true)).toBe('5hrs early');
    expect(latenessLabel(61, true)).toBe('1hr late');
    expect(latenessLabel(119, true)).toBe('1hr late');
    expect(latenessLabel(120, true)).toBe('2hrs late');
    expect(latenessLabel(59, true)).toBe('59mins late');
    expect(latenessLabel(0, true)).toBe('On time');
  });
});

describe('effectiveTarget', () => {
  const entry = { time: '07:00', target: '06:00' };

  test('uses the stored target by default', () => {
    expect(effectiveTarget(entry, '09:00', false)).toBe('06:00');
  });

  test('uses the current target when applying targets to past days', () => {
    expect(effectiveTarget(entry, '09:00', true)).toBe('09:00');
  });
});

describe('monthStats', () => {
  test('empty month', () => {
    expect(monthStats({}, 2026, 9, 'wake', () => '06:00', false)).toEqual({
      logged: 0,
      onTime: 0,
      avgLate: null,
    });
  });

  test('mixed month, ignoring other months', () => {
    const records: Records = {
      '2026-09-30': { time: '09:00', target: '06:00' },
      '2026-10-01': { time: '05:50', target: '06:00' },
      '2026-10-02': { time: '06:20', target: '06:00' },
      '2026-10-03': { time: '07:30', target: '06:00' },
    };
    // late minutes: 0, 20, 90 -> mean 36.67
    expect(monthStats(records, 2026, 9, 'wake', () => '06:00', false)).toEqual({
      logged: 3,
      onTime: 1,
      avgLate: 37,
    });
  });

  test('entries with different stored targets', () => {
    const records: Records = {
      '2026-10-01': { time: '09:00', target: '09:00' },
      '2026-10-02': { time: '09:00', target: '06:00' },
    };
    expect(monthStats(records, 2026, 9, 'wake', () => '09:00', false)).toEqual({
      logged: 2,
      onTime: 1,
      avgLate: 90,
    });
    expect(monthStats(records, 2026, 9, 'wake', () => '09:00', true)).toEqual({
      logged: 2,
      onTime: 2,
      avgLate: 0,
    });
  });
});

describe('shiftMonth', () => {
  test('rolls over the year in both directions', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2027, 0, -1)).toEqual({ year: 2026, month: 11 });
    expect(shiftMonth(2026, 9, 1)).toEqual({ year: 2026, month: 10 });
  });
});

describe('CELL_WIDTH', () => {
  // At exactly 100/7 the seven widths round to just over the row on some
  // screen widths, and the layout engine wraps the seventh day to the next row.
  test('seven cells total under 100% with room for rounding', () => {
    const week = parseFloat(CELL_WIDTH) * 7;
    expect(week).toBeLessThanOrEqual(99.99);
    expect(week).toBeGreaterThan(99.9);
  });
});

describe('monthCells', () => {
  test('October 2026 starts on a Thursday and has 31 days', () => {
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, 1]);
    expect(cells.length).toBe(35);
    expect(cells[cells.length - 1]).toBe(31);
  });

  test('February 2027 starts on a Monday and has 28 days', () => {
    const cells = monthCells(2027, 1);
    expect(cells.slice(0, 2)).toEqual([null, 1]);
    expect(cells.length).toBe(29);
  });
});

describe('addEntry', () => {
  test('stores the time with the current target', () => {
    expect(addEntry({}, '2026-10-12', '06:12', '06:00')).toEqual({
      '2026-10-12': { time: '06:12', target: '06:00' },
    });
  });

  test('a second log for the same day changes nothing', () => {
    const records: Records = { '2026-10-12': { time: '06:12', target: '06:00' } };
    expect(addEntry(records, '2026-10-12', '06:13', '09:00')).toBe(records);
  });
});

describe('upsertEntry', () => {
  test('a new entry stores the current target', () => {
    expect(upsertEntry({}, '2026-10-10', '07:00', '09:00')).toEqual({
      '2026-10-10': { time: '07:00', target: '09:00' },
    });
  });

  test('editing changes the time and keeps the stored target', () => {
    const records: Records = { '2026-10-10': { time: '07:00', target: '06:00' } };
    expect(upsertEntry(records, '2026-10-10', '06:40', '09:00')).toEqual({
      '2026-10-10': { time: '06:40', target: '06:00' },
    });
  });
});

describe('removeEntry', () => {
  test('removes one day and keeps the rest', () => {
    const records: Records = {
      '2026-10-10': { time: '07:00', target: '06:00' },
      '2026-10-11': { time: '06:00', target: '06:00' },
    };
    expect(removeEntry(records, '2026-10-10')).toEqual({
      '2026-10-11': { time: '06:00', target: '06:00' },
    });
  });
});

describe('formatTime', () => {
  test('12-hour', () => {
    expect(formatTime('06:05', false)).toBe('6:05 AM');
    expect(formatTime('18:30', false)).toBe('6:30 PM');
    expect(formatTime('00:00', false)).toBe('12:00 AM');
    expect(formatTime('12:00', false)).toBe('12:00 PM');
  });

  test('24-hour', () => {
    expect(formatTime('06:05', true)).toBe('06:05');
    expect(formatTime('18:30', true)).toBe('18:30');
    expect(formatTime('00:00', true)).toBe('00:00');
  });
});

describe('resolveHour24', () => {
  test('"device" follows the device setting', () => {
    expect(resolveHour24('device', true)).toBe(true);
    expect(resolveHour24('device', false)).toBe(false);
  });

  test('an explicit choice overrides the device', () => {
    expect(resolveHour24('12h', true)).toBe(false);
    expect(resolveHour24('24h', false)).toBe(true);
  });
});

describe('resolveDark', () => {
  test('"device" follows the device theme', () => {
    expect(resolveDark('device', true)).toBe(true);
    expect(resolveDark('device', false)).toBe(false);
  });

  test('an explicit choice overrides the device', () => {
    expect(resolveDark('light', true)).toBe(false);
    expect(resolveDark('dark', false)).toBe(true);
  });
});

describe('sameLogDay', () => {
  test('true within one morning or one afternoon', () => {
    expect(sameLogDay(new Date(2026, 9, 12, 6, 0), new Date(2026, 9, 12, 11, 59))).toBe(true);
    expect(sameLogDay(new Date(2026, 9, 12, 13, 0), new Date(2026, 9, 12, 23, 59))).toBe(true);
  });

  test('false across midnight, when a new day starts', () => {
    expect(sameLogDay(new Date(2026, 9, 12, 23, 59), new Date(2026, 9, 13, 0, 1))).toBe(false);
  });

  test('false across noon, when a bedtime starts counting for today', () => {
    expect(sameLogDay(new Date(2026, 9, 12, 11, 59), new Date(2026, 9, 12, 12, 1))).toBe(false);
  });
});

describe('monthOfKey', () => {
  test('returns the year and 0-based month of a date key', () => {
    expect(monthOfKey('2026-10-31')).toEqual({ year: 2026, month: 9 });
    expect(monthOfKey('2027-01-01')).toEqual({ year: 2027, month: 0 });
  });
});

describe('followMonth', () => {
  const october = { year: 2026, month: 9 };

  test('follows today into a new month when showing the old current month', () => {
    expect(followMonth(october, new Date(2026, 9, 31, 23, 0), new Date(2026, 10, 1, 6, 0))).toEqual({
      year: 2026,
      month: 10,
    });
  });

  test('crosses a year', () => {
    const december = { year: 2026, month: 11 };
    expect(followMonth(december, new Date(2026, 11, 31), new Date(2027, 0, 1))).toEqual({
      year: 2027,
      month: 0,
    });
  });

  test('stays put when the user was browsing another month', () => {
    const august = { year: 2026, month: 7 };
    expect(followMonth(august, new Date(2026, 9, 31), new Date(2026, 10, 1))).toBe(august);
  });

  test('stays put when the month has not changed', () => {
    expect(followMonth(october, new Date(2026, 9, 12), new Date(2026, 9, 13))).toBe(october);
  });
});

describe('recentKeys', () => {
  test('lists a day and the days before it, newest first', () => {
    expect(recentKeys('2026-10-12', 4)).toEqual(['2026-10-12', '2026-10-11', '2026-10-10', '2026-10-09']);
  });

  test('crosses month and year boundaries', () => {
    expect(recentKeys('2026-11-01', 2)).toEqual(['2026-11-01', '2026-10-31']);
    expect(recentKeys('2027-01-01', 2)).toEqual(['2027-01-01', '2026-12-31']);
  });
});

describe('monthStats with a target per day', () => {
  test('with targets applied to past days, each day is measured against the target for its own date', () => {
    const records: Records = {
      '2026-10-10': { time: '07:30', target: '06:00' },
      '2026-10-12': { time: '06:00', target: '06:00' },
    };
    const targetOn = (key: string) => (key === '2026-10-10' ? '08:00' : '06:00');

    expect(monthStats(records, 2026, 9, 'wake', targetOn, true).onTime).toBe(2);
    expect(monthStats(records, 2026, 9, 'wake', targetOn, false).onTime).toBe(1);
  });
});

describe('targetFor', () => {
  const config = {
    ...DEFAULT_CONFIG,
    weekendTargets: true,
    weekendWakeTarget: '08:00',
    weekendBedTarget: '23:30',
  };
  // Thursday 8 to Monday 12 October 2026.
  const days = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12'];

  test('with weekend targets off, every day uses the one target', () => {
    expect(targetFor(DEFAULT_CONFIG, 'wake', '2026-10-10')).toBe('06:00');
    expect(targetFor(DEFAULT_CONFIG, 'bed', '2026-10-10')).toBe('22:00');
  });

  test('weekend mornings are Saturday and Sunday', () => {
    expect(days.map((key) => targetFor(config, 'wake', key))).toEqual([
      '06:00',
      '06:00',
      '08:00',
      '08:00',
      '06:00',
    ]);
  });

  test('weekend nights are Friday and Saturday', () => {
    expect(days.map((key) => targetFor(config, 'bed', key))).toEqual([
      '22:00',
      '23:30',
      '23:30',
      '22:00',
      '22:00',
    ]);
  });
});

describe('spreadMinutes', () => {
  const at = (...times: string[]): Records =>
    Object.fromEntries(times.map((time, i) => [`2026-10-0${i + 1}`, { time, target: '06:00' }]));

  test('needs two logged days in the month', () => {
    expect(spreadMinutes({}, 2026, 9, 'wake')).toBeNull();
    expect(spreadMinutes(at('06:00'), 2026, 9, 'wake')).toBeNull();
    expect(spreadMinutes(at('06:00', '07:00'), 2026, 8, 'wake')).toBeNull();
  });

  test('is the average distance from the mean time, whatever the target', () => {
    expect(spreadMinutes(at('06:00', '06:20', '06:40'), 2026, 9, 'wake')).toBe(13);
    expect(spreadMinutes(at('09:00', '09:00'), 2026, 9, 'wake')).toBe(0);
  });

  test('bedtimes either side of midnight are close together', () => {
    expect(spreadMinutes(at('23:50', '00:10'), 2026, 9, 'bed')).toBe(10);
  });
});

describe('streak', () => {
  const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;
  const at = (times: Record<number, string>): Records =>
    Object.fromEntries(Object.entries(times).map(([d, time]) => [day(Number(d)), { time, target: '06:00' }]));
  const targetOn = () => '06:00';
  const counted = (records: Records, rule: StreakRule, applyToPast = false) =>
    [...countedDays(records, 'wake', rule, targetOn, applyToPast)];

  test('which days count depends on the rule', () => {
    const records = at({ 9: '05:50', 10: '06:20', 11: '07:10' });
    expect(counted(records, 'logged')).toEqual([day(9), day(10), day(11)]);
    expect(counted(records, 'near')).toEqual([day(9), day(10)]);
    expect(counted(records, 'onTime')).toEqual([day(9)]);
  });

  test('a day is measured against the target it was logged with, unless targets apply to past days', () => {
    const records: Records = { [day(12)]: { time: '07:00', target: '07:00' } };
    expect(counted(records, 'onTime')).toEqual([day(12)]);
    expect(counted(records, 'onTime', true)).toEqual([]);
  });

  test('in a row: counts back from the end day, and a gap ends it', () => {
    const days = new Set([day(8), day(10), day(11), day(12)]);
    expect(streakCount('row', days, day(12), true)).toBe(3);
    expect(streakCount('row', new Set(), day(12), false)).toBe(0);
  });

  test('in a row: a day not logged yet does not break it, but a logged day that does not count does', () => {
    const days = new Set([day(9), day(10), day(11)]);
    expect(streakCount('row', days, day(12), false)).toBe(3);
    expect(streakCount('row', days, day(12), true)).toBe(0);
  });

  test('in a row: runs across a month boundary', () => {
    expect(streakCount('row', new Set(['2026-09-30', day(1), day(2)]), day(2), true)).toBe(3);
  });

  test('last 7 days: counts the days within the seven ending on the end day', () => {
    const days = new Set([day(5), day(6), day(8), day(12)]);
    expect(streakCount('seven', days, day(12), true)).toBe(3);
  });

  test('this week: counts from the most recent Sunday', () => {
    // Sunday 11 October 2026 starts the week.
    const days = new Set([day(9), day(10), day(11), day(12), day(13)]);
    expect(streakCount('week', days, day(11), true)).toBe(1);
    expect(streakCount('week', days, day(12), true)).toBe(2);
    expect(streakCount('week', days, day(17), true)).toBe(3);
  });

  test('the best run is the longest stretch of days in a row', () => {
    expect(bestRun(new Set([day(5), day(6), day(1), day(2), day(3), '2026-09-30']))).toBe(4);
    expect(bestRun(new Set([day(4)]))).toBe(1);
    expect(bestRun(new Set())).toBe(0);
  });
});
