import { create } from 'zustand';

type PointsState = {
  points: number;
  add: (n: number) => void;
  spend: (n: number) => boolean;
  set: (n: number) => void;
};

export const usePointsStore = create<PointsState>((set, get) => ({
  points: 150,

  add: (n) => set((s) => ({ points: s.points + n })),

  spend: (n) => {
    if (get().points < n) return false;
    set((s) => ({ points: s.points - n }));
    return true;
  },

  set: (n) => set({ points: n }),
}));
