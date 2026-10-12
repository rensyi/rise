// The outline of the wake button as an SVG path in a size x size box: a disc
// whose edge rises and falls `lobes` times. `depth` is how far the edge pulls
// in, as a share of the radius; the dips sit twice that below the peaks.
export function sunPath(size: number, lobes = 10, depth = 0.07, points = 180): string {
  const half = size / 2;
  const steps: string[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (2 * Math.PI * i) / points;
    const r = half * (1 - depth + depth * Math.cos(lobes * angle));
    steps.push(`${(half + r * Math.cos(angle)).toFixed(2)} ${(half + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${steps.join('L')}Z`;
}
