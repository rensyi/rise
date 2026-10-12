# Rise — Design Spec

Date: 2026-10-12
Status: approved 2026-10-12 and kept up to date since. It describes the app
as it is now. Section 10 lists what is still to be checked on a phone.

## 1. Purpose

Rise is a mobile app for logging the time you wake up. Waking is an exact
moment — you wake, you log — so it is the thing the app measures.

Bedtime can be logged too, but it is optional, secondary, and means "laid in
bed", not "fell asleep". Bedtime never affects wake tracking.

Success looks like: a user opens the app in the morning, taps once, and over
weeks sees a calendar whose colours show how close they woke to the time they
chose.

## 2. Principles

1. **Wake first.** A new user sees a wake-only app.
2. **Independence.** Wake and bedtime are stored and computed separately. No
   function reads both. There is no sleep duration and no combined score.
3. **Your target, your colours.** The target time is the user's choice. The
   default comes from research (section 4), but a user who rises at 09:00 sets
   09:00 and gets the strongest colour for it.
4. **The past stays put.** Changing a target does not change how past days
   are coloured or counted, unless the user asks for that in Settings.
5. **Material 3.** Every control is a Material 3 component.
6. **Local only.** No account, no network, no sync.

## 3. Features

### 3.1 Screens

The app has three places, reached from a floating bar at the bottom: **Today**,
**Calendar** and **Settings**. There is no navigation library; the bar switches
which one is drawn. On Android, the back button returns to Today before it
leaves the app. The look follows Material 3 Expressive (3.5).

When bedtime tracking is on (3.4), Today and Calendar both show **Wake** and
**Bedtime** pill tabs under the title. They share one selection. Calendar always has one more tab after them,
**Streak**; with bedtime tracking off its tabs are Wake and Streak.

**Today** is where the app opens.

- **Title** — the weekday in large type, with the date under it.
- There is no streak on Today. It has its own tab on Calendar (below).
- **The log button** — one large gold button: a sun shape reading "I'm up" in
  Wake mode, a plain disc reading "In bed" in Bedtime mode. Under the label
  it shows the current target.
- **After logging** — the button is replaced by a card with "You got up at"
  (or "You went to bed at"), the time in large type, and the lateness label.
- **Last few days** — five rows, the day a tap would log to and the four
  before it, each with its time and lateness label or "No entry". Tapping a
  row opens the day sheet (3.3). To keep the rows short, the label here drops the minutes
  once there is a full hour ("5hrs early", not "5hrs 23mins early"); the
  result card, the day sheet and screen readers give the full figure.

**Calendar** shows one month.

- **Title** — the month in large type, the year under it, and two round
  buttons for the previous and next month.
- **Stats row** — three cards for the viewed month and current mode:
  - *Logged* — number of days with an entry.
  - *On time* — number of level 4 days. This card is a gold pill.
  - *Avg late* — mean of `max(0, diff)` in minutes over logged days, shown as
    `+18m`, `0m`, or `—` when nothing is logged.
- **Consistency** — one wide card under the stats row. It measures how close
  together the month's times are, whatever the target: the spread is the
  average distance of each time from the month's mean time, in minutes, and
  the score is 100 minus the spread, never below 0. It reads "87%" with
  "Your times vary by about 13mins", or `—` with "Needs two logged days".
  Bedtimes are compared on a noon-to-noon clock, so 23:50 and 00:10 are 20
  minutes apart.

**The Streak tab** of Calendar replaces the stats row, grid and legend with:

- **The streak** — a gold card with the number in large type and what it
  counts beside it.
- **The month** — the same grid. A day that counts keeps its usual tile
  colour (3.2); a day that does not count is left empty, whatever was
  logged. Days here do not open the day sheet. The legend has two items:
  "Counts", beside the colours that count under the current rule (all four
  for Logged, two for Within 30m, gold alone for On time), and "Does not
  count", beside an empty tile.
- **How your streak works** — three choices, saved with the settings:
  - *Follow* — Wake-ups (default) or Bedtimes. Shown only while Track
    bedtime is on; otherwise the streak follows wake-ups.
  - *A day counts when it is* — Logged (default: any entry), Within 30m
    (tile levels 4 and 3) or On time (level 4). Each day is measured
    against the same target as its tile (3.2).
  - *Count* — one of:
    - In a row (default): counted days in a row, ending on the day a tap
      would log to. Until that day is logged the run ends the day before,
      so it is not shown as broken during the day; once it is logged and
      does not count, the streak is 0. The card also shows "Best so far",
      the longest run ever.
    - Last 7 days: how many of the seven days ending on that day count,
      shown as "5/7". It never resets.
    - This week: how many count since the most recent Sunday.
- **Month grid** — a weekday header starting on Sunday and one round tile per
  day (3.2), on a panel.
- **Legend** — the four colour levels with their labels.

**Settings** is described in 3.4.

### 3.2 Calendar tiles

The calendar days are the tiles; there is no separate heat map. Each day's
tile is coloured by that day's entry in the current mode:

| Level | Condition (`diff` = logged − target, minutes) | Tile |
|---|---|---|
| 4 | `diff ≤ 0` | strongest |
| 3 | `0 < diff ≤ 30` | strong |
| 2 | `30 < diff ≤ 60` | medium |
| 1 | `diff > 60` | faint |
| 0 | no entry | empty |

With a 06:00 target: 06:00 or earlier is level 4, up to 06:30 is level 3, up
to 07:00 is level 2, later is level 1.

**Which target a day is measured against.** Every entry stores the target
that was set when the entry was created (section 6). By default a day is
measured against its own stored target, so changing the target in Settings
affects new entries only: past tiles and past stats stay as they were. When
**Apply targets to past days** is on (3.4), every day is measured against the
current target instead. Levels and stats always use the same rule.

**Lateness label**, used on Today, in the day sheet and in accessibility labels:
`On time` (diff 0), `12mins early`, `45mins late`, `1hr late`,
`2hrs 30mins late`. Under an hour it is given in minutes; from an hour up, in
hours and minutes. Times are stored to the minute, so there are no seconds.

**Bedtime comparison.** Bedtimes cross midnight, so in Bedtime mode both the
logged time and the target are placed on a noon-to-noon clock before `diff`
is computed: a time before 12:00 has 24 hours added. A 22:00 target and a
00:30 entry give `diff = 150`. A 01:00 target and a 00:30 entry give
`diff = −30`.

**Following today.** The app re-checks the date when it returns to the
foreground and once a minute while it stays on screen, so today's outline
and the log button are right after midnight and after noon. When today moves
into a new month, the calendar moves with it if it was showing the old
current month; a month the user browsed to is left alone. Logging with the
button always shows the month the entry lands in.

**Appearance.** Colours are specified in 3.5. Today's tile has an outline.
Future days are dimmed and not tappable. Each tile's accessibility label
states the date, the logged time and the lateness label, so colour is never
the only signal.

### 3.3 Logging

- **One tap.** The log button on Today saves the current local time as
  `HH:mm`, together with the current target.
  - "I'm up" saves under today's date.
  - "In bed" saves under today's date, or under yesterday's date when tapped
    before 12:00, so a 01:00 bedtime belongs to the night before.
  - The button is replaced by the result card when the day it would write to
    already has an entry.
  - A message confirms: "Logged 06:12", with an **Undo** button that removes
    the entry just logged. It stays for five seconds; other messages have no
    Undo and stay for three.
  - Messages take the theme: a row-coloured bar with the text colour and a
    thin border, not Material's inverted bar (light in dark mode).
- **Edit, backfill, delete.** Tapping a calendar tile for today or any past
  day, or a row on Today, opens the day sheet, which slides up from the
  bottom. From the top: the title, the date, the lateness label, the time in
  large type (tapping it opens the Material 3 time picker), and the actions.
  The label sits at the left, only as wide as its text, in the level's
  colour. Delete sits at the far left in red, with Cancel and Save at the
  right.
  - The sheet does not show the target. With "Apply targets to past days"
    off, a past day can be measured against an older target than the current
    one, and the sheet does not say which.
  - Delete appears only when the day has an entry.
  - A new entry starts at the current target time and stores the current
    target.
  - Editing an existing entry changes its time only; its stored target is
    kept.

### 3.4 Settings

A page of grouped rows, in four groups: Wake-up, Bedtime, Display and Data.
Every change applies at once.

- **Target wake-up time** — default 06:00.
- **Different target on weekends** — switch, default off. On: Saturday and
  Sunday mornings use **Weekend wake-up time** (default 08:00), and Friday
  and Saturday nights use **Weekend bedtime** (default 23:00). Both rows
  appear only while the switch is on, and the bedtime one only while Track
  bedtime is on. It is one switch for both modes, like "Apply targets to
  past days", and does not link wake and bedtime. A new entry stores the
  target for its own day.
- **Wake-up reminder** — switch, default off. On: a notification at the
  wake-up target every day, at the weekend time on weekends. Turning it on
  asks the phone for permission; if that is refused the switch stays off
  and a message says why. It is a notification, not an alarm: it does not
  sound through silent mode. If today's wake-up is logged before the target,
  today's reminder is not sent: it is put off to the same time next week.
  Inside Expo Go on Android the reminder cannot run: Expo Go no
  longer includes notifications there, and loading the package stops the
  app from opening. So the package is loaded only on first use and never in
  that environment, where the switch stays off and a message says why.
- **Apply targets to past days** — switch, default off. Off: each day is
  measured against the target it was logged with. On: every day is measured
  against the current target. Stored targets are never overwritten, so
  switching it off again restores the original colours and stats.
- **Track bedtime** — switch, default off.
- **Target bedtime** — default 22:00. Shown only when Track bedtime is on.
- **Time format** — Device, 12-hour or 24-hour; default Device. Device
  follows the phone's own 12/24-hour switch.
- **Theme** — Device, Light or Dark; default Device. Device follows the
  phone's light or dark mode.
- **Export backup** — writes everything (section 6) to one file,
  `rise-backup-YYYY-MM-DD.json`, and opens the phone's share sheet.
- **Restore from backup** — the user picks a file. A file that is not a Rise
  backup is refused with a message. Otherwise a sheet shows the file name,
  how many wake-ups and bedtimes it holds and its latest date, and asks
  before replacing everything on the phone. Entries and settings in the
  file are checked exactly as stored data is on load.

Turning Track bedtime off hides the Wake and Bedtime tabs and returns the app
to Wake mode; turning it on again starts in Wake mode. Bedtime entries are kept and reappear when it is turned back on.

"Apply targets to past days" is one switch covering both modes. It only
selects which target each mode's own entries are compared with; it does not
link wake and bedtime.

### 3.5 Theme, colour and type

The Theme setting (3.4) picks light or dark; by default it follows the
system setting. The palette is "Ink and gold": warm paper and ink, one gold,
and a red for Delete. Every colour is taken from Flexoki by Steph Ango
(https://stephango.com/flexoki, MIT licence), a published palette tuned to
keep its colour relationships between light and dark. It was chosen by the
owner on 2026-10-12 from three researched options, replacing an earlier
lavender palette and a monochrome one.

| | Dark | Light |
|---|---|---|
| Background | `#100F0F` | `#FFFCF0` |
| Cards and dialogs | `#1C1B1A` | `#F2F0E5` |
| Main text ("ink") | `#CECDC3` | `#100F0F` |
| Secondary text | `#878580` | `#575653` |
| Empty-tile border, clock face | `#343331` | `#DAD8CE` |
| Delete | `#E8705F` | `#AF3029` |

**Tiles.** Each level has one fixed fill and day-number colour, the same in
both themes, so a day looks identical whichever theme is on.

| Level | Fill | Number |
|---|---|---|
| 4 | `#D0A215` | `#100F0F` |
| 3 | `#AD8301` | `#100F0F` |
| 2 | `#664D01` | `#CECDC3` |
| 1 | `#3A2D04` | `#CECDC3` |
| 0 | none | main text |

On the dark background, on time is the brightest tile and the latest fades
into the background. On the light background the same colours read the other
way round: the latest days are the darkest and most prominent. The owner
chose identical colours over identical emphasis.

Today's outline uses the main text colour.

**Where each colour goes.**

- **Gold** (`#D0A215`, with `#100F0F` text) is kept for results and for
  logging: tiles, the "On time" stat card, the lateness label, the "I'm up"
  and "In bed" buttons, and the selected field in the time picker.
- **Ink** (the main text colour, with the background colour on top) is used
  for Save, Done and the time buttons, switches, and the selected segment.
- **Red** appears only on Delete.
- The time picker sits on the card colour like the other dialogs, with its
  clock face in the border tone so the face stays visible.

**Contrast.** Every text and number pairing above is at least 4.5:1.
`src/theme.test.ts` checks each pairing and that every painted colour is one
of the Flexoki values listed in it.

**Shape and layers.** The look follows Material 3 Expressive, Google's public
design language.

- **Large titles.** Each screen opens with its title in large Rubik medium.
- **Pills and circles.** Buttons, tabs, choices, the lateness label and the
  "On time" card are pills; calendar tiles and the month arrows are circles.
- **Three layers.** The background, then panels in the card colour, then rows
  on a panel in a third tone (`#282726` dark, `#E6E4D9` light, also from
  Flexoki). Rows in a group are separate rounded cards; the first and last
  take larger outer corners.
- **A floating bottom bar**, clear of the screen edges, with a pill behind
  the active item.
- **One playful shape.** The wake button is Material's "sunny" shape: a disc
  with ten soft scallops, each dipping 14% of the radius, drawn as one
  outline. Nothing else uses a novelty shape.
- The time picker is a ready-made component and keeps its standard look.

**Motion.** Movement answers what the user just did, and is short.

- **Opening a screen** — it fades in and rises 14px.
- **Bottom bar** — the pill behind the chosen item grows out from its middle.
- **Log button** — the sun turns once a minute while its label stays
  upright. The "In bed" disc lets off Zs: each drifts up and to the right
  for 1.8s, and the next leaves 0.75 to 1.6s later, so they come at uneven
  moments and never overlap. Either button shrinks a little while pressed.
- **After logging** — the result card springs in, its lateness label a beat
  later, and the day's row in "Last few days" springs in with it. Changing
  between Wake and Bedtime springs the button or card in again.
- **Pills** — shrink a little while pressed; the one just chosen dips and
  springs back.
- **Calendar** — tiles pop in one after another when the month appears or
  the mode changes. A new month's title and grid slide in from the side it
  was reached from. A tile pops again when a save or delete changes its
  colour.
- **Day sheet** — slides up from the bottom edge, and back down when closed.
- **Switches** — the app draws its own, in the Material 3 shape, so they
  look the same on Android and iPhone: an outlined track with a small dot
  when off, an ink-filled track with a larger dot when on. The dot springs
  across and grows.
- **Still on purpose** — theme changes, the time picker and the stat numbers.
- **Reduce motion** — when the device asks for less motion, none of this
  plays: the sun stays still and the Zs stand in a rising line.

**Type.** All text is Rubik (Google Fonts, Open Font License), in regular and
medium weights, loaded when the app starts. The app waits for the font so
text does not jump; if the font fails to load, the app opens in the system
font.

**Times** are shown as `6:05 AM` or `06:05` according to the Time format
setting (3.4), and the time picker uses the same mode. Formatting is done in
the app's own code, not `Intl.DateTimeFormat`: `Intl` follows the language
region and ignores the phone's separate 12/24-hour switch, which was found
on a real device. Stored times are always 24-hour.

### 3.6 Home-screen widgets (Android)

Two widgets, on Android only and only in the app's own build. They are drawn
with `react-native-android-widget`, which needs native code Expo Go does not
have; loading that package in Expo Go would stop the app from opening, so it
is loaded only where widgets can run.

- **I'm up** (small, 2×2) — before today's wake-up is logged it is the log
  button: the gold sun with "I'm up" and the target. A tap logs the current
  time for today without opening the app, by the same rule as the button on
  Today, so it never overwrites a day that has an entry. After logging it
  shows "Up at", the time and the lateness label; a tap then opens the app.
  It always tracks wake-ups, never bedtimes.
- **Streak** (wide, 4×2) — the streak as set up on the Streak tab, and seven
  dots for the last seven days in the tile colours, with an empty ring for a
  day with no entry. It follows wake-ups or bedtimes, as the streak does. A
  tap opens the app.

Both use the card colour and Rubik, in the theme chosen in Settings; with
"Device" they follow the phone. They are redrawn when the app's data
changes, when the log widget is tapped, and every half hour, which is how
the log button comes back after midnight. When the app returns to the
foreground it reads its data again, so a wake-up logged from the widget
shows up there.

## 4. Research basis for the defaults

No study gives a single best wake-up time. Three findings point to a window:

- **Regularity matters most.** In about 61,000 UK Biobank participants, the
  most regular sleepers had 20–48% lower all-cause mortality than the least
  regular, and regularity predicted mortality better than sleep duration
  ([Windred et al., *Sleep*, 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10782489/)).
  The measure covers the whole sleep/wake pattern, not wake time alone.
- **Earlier timing is associated with lower depression risk.** A genetic
  study of roughly 840,000 people linked each one-hour-earlier sleep midpoint
  to about 23% lower risk of major depression
  ([coverage of Daghlas et al., *JAMA Psychiatry*, 2021](https://sleepreviewmag.com/sleep-health/sleep-whole-body/mental-health/waking-one-hour-earlier-cuts-depression-risk/)).
- **Sleep onset between 22:00 and 23:00 had the lowest cardiovascular risk**
  in about 88,000 adults
  ([coverage of the *European Heart Journal – Digital Health* study, 2021](https://www.thestar.co.uk/read-this/going-to-sleep-between-10pm-and-11pm-linked-to-lower-heart-disease-risk-study-finds-3450483)).

These are observational or genetic studies: they show association, not cause.
The second and third are cited from press coverage, not the papers.

**Derivation.** A 22:00–23:00 sleep onset plus the commonly recommended 7–9
hours of adult sleep gives a wake time between about 05:00 and 08:00. This is
arithmetic on the findings above, not a study result.

**Defaults.** Both were chosen by the project owner. Wake target 06:00 sits
inside the derived window. Bedtime target 22:00 is the start of the
22:00–23:00 window, which suits a time that means "laid in bed" and comes
before falling asleep. Because the right time varies by person, both are
adjustable.

Rise is a habit tracker, not medical advice.

## 5. Architecture

Expo (React Native, TypeScript), three screens switched by a bottom bar, no
navigation library.

```
App.tsx                      state, theme selection, font loading, Shell
App.test.tsx                 whole-app test
jest.global-setup.js         fixed time zone for tests
src/theme.ts                 colours, font, light and dark themes
src/theme.test.ts            unit tests
src/lib/time.ts              pure logic, no React, no storage
src/lib/time.test.ts         unit tests
src/lib/sun.ts               outline of the wake button
src/lib/sun.test.ts          unit tests
src/storage.ts               parse, load, save
src/storage.test.ts          unit tests
src/useRise.ts               state hook
src/reminder.ts              schedules the wake-up reminder
src/reminder.test.ts         unit tests
src/backup.ts                shares a backup file, picks one to restore
src/widget/index.ts          loads the widgets only where they can run
src/widget/state.ts          what the widgets show, and the one-tap log
src/widget/widgets.tsx       the two widgets, and what happens on a tap
src/Shell.tsx                shared screen state, bottom bar, day sheet
src/screens/
  TodayScreen.tsx            log button or result, last few days
  CalendarScreen.tsx         month title, stats, grid, legend
  SettingsScreen.tsx         grouped settings rows
src/components/
  BigTitle.tsx               large screen title with optional round tools
  Panel.tsx                  panel, grouped rows, row
  Pills.tsx                  row of pills with one selected
  SunButton.tsx              the log button
  Motion.tsx                 all movement, and the reduce-motion switch
  LatenessPill.tsx           "12mins late" in the tile's colour
  NavBar.tsx                 floating bottom bar
  Sheet.tsx                  panel that slides up from the bottom
  DaySheet.tsx               add, edit, delete one day
  RestoreSheet.tsx           confirms restoring a backup
  StreakView.tsx             the Streak tab of Calendar
  Toggle.tsx                 the on/off switch
  TimeField.tsx              time button or large time + time picker
  TimeField.test.tsx         unit test
  MonthCalendar.tsx          grid of tiles, legend
  StatsRow.tsx               three stat cards and the consistency card
```

| Unit | Does | Depends on |
|---|---|---|
| `lib/time.ts` | `parseTime`, `dateKey`, `effectiveTarget(entry, currentTarget, applyToPast)`, `level(target, logged, mode)`, `latenessLabel`, `monthStats`, `bedDateFor(now)`, entry helpers, time formatting | nothing |
| `storage.ts` | `load()` returns `{wake, bed, config}`; `saveWake`, `saveBed`, `saveConfig`; `persist` (save, revert on failure) | AsyncStorage |
| `useRise.ts` | holds state, exposes `logNow`, `setEntry`, `deleteEntry`, `setConfig`, `exportData`, `chooseBackup`, `restore`; keeps the reminder in step with the settings | `storage.ts`, `lib/time.ts`, `reminder.ts`, `backup.ts` |
| `reminder.ts` | asks for permission; schedules one weekly notification per day of the week | `expo-notifications`, `lib/time.ts` |
| `backup.ts` | writes and shares the backup file; picks and reads one | `expo-file-system`, `expo-sharing`, `expo-document-picker`, `storage.ts` |
| `Shell.tsx` | holds what the screens share: the date, the mode, the month in view, the open day, the active screen | `useRise.ts`, screens |
| screens | lay out one place each from props | components, `lib/time.ts` |
| components | render props, call callbacks | `lib/time.ts`, `theme.ts`, Paper |

`level` and `monthStats` take one mode's entries and one mode's target.
Nothing in `lib/time.ts` accepts wake and bedtime data together; this is how
principle 2 is enforced.

**Dependencies**

- `expo`
- `react-native-paper` — Material 3 components
- `react-native-paper-dates` — Material 3 time picker
- `@react-native-async-storage/async-storage`
- Runtime support for the above: `react-native-safe-area-context`,
  `@expo/vector-icons`, `expo-font`, `expo-system-ui`, `expo-status-bar`
- `expo-localization` — reads the phone's 12/24-hour switch
- `@expo-google-fonts/rubik` — the Rubik font files
- Development only: `jest-expo`, `jest`, `@types/jest`,
  `react-test-renderer`, `@types/react-test-renderer`

**Theme.** `src/theme.ts` extends Paper's Material 3 light and dark themes
with the greys and font in 3.5, written out by hand. No runtime colour generation
and no theming dependency. Material 3 roles not named in 3.5 (outline, error
and the like) keep Paper's defaults unless they clash on a real device.

## 6. Data

AsyncStorage, three keys, JSON values:

| Key | Value |
|---|---|
| `rise.wake` | `{ "2026-10-12": { "time": "06:45", "target": "06:00" }, ... }` |
| `rise.bed` | `{ "2026-10-11": { "time": "23:10", "target": "22:00" }, ... }` |
| `rise.config` | `{ "wakeTarget": "06:00", "bedEnabled": false, "bedTarget": "22:00", "weekendTargets": false, "weekendWakeTarget": "08:00", "weekendBedTarget": "23:00", "reminder": false, "streakFor": "wake", "streakRule": "logged", "streakStyle": "row", "applyTargetsToPast": false, "timeFormat": "device", "theme": "device" }` |

Settings saved by an older version lack the newer fields; those load with
their defaults.

A backup file is `{ "app": "rise", "version": 1, "exportedAt": "...", "wake": {...}, "bed": {...}, "config": {...} }`,
with the same three values as above.

- Date keys are local calendar dates as `YYYY-MM-DD`.
- Times and targets are 24-hour `HH:mm`.
- One entry per day per mode.
- An entry's `target` is written once, when the entry is created, and never
  changed afterwards.

## 7. Error handling

- **A stored value is not valid JSON or has the wrong shape** — invalid
  entries are dropped one by one and valid ones kept; an unusable config
  falls back to the defaults. The app still opens.
- **Storage cannot be read at all** — the app shows "Couldn't load your
  data." with a Try again button instead of opening empty. Opening empty
  would let the next save overwrite data that was only unreadable for a
  moment.
- **Save fails** — the change is reverted in memory and a snackbar says
  "Couldn't save. Try again." Nothing is shown as saved when it is not.

## 8. Testing

Jest through `jest-expo`, run in a fixed time zone ahead of UTC so local-date
bugs fail on every machine.

`storage.ts`:

- wrongly shaped, unparsable and partly valid stored data
- `load` on first run, after a save, with a corrupt value, and when a read
  fails
- `persist` on success and on a failed save

`lib/time.ts`:

- local date and time against UTC
- one-tap logging not overwriting an existing entry; editing keeping the
  stored target
- month navigation across a year boundary
- level boundaries at `diff` = 0, 30, 31, 60, 61
- bedtime past midnight against an evening target
- bedtime against a past-midnight target
- `effectiveTarget` with the switch off (stored target) and on (current)
- `monthStats` for an empty month, a mixed month, and a month whose entries
  carry different stored targets
- `bedDateFor` just before and just after 12:00
- `latenessLabel` for early, on time, minutes late, hours late

`theme.ts` and `components/TimeField.tsx`:

- the time picker's clock face differs from its surface, and its text is
  at least 4.5:1, in both themes
- the time picker is mounted only while open, so a cancelled choice is not
  remembered

`lib/time.ts` also checks that seven calendar cells total just under 100%
of the row, so the seventh day cannot wrap on any screen width.

`App.test.tsx` mounts the whole app, with only storage, the device's
12/24-hour switch, the icon font and the time picker replaced, and drives:

- first run on Today
- one-tap logging and the result card
- the calendar's month, stats and tiles
- the day sheet's order, its red Delete, and deleting a day
- opening a day from the list on Today
- bedtime tracking on, off and on again
- the time format and theme settings
- an app left open overnight into a new month
- the seven days on Today with shortened labels, and the consistency card on Calendar
- the Streak tab: its three choices, that they are saved, and following bedtimes
- the widgets: what they show, the one-tap log, that each can be drawn, and
  that the widget package is never loaded in Expo Go
- a Saturday logged against the weekend target
- the reminder turned on, and refused by the phone
- exporting a backup, restoring one, and refusing a file that is not one
- font loading, slow and failed
- the Zs on the "In bed" button
- the day sheet sliding away, and closing at once with reduced motion

Layout and colour are checked by running the app.

## 9. Out of scope

Alarms, sleep duration, accounts and sync, charts, a separate target for each
day of the week, multiple entries per day.

Widgets on iPhone are also out of scope: they need native Swift code. The
streak, consistency score, weekend targets, reminder, backup and Android
widgets were out of scope at first and were added later.

## 10. Still to check on a phone

Everything here is covered by automated tests, but has not yet been seen on a
real screen.

In Expo Go:

- [ ] Both themes: the bottom bar, the Settings page with its switches, and
      the time picker.
- [ ] The sun's shape, each movement (3.5), and the app with the phone's
      "reduce motion" or "remove animations" setting on.
- [ ] Logging: the "Logged" message in the theme's colours, and its Undo.
- [ ] Today: the five-day list and its shortened labels.
- [ ] Calendar: the consistency card, and the Streak tab with its three
      choices.
- [ ] A weekend target, on a Saturday or Sunday.
- [ ] Exporting a backup, then restoring it.

Only in the app's own build:

- [ ] The app icon, in the launcher's different icon shapes, and the themed
      (single-colour) icon on Android 13 or later.
- [ ] The launch screen.
- [ ] The wake-up reminder arriving on Android, with its icon in the status
      bar, and being skipped on a day already logged.
- [ ] The two widgets: that they can be added from the widget picker, how
      they look in both themes and in the Rubik font, that a tap on **I'm
      up** logs without opening the app, that the app shows that entry when
      opened, and that the button returns the next morning.
