// Lifted directly from the "sprout" mockup's :root CSS variables
export const colors = {
  canvas: '#1e2a1f',
  canvasEdge: '#141d16',

  page: '#f6f2e7',
  card: '#fffdf7',

  ink: '#26301f',
  inkSoft: '#6d7a63',

  stamp: '#5a7d3f',
  stampBg: '#e3ead7',

  brass: '#c99a45',
  brassBg: '#f5ecd4',

  navy: '#b3673c',
  navyBg: '#f2e0d1',

  forest: '#3e6b4f',
  forestBg: '#dcead9',

  line: '#ddd6c2',

  white: '#ffffff',
} as const;

// Category colors used for the health / mind / social task groups.
export const categoryColors: Record<string, { color: string; bg: string }> = {
  health: { color: colors.forest, bg: colors.forestBg },
  mind: { color: colors.brass, bg: colors.brassBg },
  social: { color: colors.navy, bg: colors.navyBg },
};

// Gradient + icon tiles for the photo placeholders (run / gym / read / books)
export const photoGradients: Record<string, [string, string]> = {
  run: ['#6b9470', '#3c5a3f'],
  gym: ['#4f7089', '#23384a'],
  read: ['#d3a25c', '#93672c'],
  books: ['#c1584a', '#7f2e23'],
};

// Deterministic avatar background color from a name, matching the
// leaderboard/feed avatars in the mockup (forest / brass / navy / stamp rotation)
const avatarPalette = [colors.forest, colors.brass, colors.navy, colors.stamp, colors.inkSoft];
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[hash % avatarPalette.length];
}

export type ColorName = 'forest' | 'brass' | 'navy' | 'stamp' | 'ink';

export function colorToken(name: string): string {
  switch (name) {
    case 'forest':
      return colors.forest;
    case 'brass':
      return colors.brass;
    case 'navy':
      return colors.navy;
    case 'stamp':
      return colors.stamp;
    default:
      return colors.inkSoft;
  }
}

export function colorBgToken(name: string): string {
  switch (name) {
    case 'forest':
      return colors.forestBg;
    case 'brass':
      return colors.brassBg;
    case 'navy':
      return colors.navyBg;
    case 'stamp':
      return colors.stampBg;
    default:
      return colors.page;
  }
}
