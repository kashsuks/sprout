import { colors } from '@/theme/colors';

export const currentUser = {
  name: 'eason',
  initial: 'E',
  streak: 9,
  points: 212,
};

export const feedEntries = [
  {
    id: '1',
    name: 'priya',
    task: 'run 3km',
    caption: 'morning run before class :)',
    stampLabel: 'RUN',
    photoBg: colors.forestBg,
    photoEmoji: '🏝️',
  },
  {
    id: '2',
    name: 'eason',
    task: 'read 20 min',
    caption: 'finally finished ch. 4',
    stampLabel: 'RD',
    photoBg: colors.brassBg,
    photoEmoji: '📚',
  },
  {
    id: '3',
    name: 'maya',
    task: 'gym session',
    caption: 'gym w/ kash, felt good',
    stampLabel: 'GYM',
    photoBg: colors.navyBg,
    photoEmoji: '💪',
  },
];

export const duoCard = {
  names: 'eason & kash · gym duo',
  caption: 'leg day, both showed up :)',
  streak: 14,
  photos: [
    { bg: colors.forestBg, emoji: '💪' },
    { bg: colors.navyBg, emoji: '🏃' },
  ],
};

export const leaderboard = [
  { rank: 1, initial: 'M', name: 'maya', points: 640, color: colors.forest, gold: true },
  { rank: 2, initial: 'P', name: 'priya', points: 598, color: colors.brass, gold: true },
  { rank: 3, initial: 'K', name: 'kash', points: 552, color: colors.stamp, gold: true },
  { rank: 4, initial: 'E', name: 'you', points: 490, color: colors.navy, me: true },
  { rank: 5, initial: 'S', name: 'sam', points: 410, color: colors.inkSoft },
  { rank: 6, initial: 'L', name: 'liam', points: 375, color: colors.inkSoft },
];

export const recommendedTasks = [
  { id: 't1', icon: '🏃', iconBg: colors.forestBg, title: 'stretch 10 min', subtitle: 'recommended · daily' },
  { id: 't2', icon: '📚', iconBg: colors.brassBg, title: 'read 20 pages', subtitle: 'recommended · daily' },
  { id: 't3', icon: '💬', iconBg: colors.navyBg, title: 'call a friend', subtitle: 'recommended · weekly' },
];

export const squadGoal = {
  title: 'run 50km together',
  progress: 31,
  target: 50,
};

export const nudges = [
  { id: 'n1', name: 'maya', initial: 'M', message: 'gym at 6?', type: 'action' as const },
  { id: 'n2', name: 'priya', initial: 'P', message: 'priya joined squad goal', type: 'info' as const },
];

export const friendsToLink = [
  { id: 'f1', initial: 'M', name: 'maya', linked: true },
  { id: 'f2', initial: 'P', name: 'priya', linked: false },
  { id: 'f3', initial: 'K', name: 'kash', linked: false },
];

export const profile = {
  name: 'eason',
  streak: 9,
  points: 212,
  pins: ['🏆', '⭐', '✈️', '🔥'],
  scrapbook: [colors.forestBg, colors.brassBg, colors.navyBg, colors.stampBg],
};
