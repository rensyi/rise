import { sunPath } from './sun';

const SIZE = 184;
const radii = (path: string) =>
  path
    .slice(1, -1)
    .split('L')
    .map((point) => point.split(' ').map(Number))
    .map(([x, y]) => Math.hypot(x - SIZE / 2, y - SIZE / 2));

test('the sun outline is a closed path that starts on a peak and stays inside its box', () => {
  const path = sunPath(SIZE);

  expect(path.startsWith('M184.00 92.00L')).toBe(true);
  expect(path.endsWith('Z')).toBe(true);
  expect(Math.max(...radii(path))).toBeCloseTo(92, 1);
});

test('the sun has ten scallops, each dipping 14% of the radius', () => {
  const all = radii(sunPath(SIZE));
  const peaks = all.filter((r, i) => r > all.at(i - 1)! && r > all[(i + 1) % all.length]);

  expect(peaks.length).toBe(10);
  expect(Math.min(...all)).toBeCloseTo(92 * 0.86, 1);
});
