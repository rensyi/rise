import type { Level } from './lib/time';
import {
  darkTheme,
  lightTheme,
  pickerTheme,
  rowColor,
  rowSecondaryColor,
  tileColor,
  tileTextColor,
} from './theme';

const LEVELS: Level[] = [4, 3, 2, 1];

// Every colour the app paints must be one of these Flexoki values.
const FLEXOKI = [
  '#FFFCF0', // paper
  '#F2F0E5', // base-50
  '#E6E4D9', // base-100
  '#DAD8CE', // base-150
  '#CECDC3', // base-200
  '#B7B5AC', // base-300
  '#878580', // base-500
  '#575653', // base-700
  '#343331', // base-850
  '#282726', // base-900
  '#1C1B1A', // base-950
  '#100F0F', // black
  '#D0A215', // yellow-400
  '#AD8301', // yellow-600
  '#664D01', // yellow-800
  '#3A2D04', // yellow-900
  '#E8705F', // red-300
  '#AF3029', // red-600
];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG contrast ratio between two #RRGGBB colours.
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('tiles', () => {
  test('on time is gold, darkening to the latest', () => {
    expect(LEVELS.map((level) => tileColor(level))).toEqual([
      '#D0A215',
      '#AD8301',
      '#664D01',
      '#3A2D04',
    ]);
    const brightness = LEVELS.map((level) => luminance(tileColor(level)));
    expect([...brightness].sort((a, b) => b - a)).toEqual(brightness);
  });

  test.each(LEVELS)('the day number is readable on a level %i tile', (level) => {
    expect(contrast(tileTextColor(level, lightTheme), tileColor(level))).toBeGreaterThanOrEqual(4.5);
  });

  test('a tile and its number are the same in both themes', () => {
    for (const level of LEVELS) {
      expect(tileTextColor(level, darkTheme)).toBe(tileTextColor(level, lightTheme));
    }
  });
});

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
])('%s theme', (_name, theme) => {
  const colors = theme.colors;
  const card = colors.elevation.level1;

  test('every colour the app paints comes from the Flexoki palette', () => {
    const painted = [
      colors.primary,
      colors.onPrimary,
      colors.primaryContainer,
      colors.onPrimaryContainer,
      colors.secondaryContainer,
      colors.onSecondaryContainer,
      colors.tertiaryContainer,
      colors.onTertiaryContainer,
      colors.background,
      colors.onBackground,
      colors.surface,
      colors.onSurface,
      colors.surfaceVariant,
      colors.onSurfaceVariant,
      colors.outline,
      colors.outlineVariant,
      colors.error,
      colors.inverseSurface,
      colors.inverseOnSurface,
      card,
      colors.elevation.level3,
      pickerTheme(theme).colors.surfaceVariant,
      rowColor(theme),
      rowSecondaryColor(theme),
      ...LEVELS.map((level) => tileColor(level)),
      ...LEVELS.map((level) => tileTextColor(level, theme)),
    ];
    for (const colour of painted) expect(FLEXOKI).toContain(colour);
  });

  test('messages take the theme: a row-coloured bar with the text colour, not an inverted one', () => {
    expect(colors.inverseSurface).toBe(rowColor(theme));
    expect(colors.inverseOnSurface).toBe(colors.onSurface);
    // The colour of the message's Undo button.
    expect(colors.inversePrimary).toBe(colors.onSurface);
  });

  test('text is readable on the background, on cards and on buttons', () => {
    expect(contrast(colors.onBackground, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onSurface, card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onSurfaceVariant, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onSurfaceVariant, card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onSecondaryContainer, colors.secondaryContainer)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.inverseOnSurface, colors.inverseSurface)).toBeGreaterThanOrEqual(4.5);
  });

  test('rows are a third tone, between the panel and nothing else, with readable text', () => {
    expect(rowColor(theme)).not.toBe(card);
    expect(rowColor(theme)).not.toBe(colors.background);
    expect(contrast(colors.onSurface, rowColor(theme))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(rowSecondaryColor(theme), rowColor(theme))).toBeGreaterThanOrEqual(4.5);
  });

  test('gold is the log button and selected picker field, with readable text', () => {
    expect(colors.primaryContainer).toBe(tileColor(4));
    expect(colors.tertiaryContainer).toBe(tileColor(4));
    expect(contrast(colors.onPrimaryContainer, colors.primaryContainer)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onTertiaryContainer, colors.tertiaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  test('buttons, switches and the selected segment are ink, not gold', () => {
    expect(colors.primary).toBe(colors.onSurface);
    expect(colors.secondaryContainer).toBe(colors.onSurface);
  });

  test('the red used for Delete is readable on a dialog', () => {
    expect(contrast(colors.error, colors.elevation.level3)).toBeGreaterThanOrEqual(4.5);
  });

  test('an empty tile shows its number in the main text colour', () => {
    expect(tileTextColor(0, theme)).toBe(colors.onSurface);
  });

  test('all text uses Rubik, with the medium weight where Material uses it', () => {
    for (const font of Object.values(theme.fonts)) {
      expect(['Rubik_400Regular', 'Rubik_500Medium']).toContain(font.fontFamily);
    }
    expect(theme.fonts.bodyLarge.fontFamily).toBe('Rubik_400Regular');
    expect(theme.fonts.labelLarge.fontFamily).toBe('Rubik_500Medium');
    expect(theme.fonts.titleMedium.fontFamily).toBe('Rubik_500Medium');
  });

  // The time picker paints its surface with elevation.level3, its clock face and
  // unselected fields with surfaceVariant, its buttons in primary, its labels in
  // onSurfaceVariant and its clock numbers in onSurface.
  describe('time picker', () => {
    const picker = pickerTheme(theme).colors;

    test('sits on the card colour like the other dialogs', () => {
      expect(picker.elevation.level3).toBe(card);
    });

    test('the clock face is a different colour from the picker surface', () => {
      expect(picker.surfaceVariant).not.toBe(picker.elevation.level3);
    });

    test('picker text is readable on the picker surface and on the clock face', () => {
      expect(contrast(picker.primary, picker.elevation.level3)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(picker.onSurfaceVariant, picker.elevation.level3)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(picker.onSurface, picker.surfaceVariant)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
