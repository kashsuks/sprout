import { create } from 'zustand';
import { colors } from '@/theme/colors';

export type Category = { id: string; label: string; color: 'forest' | 'brass' | 'navy' };

export type Task = {
  id: string;
  name: string;
  emoji: string;
  color: 'forest' | 'brass' | 'navy';
  streak: number;
  cadence: 'daily' | 'weekly' | 'custom';
  category: string;
  friend: string | null;
  done: boolean;
  photo: string | null;
  caption: string;
};

export type FeedEntry = {
  id: string;
  name: string;
  task: string;
  caption: string;
  iconType: string | null;
  photo: string | null;
  color: 'forest' | 'brass' | 'navy';
  code: string;
  streak: number;
  dayPts: number;
  total: number;
};

export type Friend = { name: string; color: 'forest' | 'brass' | 'navy' | 'stamp'; linked: boolean };

export type Nudge = {
  name: string;
  text: string;
  color: 'forest' | 'brass' | 'navy';
  status: 'pending' | 'info';
  acted?: 'accept' | 'later';
};

export type LeaderboardRow = {
  name: string;
  pts: number;
  color: 'forest' | 'brass' | 'navy' | 'stamp' | 'ink';
  isYou?: boolean;
};

const CELEBRATIONS = [
  { emoji: '🌱', msg: 'sprouted.' },
  { emoji: '🌿', msg: 'new growth, right there.' },
  { emoji: '🍃', msg: 'well tended.' },
  { emoji: '🌼', msg: 'look at that bloom.' },
  { emoji: '🌾', msg: 'rooted for today.' },
];

function abbrev(name: string) {
  return name
    .replace(/[^a-zA-Z ]/g, '')
    .split(' ')[0]
    .slice(0, 3)
    .toUpperCase();
}

type AppState = {
  points: number;
  streakDays: number;

  categories: Category[];
  tasks: Task[];

  composeText: string;
  composeCategory: string;
  composeFriend: string | null;

  taskFilter: string;
  archiveOpen: boolean;

  feed: FeedEntry[];
  duo: { partner: string; label: string; streak: number; icons: [string, string] };

  leaderboardFriends: LeaderboardRow[];
  leaderboardSquad: LeaderboardRow[];

  squad: { label: string; current: number; target: number; nudges: Nudge[] };
  friends: Friend[];

  pins: string[];
  privacy: boolean;

  setComposeText: (v: string) => void;
  setComposeCategory: (id: string) => void;
  setComposeFriend: (name: string | null) => void;
  setTaskFilter: (id: string) => void;
  setArchiveOpen: (v: boolean) => void;
  addTask: () => void;

  completeTask: (id: string, opts: { photo: string | null; caption: string; share: boolean }) => {
    emoji: string;
    msg: string;
  };

  toggleFriendLink: (index: number) => void;
  actNudge: (index: number, action: 'accept' | 'later') => void;
  togglePrivacy: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  points: 212,
  streakDays: 9,

  categories: [
    { id: 'health', label: 'health', color: 'forest' },
    { id: 'mind', label: 'mind', color: 'brass' },
    { id: 'social', label: 'social', color: 'navy' },
  ],

  tasks: [
    { id: 'stretch', name: 'stretch 10 min', emoji: '🧘', color: 'forest', streak: 9, cadence: 'daily', category: 'health', friend: null, done: false, photo: null, caption: '' },
    { id: 'read', name: 'read 20 pages', emoji: '📖', color: 'brass', streak: 4, cadence: 'daily', category: 'mind', friend: null, done: false, photo: null, caption: '' },
    { id: 'call', name: 'call a friend', emoji: '💬', color: 'navy', streak: 2, cadence: 'weekly', category: 'social', friend: null, done: false, photo: null, caption: '' },
  ],

  composeText: '',
  composeCategory: 'health',
  composeFriend: null,

  taskFilter: 'all',
  archiveOpen: false,

  feed: [
    { id: 'f1', name: 'priya', task: 'run 3km', caption: 'morning run before class, legs are toast :)', iconType: 'run', photo: null, color: 'forest', code: 'RUN', streak: 6, dayPts: 15, total: 598 },
    { id: 'f2', name: 'eason', task: 'read 20 min', caption: 'finally finished ch. 4, plot twist i did NOT see coming', iconType: 'read', photo: null, color: 'brass', code: 'RD', streak: 4, dayPts: 10, total: 212 },
    { id: 'f3', name: 'maya', task: 'gym session', caption: 'gym w/ kash, felt good today', iconType: 'gym', photo: null, color: 'navy', code: 'GYM', streak: 21, dayPts: 20, total: 640 },
  ],
  duo: { partner: 'kash', label: 'gym duo', streak: 14, icons: ['gym', 'gym'] },

  leaderboardFriends: [
    { name: 'maya', pts: 640, color: 'forest' },
    { name: 'priya', pts: 598, color: 'brass' },
    { name: 'kash', pts: 552, color: 'stamp' },
    { name: 'you', pts: 212, color: 'navy', isYou: true },
    { name: 'sam', pts: 410, color: 'ink' },
    { name: 'liam', pts: 375, color: 'ink' },
  ],
  leaderboardSquad: [
    { name: 'kash', pts: 552, color: 'stamp' },
    { name: 'you', pts: 212, color: 'navy', isYou: true },
    { name: 'priya', pts: 598, color: 'brass' },
  ],

  squad: {
    label: 'run 50km together',
    current: 31,
    target: 50,
    nudges: [
      { name: 'maya', text: 'gym at 6?', color: 'brass', status: 'pending' },
      { name: 'priya', text: 'joined squad goal', color: 'forest', status: 'info' },
    ],
  },
  friends: [
    { name: 'maya', color: 'forest', linked: true },
    { name: 'priya', color: 'brass', linked: false },
    { name: 'kash', color: 'stamp', linked: false },
  ],

  pins: ['🏆', '🌟', '✈️', '🔥'],
  privacy: true,

  setComposeText: (v) => set({ composeText: v }),
  setComposeCategory: (id) => set({ composeCategory: id }),
  setComposeFriend: (name) => set({ composeFriend: name }),
  setTaskFilter: (id) => set({ taskFilter: id }),
  setArchiveOpen: (v) => set({ archiveOpen: v }),

  addTask: () => {
    const { composeText, composeCategory, composeFriend, tasks } = get();
    const val = composeText.trim();
    if (!val) return;
    const cat = get().categories.find((c) => c.id === composeCategory)!;
    const task: Task = {
      id: 'custom_' + Date.now(),
      name: val,
      emoji: '✨',
      color: cat.color,
      streak: 0,
      cadence: 'custom',
      category: composeCategory,
      friend: composeFriend,
      done: false,
      photo: null,
      caption: '',
    };
    set({ tasks: [...tasks, task], composeText: '', composeFriend: null });
  },

  completeTask: (id, { photo, caption, share }) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return CELEBRATIONS[0];

    const updatedTask: Task = { ...task, done: true, streak: task.streak + 1, photo, caption };
    const nextPoints = state.points + 15;
    const nextStreakDays = state.streakDays + 1;

    let nextFeed = state.feed;
    if (share) {
      const entry: FeedEntry = {
        id: 'e' + Date.now(),
        name: 'eason',
        task: task.name,
        caption: caption || 'stamped it :)',
        iconType: null,
        photo,
        color: task.color,
        code: abbrev(task.name),
        streak: updatedTask.streak,
        dayPts: 15,
        total: nextPoints,
      };
      nextFeed = [entry, ...state.feed];
    }

    set({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      points: nextPoints,
      streakDays: nextStreakDays,
      feed: nextFeed,
    });

    return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
  },

  toggleFriendLink: (index) => {
    const friends = [...get().friends];
    friends[index] = { ...friends[index], linked: !friends[index].linked };
    set({ friends });
  },

  actNudge: (index, action) => {
    const squad = { ...get().squad, nudges: [...get().squad.nudges] };
    squad.nudges[index] = { ...squad.nudges[index], acted: action };
    if (action === 'accept') squad.current = Math.min(squad.target, squad.current + 1);
    set({ squad });
  },

  togglePrivacy: () => set({ privacy: !get().privacy }),
}));

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
