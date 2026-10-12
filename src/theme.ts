import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { Level } from './lib/time';

// "Ink and gold". Every colour is from Flexoki by Steph Ango
// (https://stephango.com/flexoki, MIT licence): warm paper and ink, one gold,
// and a red for Delete. src/theme.test.ts holds every pairing to at least 4.5:1.
const PAPER = '#FFFCF0';
const INK = '#100F0F';
const GOLD = '#D0A215'; // yellow-400

type Shades = {
  background: string;
  card: string; // panels, the bottom bar, sheets and dialogs
  row: string; // rows that sit on a panel
  rowSecondary: string; // secondary text on a row
  text: string;
  secondary: string; // secondary text
  border: string; // empty tiles, and the time picker's clock face
  danger: string; // Delete
};

const shades: Record<'dark' | 'light', Shades> = {
  dark: {
    background: INK,
    card: '#1C1B1A', // base-950
    row: '#282726', // base-900
    rowSecondary: '#B7B5AC', // base-300
    text: '#CECDC3', // base-200
    secondary: '#878580', // base-500
    border: '#343331', // base-850
    danger: '#E8705F', // red-300
  },
  light: {
    background: PAPER,
    card: '#F2F0E5', // base-50
    row: '#E6E4D9', // base-100
    rowSecondary: '#575653', // base-700
    text: INK,
    secondary: '#575653', // base-700
    border: '#DAD8CE', // base-150
    danger: '#AF3029', // red-600
  },
};

// One fixed fill and day-number colour per level, the same in both themes, so
// a day looks identical whichever theme is on: gold for on time, darkening to
// the latest.
const TILES: Record<Level, { fill: string; text: string }> = {
  4: { fill: GOLD, text: INK },
  3: { fill: '#AD8301', text: INK }, // yellow-600
  2: { fill: '#664D01', text: '#CECDC3' }, // yellow-800
  1: { fill: '#3A2D04', text: '#CECDC3' }, // yellow-900
};

const shadesOf = (theme: MD3Theme) => shades[theme.dark ? 'dark' : 'light'];

// Surfaces are layered: background, then panel (the card colour), then row.
export const rowColor = (theme: MD3Theme) => shadesOf(theme).row;
export const rowSecondaryColor = (theme: MD3Theme) => shadesOf(theme).rowSecondary;

export const tileColor = (level: Level) => TILES[level].fill;

// Level 0 is an empty tile, which shows the background.
export const tileTextColor = (level: Level | 0, theme: MD3Theme) =>
  level === 0 ? theme.colors.onSurface : TILES[level].text;

// Rubik everywhere. Each weight is its own font file, so the weight is chosen by
// family name and fontWeight is reset to stop the platform faking a bolder one.
const fonts = Object.fromEntries(
  Object.entries(MD3LightTheme.fonts).map(([variant, font]) => [
    variant,
    {
      ...font,
      fontFamily: font.fontWeight === '500' ? 'Rubik_500Medium' : 'Rubik_400Regular',
      fontWeight: 'normal',
    },
  ]),
) as MD3Theme['fonts'];

const raised = (color: string) => ({
  level0: 'transparent',
  level1: color,
  level2: color,
  level3: color,
  level4: color,
  level5: color,
});

// Gold is kept for results and for logging: tiles, the "On time" card, the log
// button and the selected field in the time picker (the two container roles).
// Buttons, switches and the selected segment are ink: the text colour with the
// background colour on top.
const build = (base: MD3Theme, s: Shades): MD3Theme => ({
  ...base,
  fonts,
  colors: {
    ...base.colors,
    primary: s.text,
    onPrimary: s.background,
    primaryContainer: GOLD,
    onPrimaryContainer: INK,
    secondary: s.text,
    onSecondary: s.background,
    secondaryContainer: s.text,
    onSecondaryContainer: s.background,
    tertiary: s.text,
    onTertiary: s.background,
    tertiaryContainer: GOLD,
    onTertiaryContainer: INK,
    error: s.danger,
    onError: s.background,
    background: s.background,
    onBackground: s.text,
    surface: s.background,
    onSurface: s.text,
    surfaceVariant: s.card,
    onSurfaceVariant: s.secondary,
    outline: s.secondary,
    outlineVariant: s.border,
    // The "inverse" roles colour pop-up messages. Material inverts them (a
    // light bar in dark mode); here they take the theme instead: a row-coloured
    // bar with the text colour, and the same for its Undo button.
    inverseSurface: s.row,
    inverseOnSurface: s.text,
    inversePrimary: s.text,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    elevation: raised(s.card),
  },
});

export const lightTheme = build(MD3LightTheme, shades.light);
export const darkTheme = build(MD3DarkTheme, shades.dark);

// Theme for the time picker only. The picker paints its surface with
// elevation.level3 and its clock face with surfaceVariant, which are the same
// colour in the app themes. The clock face is moved one shade stronger so it
// stays visible, and the picker keeps the card colour like the other dialogs.
export const pickerTheme = (theme: MD3Theme): MD3Theme => ({
  ...theme,
  colors: { ...theme.colors, surfaceVariant: theme.colors.outlineVariant },
});
