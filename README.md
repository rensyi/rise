# Rise

A mobile app for tracking when you wake up.

Waking is an exact moment: you wake, you log it. Rise is built around that one
tap. Bedtime can be tracked too, but it is optional, means "laid in bed" and
never affects your wake tracking.

> **Status:** first version working. The project owner checked it on a
> phone on 2026-10-12 against the checklist in the
> [implementation plan](docs/superpowers/plans/2026-10-12-rise.md). The app
> icons are still placeholders; see [assets/README.md](assets/README.md). The
> design is in the
> [design spec](docs/superpowers/specs/2026-10-12-rise-design.md).

## Getting started

```bash
npm install
npx expo start      # then press a for Android, or scan the QR code with Expo Go
npm test            # unit tests
npm run typecheck
```

## How it works

- **One tap to log.** The app opens on Today with one big sun-shaped button.
  Press **I'm up** and the current time is saved for today.
- **The calendar is the heat map.** Each day is coloured by how close you woke
  to your target, like GitHub's contribution tiles, but on the calendar days
  themselves.
- **Your target, your colours.** The default target is 06:00. Set it to 09:00
  and a 09:00 wake-up gets the strongest colour.
- **The past stays put.** Changing your target affects new days only. Past
  colours and stats change only if you turn on "Apply targets to past days".
- **Three places.** Today for logging, Calendar for the month, and Settings,
  on a floating bar at the bottom.
- **Fix it later.** Tap any past day to add, change or delete an entry.
- **Monthly stats.** Days logged, days on time, and average minutes late.
- **Your clock, your theme.** Times show in 12- or 24-hour format and the app
  in light or dark. Both follow your phone by default and can be set in
  Settings.
- **Bedtime is opt-in.** Turn it on in Settings to get a separate Bedtime view
  with its own target, colours and stats.

### Tile colours

| Tile | Woke up | With a 06:00 target |
|---|---|---|
| Strongest | at or before target | 06:00 or earlier |
| Strong | up to 30 min after | up to 06:30 |
| Medium | up to 60 min after | up to 07:00 |
| Faint | more than 60 min after | after 07:00 |
| Empty | not logged | — |

### Look

"Ink and gold": warm paper and ink with one gold, in a dark and a light
theme, set in Rubik. The colours are from
[Flexoki](https://stephango.com/flexoki) by Steph Ango.

| | Dark | Light |
|---|---|---|
| Background | `#100F0F` | `#FFFCF0` |
| Cards | `#1C1B1A` | `#F2F0E5` |
| Text | `#CECDC3` | `#100F0F` |
| Secondary text | `#878580` | `#575653` |

Tiles are the same in both themes, from on time to latest:
`#D0A215`, `#AD8301`, `#664D01`, `#3A2D04`.

## Why 06:00

No study names a single best wake-up time. The default is derived from three
findings:

- Sleep regularity predicted mortality better than sleep duration in about
  61,000 adults
  ([Windred et al., 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10782489/)).
- Each one-hour-earlier sleep midpoint was associated with about 23% lower
  risk of major depression
  ([Daghlas et al., 2021, coverage](https://sleepreviewmag.com/sleep-health/sleep-whole-body/mental-health/waking-one-hour-earlier-cuts-depression-risk/)).
- Falling asleep between 22:00 and 23:00 had the lowest cardiovascular risk
  in about 88,000 adults
  ([2021 study, coverage](https://www.thestar.co.uk/read-this/going-to-sleep-between-10pm-and-11pm-linked-to-lower-heart-disease-risk-study-finds-3450483)).

A 22:00–23:00 sleep onset plus 7–9 hours of sleep gives a wake window of
about 05:00–08:00. 06:00 sits inside it. The right time differs by person,
which is why the target is adjustable. These studies show association, not
cause, and Rise is a habit tracker, not medical advice.

## Tech stack

- [Expo](https://expo.dev) (React Native, TypeScript)
- [React Native Paper](https://callstack.github.io/react-native-paper/) for
  Material 3 components
- [react-native-paper-dates](https://web-ridge.github.io/react-native-paper-dates/)
  for the Material 3 time picker
- AsyncStorage for on-device data. No account, no network.

## Structure

```
App.tsx                      state, theme selection, font loading, Shell
App.test.tsx                 whole-app test
jest.global-setup.js         fixed time zone for tests
src/
  theme.ts                   colours, font, light and dark themes
  theme.test.ts              unit tests
  lib/time.ts                pure logic: levels, labels, month stats
  lib/time.test.ts           unit tests
  storage.ts                 load and save
  storage.test.ts            unit tests
  useRise.ts                 state hook
  Shell.tsx                  shared screen state, bottom bar, day sheet
  screens/
    TodayScreen.tsx          log button or result, last few days
    CalendarScreen.tsx       month, stats, tiles
    SettingsScreen.tsx       grouped settings
  components/
    BigTitle.tsx  Panel.tsx  Pills.tsx  SunButton.tsx  LatenessPill.tsx
    NavBar.tsx  DaySheet.tsx  TimeField.tsx  MonthCalendar.tsx  StatsRow.tsx
assets/                      placeholder icons; see assets/README.md
docs/superpowers/specs/      design spec
docs/superpowers/plans/      implementation plan
docs/prototype/              original web prototype, kept for reference
```

## Not planned

Alarms, sleep duration, streaks, accounts or sync, export, widgets, charts.
