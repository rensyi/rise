import { darkTheme, lightTheme, pickerTheme } from './theme';

// WCAG contrast ratio between two #RRGGBB colours.
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The time picker paints its surface with elevation.level3, its clock face and
// unselected fields with surfaceVariant, its buttons in primary and its labels
// in onSurfaceVariant.
describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
])('pickerTheme, %s', (_name, theme) => {
  const colors = pickerTheme(theme).colors;

  test('the clock face is a different colour from the picker surface', () => {
    expect(colors.surfaceVariant).not.toBe(colors.elevation.level3);
  });

  test('picker text is readable on the picker surface', () => {
    expect(contrast(colors.primary, colors.elevation.level3)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onSurfaceVariant, colors.elevation.level3)).toBeGreaterThanOrEqual(4.5);
  });
});
