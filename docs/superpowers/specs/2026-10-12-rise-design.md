# Rise — Design Spec

Date: 2026-10-12
Status: approved 2026-10-12; sections 3.5, 5, 7 and 8 amended while writing
the implementation plan (`docs/superpowers/plans/2026-10-12-rise.md`);
sections 3.4, 3.5, 5 and 6 amended after device testing the same day (time
format and theme settings)

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

### 3.1 Home screen

The only screen. Top to bottom:

- **Top app bar** — title "Rise", settings icon on the right.
- **Mode switch** — a Wake / Bedtime segmented button. Shown only when bedtime
  tracking is enabled (3.4). Wake is selected on launch.
- **Target chip** — "Target wake-up 06:00" (or "Target bedtime 22:00"),
  showing the current target.
- **Stats row** — three cards for the viewed month and current mode:
  - *Logged* — number of days with an entry.
  - *On time* — number of level 4 days.
  - *Avg late* — mean of `max(0, diff)` in minutes over logged days, shown as
    `+18m`, `0m`, or `—` when nothing is logged.
- **Month calendar** — previous/next arrows, month and year, weekday header
  starting on Sunday, and one tile per day (3.2).
- **Legend** — the four colour levels with their labels.
- **Extended FAB** — "I'm up" in Wake mode, "In bed" in Bedtime mode (3.3).

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

**Lateness label**, used in the day dialog and accessibility labels:
`On time` (diff 0), `12m early`, `45m late`, and `2.5h late` from 120 minutes
up.

**Bedtime comparison.** Bedtimes cross midnight, so in Bedtime mode both the
logged time and the target are placed on a noon-to-noon clock before `diff`
is computed: a time before 12:00 has 24 hours added. A 22:00 target and a
00:30 entry give `diff = 150`. A 01:00 target and a 00:30 entry give
`diff = −30`.

**Appearance.** Colours are specified in 3.5. Today's tile has an outline.
Future days are dimmed and not tappable. Each tile's accessibility label
states the date, the logged time and the lateness label, so colour is never
the only signal.

### 3.3 Logging

- **One tap.** The FAB saves the current local time as `HH:mm`, together with
  the current target.
  - "I'm up" saves under today's date.
  - "In bed" saves under today's date, or under yesterday's date when tapped
    before 12:00, so a 01:00 bedtime belongs to the night before.
  - The FAB is hidden when the day it would write to already has an entry.
  - A snackbar confirms: "Logged 06:12".
- **Edit, backfill, delete.** Tapping today or any past day opens the day
  dialog: the date, the target the day is measured against, a time field that
  opens the Material 3 time picker, a live preview of the level colour and
  lateness label, and Save / Delete / Cancel.
  - Delete appears only when the day has an entry.
  - A new entry starts at the current target time and stores the current
    target.
  - Editing an existing entry changes its time only; its stored target is
    kept.

### 3.4 Settings

A dialog opened from the top app bar:

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

The dialog scrolls, so every setting stays reachable on a short screen.

Turning Track bedtime off hides the mode switch and returns Home to Wake
mode. Bedtime entries are kept and reappear when it is turned back on.

"Apply targets to past days" is one switch covering both modes. It only
selects which target each mode's own entries are compared with; it does not
link wake and bedtime.

### 3.5 Theme and colour

The Theme setting (3.4) picks light or dark; by default it follows the
system setting. Both themes are built from one
palette:

| Name | Hex | Light theme | Dark theme |
|---|---|---|---|
| Lavender | `#A996E0` | primary: buttons, FAB, tiles | same |
| Lilac haze | `#E4DCF7` | cards | secondary text |
| Morning mist | `#F7F4FD` | background | main text |
| Deep plum | `#2E2645` | main text | background |
| Peach blush | `#F4B49A` | highlight fill: target chip | same |
| Butter sun | `#F3D68A` | win fill: On time card | same |
| Muted purple | `#6B5FA0` | secondary text on background | not used |

Rules that follow from measured contrast ratios (WCAG AA needs 4.5:1 for
text):

- **Text on Lavender, Peach blush and Butter sun is always Deep plum**
  (5.5:1, 8.0:1, 10.0:1). White on Lavender is 2.6:1 and is not used.
- **Peach blush and Butter sun are fills only**, never text or thin lines.
  They are too light to read on light surfaces (1.6:1 and 1.1:1).
- **Muted purple is used only on the Morning mist background** (5.1:1). On
  Lilac haze cards it is 4.2:1, so card text is Deep plum.
- **Dark theme secondary text is Lilac haze**, because Muted purple on Deep
  plum is 2.6:1.
- **Dark theme cards are `#3D3358`** — Lavender at 12% over Deep plum, the
  Material 3 way of tinting a raised surface. This is the only colour not in
  the palette; Lilac haze cards on a Deep plum background would glare.
- **Lavender is never used as text on light surfaces** (2.4:1 on Morning
  mist). Text-only buttons use the main text colour, and in the light theme
  the time picker, which draws its own text in the primary colour, is given
  Muted purple as its primary.
- **The time picker's own surface is the screen background colour**, not the
  card colour, in both themes. The picker draws its clock face in the card
  colour, so on a card-coloured surface the face would be invisible and its
  text would fall to 4.2:1 (light) and 4.5:1 (dark).

**Tiles** are Lavender over the background at four opacities:

| Level | Opacity | Day number colour |
|---|---|---|
| 4 | 1.0 | Deep plum |
| 3 | 0.55 | main text |
| 2 | 0.35 | main text |
| 1 | 0.18 | main text |
| 0 | none | main text |

Every tile and number pairing is at least 4.8:1 in both themes. The four
opacities are constants in one place so they can be tuned on a real device.
Today's outline uses the main text colour.

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

Expo (React Native, TypeScript), one screen, no navigation library.

```
App.tsx                      PaperProvider + HomeScreen
jest.global-setup.js         fixed time zone for tests
src/theme.ts                 palette, light and dark themes, tile opacities
src/theme.test.ts            unit tests
src/lib/time.ts              pure logic, no React, no storage
src/lib/time.test.ts         unit tests
src/storage.ts               parse, load, save
src/storage.test.ts          unit tests
src/useRise.ts               state hook
src/HomeScreen.tsx           screen layout
src/components/
  TimeField.tsx              time button + time picker, used by both dialogs
  TimeField.test.tsx         unit test
  MonthCalendar.tsx          grid of tiles, legend
  StatsRow.tsx               three stat cards
  DayDialog.tsx              add, edit, delete one day
  SettingsDialog.tsx         targets and switches
```

| Unit | Does | Depends on |
|---|---|---|
| `lib/time.ts` | `parseTime`, `dateKey`, `effectiveTarget(entry, currentTarget, applyToPast)`, `level(target, logged, mode)`, `latenessLabel`, `monthStats`, `bedDateFor(now)`, entry helpers, time formatting | nothing |
| `storage.ts` | `load()` returns `{wake, bed, config}`; `saveWake`, `saveBed`, `saveConfig`; `persist` (save, revert on failure) | AsyncStorage |
| `useRise.ts` | holds state, exposes `logNow`, `setEntry`, `deleteEntry`, `setConfig` | `storage.ts`, `lib/time.ts` |
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
- Development only: `jest-expo`, `jest`, `@types/jest`,
  `react-test-renderer`, `@types/react-test-renderer`

**Theme.** `src/theme.ts` extends Paper's Material 3 light and dark themes
with the palette in 3.5, written out by hand. No runtime colour generation
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

The remaining components and the home screen are checked by running the app.

## 9. Out of scope

Alarms and reminders, sleep duration, a consistency or streak stat, accounts
and sync, export or backup, home-screen widgets, charts, per-weekday targets,
multiple entries per day.

## 10. Prototype

`docs/prototype/rise-tracker.jsx` is the web prototype this design grew
from. It stays as a reference. It differs from this spec in these ways: six
grey lateness steps instead of four Lavender levels, a fixed dark look
instead of the palette, bedtime always visible, no one-tap logging, target
changes re-colouring all history, and silent save failures.
