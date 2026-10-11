import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { Level } from './lib/time';

export const palette = {
  lavender: '#A996E0',
  lilacHaze: '#E4DCF7',
  morningMist: '#F7F4FD',
  deepPlum: '#2E2645',
  peachBlush: '#F4B49A',
  butterSun: '#F3D68A',
  mutedPurple: '#6B5FA0',
  darkCard: '#3D3358', // lavender at 12% over deep plum
} as const;

// Lavender strength per tile level. Tune here after checking on a real device.
const TILE_OPACITY: Record<Level, number> = { 4: 1, 3: 0.55, 2: 0.35, 1: 0.18 };

export const tileColor = (level: Level) => `rgba(169, 150, 224, ${TILE_OPACITY[level]})`;

// Level 4 is solid lavender, which needs deep plum text in both themes.
export const tileTextColor = (level: Level | 0, theme: MD3Theme) =>
  level === 4 ? palette.deepPlum : theme.colors.onSurface;

// Lavender fills always carry deep plum text; white on lavender is unreadable.
const shared = {
  primary: palette.lavender,
  onPrimary: palette.deepPlum,
  primaryContainer: palette.lavender,
  onPrimaryContainer: palette.deepPlum,
  secondaryContainer: palette.lavender,
  onSecondaryContainer: palette.deepPlum,
  tertiaryContainer: palette.peachBlush,
  onTertiaryContainer: palette.deepPlum,
};

const raised = (color: string) => ({
  level0: 'transparent',
  level1: color,
  level2: color,
  level3: color,
  level4: color,
  level5: color,
});

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...shared,
    background: palette.morningMist,
    onBackground: palette.deepPlum,
    surface: palette.morningMist,
    onSurface: palette.deepPlum,
    surfaceVariant: palette.lilacHaze,
    onSurfaceVariant: palette.mutedPurple,
    inverseSurface: palette.deepPlum,
    inverseOnSurface: palette.morningMist,
    elevation: raised(palette.lilacHaze),
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...shared,
    background: palette.deepPlum,
    onBackground: palette.morningMist,
    surface: palette.deepPlum,
    onSurface: palette.morningMist,
    surfaceVariant: palette.darkCard,
    onSurfaceVariant: palette.lilacHaze,
    inverseSurface: palette.morningMist,
    inverseOnSurface: palette.deepPlum,
    elevation: raised(palette.darkCard),
  },
};

// Theme for the time picker only. The picker paints its surface with
// elevation.level3 and its clock face with surfaceVariant, which are the same
// colour in the app themes, so the surface is moved to the background colour
// to keep the clock face visible. It also draws text in `primary`: lavender is
// unreadable on light surfaces, so the light theme swaps in muted purple.
export const pickerTheme = (theme: MD3Theme): MD3Theme => ({
  ...theme,
  colors: {
    ...theme.colors,
    ...(theme.dark ? {} : { primary: palette.mutedPurple, onPrimary: palette.morningMist }),
    elevation: { ...theme.colors.elevation, level3: theme.colors.background },
  },
});
