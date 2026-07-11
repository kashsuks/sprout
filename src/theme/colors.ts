// Lifted directly from the "still" mockup's :root CSS variables
export const colors = {
  canvas: '#2e2015',
  canvasEdge: '#20150c',

  page: '#f4ecd8',
  card: '#fffaf0',

  ink: '#241b12',
  inkSoft: '#6b5d47',

  stamp: '#a63b2e',
  stampBg: '#f0d9d0',

  brass: '#b8863a',
  brassBg: '#f2e3c4',

  navy: '#2f4d63',
  navyBg: '#dfe7ec',

  forest: '#4a6b4d',
  forestBg: '#e2ead9',

  line: '#d9cbab',

  white: '#ffffff',
} as const;

// Deterministic avatar background color from a name, matching the
// leaderboard/feed avatars in the mockup (forest / brass / stamp / navy / inkSoft rotation)
const avatarPalette = [colors.forest, colors.brass, colors.stamp, colors.navy, colors.inkSoft];
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[hash % avatarPalette.length];
}
