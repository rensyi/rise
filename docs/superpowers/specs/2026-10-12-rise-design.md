# Rise — Design Spec

Date: 2026-10-12
Status: approved 2026-10-12; sections 3.5, 5, 7 and 8 amended while writing
the implementation plan (`docs/superpowers/plans/2026-10-12-rise.md`);
sections 3.4, 3.5, 5 and 6 amended after device testing the same day (time
format and theme settings); section 3.5 rewritten for the Ink and gold palette and
Rubik font; sections 3.1, 3.3, 3.4 and 5 rewritten for the three-screen
Material 3 Expressive layout

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
**Bedtime** pill tabs under the title. They share one selection.

**Today** is where the app opens.

- **Title** — the weekday in large type, with the date under it.
- **The log button** — one large gold button: a sun shape reading "I'm up" in
  Wake mode, a plain disc reading "In bed" in Bedtime mode. Under the label
  it shows the current target.
- **After logging** — the button is replaced by a card with "You got up at"
  (or "You went to bed at"), the time in large type, and the lateness label.
- **Last few days** — four rows, the day a tap would log to and the three
  before it, each with its time and lateness label or "No entry". Tapping a
  row opens the day sheet (3.3).

**Calendar** shows one month.

- **Title** — the month in large type, the year under it, and two round
  buttons for the previous and next month.
- **Stats row** — three cards for the viewed month and current mode:
  - *Logged* — number of days with an entry.
  - *On time* — number of level 4 days. This card is a gold pill.
  - *Avg late* — mean of `max(0, diff)` in minutes over logged days, shown as
    `+18m`, `0m`, or `—` when nothing is logged.
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
  - A snackbar confirms: "Logged 06:12".
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

A page of grouped rows, in three groups: Wake-up, Bedtime and Display. Every
change applies at once.

- **Target wake-up time** — default 06:00.
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
- **One playful shape.** The wake button is Material's "sunny" shape, built
  from three overlapping rounded squares. Nothing else uses a novelty shape.
- The time picker is a ready-made component and keeps its standard look.

**Type.** All text is Rubik (Google Fonts, Open Font License), in regular and
medium weights, loaded when the app starts. The app waits for the font so
text does not jump; if the font fails to load, the app opens in the system
font.

**Times** are shown as `6:05 AM` or `06:05` according to the Time format
setting (3.4), and the time picker uses the same mode. Formatting is done in
the app's own code, not `Intl.DateTimeFormat`: `Intl` follows the language
region and ignores the phone's separate 12/24-hour switch, which was found
on a real device. Stored times are always 24-hour.

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
src/storage.ts               parse, load, save
src/storage.test.ts          unit tests
src/useRise.ts               state hook
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
  LatenessPill.tsx           "12mins late" in the tile's colour
  NavBar.tsx                 floating bottom bar
  DaySheet.tsx               add, edit, delete one day
  TimeField.tsx              time button or large time + time picker
  TimeField.test.tsx         unit test
  MonthCalendar.tsx          grid of tiles, legend
  StatsRow.tsx               three stat cards
```

| Unit | Does | Depends on |
|---|---|---|
| `lib/time.ts` | `parseTime`, `dateKey`, `effectiveTarget(entry, currentTarget, applyToPast)`, `level(target, logged, mode)`, `latenessLabel`, `monthStats`, `bedDateFor(now)`, entry helpers, time formatting | nothing |
| `storage.ts` | `load()` returns `{wake, bed, config}`; `saveWake`, `saveBed`, `saveConfig`; `persist` (save, revert on failure) | AsyncStorage |
| `useRise.ts` | holds state, exposes `logNow`, `setEntry`, `deleteEntry`, `setConfig` | `storage.ts`, `lib/time.ts` |
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
| `rise.config` | `{ "wakeTarget": "06:00", "bedEnabled": false, "bedTarget": "22:00", "applyTargetsToPast": false, "timeFormat": "device", "theme": "device" }` |

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
- font loading, slow and failed

Layout and colour are checked by running the app.

## 9. Out of scope

Alarms and reminders, sleep duration, a consistency or streak stat, accounts
and sync, export or backup, home-screen widgets, charts, per-weekday targets,
multiple entries per day.

## 10. Prototype

`docs/prototype/rise-tracker.jsx` is the web prototype this design grew
from. It stays as a reference. It differs from this spec in these ways: six
grey lateness steps instead of four gold ones, a dark look only with no light
theme,
DM Mono and DM Serif Display instead of Rubik, bedtime always visible, no one-tap logging, target
changes re-colouring all history, and silent save failures.
