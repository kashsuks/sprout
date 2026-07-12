import { create } from 'zustand';
import { usePointsStore } from './usePointsStore';

export type PlantType = 'health' | 'mind' | 'social';

export type GardenPlot = {
  type: PlantType;
  stage: 0 | 1 | 2;
  health: number;
  watered: boolean;
  pest: 'caterpillar' | 'ant' | null;
  weed: boolean;
};

export const GARDEN_STAGES: Record<PlantType, string[]> = {
  health: ['🌱', '🌿', '🌻'],
  mind:   ['🌱', '🌾', '🌻'],
  social: ['🌱', '🍀', '🌸'],
};

export const SEED_PRICES: Record<PlantType, number> = { health: 15, mind: 20, social: 25 };
export const HARVEST_REWARDS: Record<PlantType, number> = { health: 30, mind: 38, social: 45 };
export const GARDEN_COSTS = { water: 5, fertilize: 15, weed: 8, catch: 10, grow: 5 };

export const CATEGORIES: { id: PlantType; label: string }[] = [
  { id: 'health', label: 'health' },
  { id: 'mind', label: 'mind' },
  { id: 'social', label: 'social' },
];

export type ToolMode = 'water' | 'fertilize' | 'weed' | 'catch' | null;

type GardenState = {
  plots: (GardenPlot | null)[];
  toolMode: ToolMode;
  selectingPlot: number | null;
  bugCatching: number | null;

  setToolMode: (mode: ToolMode) => void;
  tapPlot: (index: number) => void;
  waterAll: () => void;
  plantSeed: (type: PlantType) => void;
  catchBug: () => void;
  skipBug: () => void;
  cancelPlant: () => void;
};

export const useGardenStore = create<GardenState>((set, get) => ({
  plots: [
    { type: 'health', stage: 2, health: 85, watered: true, pest: null, weed: false },
    { type: 'mind', stage: 1, health: 60, watered: false, pest: null, weed: false },
    null,
    null,
    { type: 'social', stage: 0, health: 45, watered: false, pest: 'caterpillar', weed: false },
    null,
    null,
    null,
    null,
  ],
  toolMode: null,
  selectingPlot: null,
  bugCatching: null,

  setToolMode: (mode) => set((s) => ({ toolMode: s.toolMode === mode ? null : mode })),

  tapPlot: (index) => {
    const s = get();
    const pts = usePointsStore.getState();
    const plot = s.plots[index];

    if (s.toolMode === 'water' && plot) {
      if (!pts.spend(GARDEN_COSTS.water)) return;
      const next = [...s.plots];
      next[index] = { ...plot, watered: true, health: Math.min(100, plot.health + 15) };
      set({ plots: next, toolMode: null });
      return;
    }
    if (s.toolMode === 'fertilize' && plot && plot.stage < 2) {
      if (!pts.spend(GARDEN_COSTS.fertilize)) return;
      const next = [...s.plots];
      next[index] = { ...plot, health: Math.min(100, plot.health + 10), stage: Math.min(2, plot.stage + 1) as 0 | 1 | 2 };
      set({ plots: next, toolMode: null });
      return;
    }
    if (s.toolMode === 'weed' && plot && plot.weed) {
      if (!pts.spend(GARDEN_COSTS.weed)) return;
      const next = [...s.plots];
      next[index] = { ...plot, weed: false, health: Math.min(100, plot.health + 5) };
      set({ plots: next, toolMode: null });
      return;
    }
    if (s.toolMode === 'catch' && plot && plot.pest) {
      set({ bugCatching: index });
      return;
    }
    if (!plot) {
      set({ selectingPlot: index });
      return;
    }
    if (plot.stage < 2) {
      if (!pts.spend(GARDEN_COSTS.grow)) return;
      const next = [...s.plots];
      next[index] = { ...plot, stage: (plot.stage + 1) as 0 | 1 | 2 };
      set({ plots: next });
      return;
    }
    const reward = HARVEST_REWARDS[plot.type];
    pts.add(reward);
    const next = [...s.plots];
    next[index] = null;
    set({ plots: next });
  },

  waterAll: () => {
    const s = get();
    const pts = usePointsStore.getState();
    const planted = s.plots.filter((p): p is GardenPlot => p !== null);
    const cost = GARDEN_COSTS.water * planted.length;
    if (!pts.spend(cost) || planted.length === 0) return;
    const next = s.plots.map((p) =>
      p ? { ...p, watered: true, health: Math.min(100, p.health + 10) } : null
    );
    set({ plots: next });
  },

  plantSeed: (type) => {
    const s = get();
    const pts = usePointsStore.getState();
    const i = s.selectingPlot;
    if (i === null) return;
    const price = SEED_PRICES[type];
    if (!pts.spend(price)) return;
    const next = [...s.plots];
    next[i] = { type, stage: 0, health: 100, watered: false, pest: null, weed: false };
    set({ plots: next, selectingPlot: null });
  },

  catchBug: () => {
    const s = get();
    const pts = usePointsStore.getState();
    const i = s.bugCatching;
    if (i === null) return;
    if (!pts.spend(GARDEN_COSTS.catch)) { set({ bugCatching: null }); return; }
    const plot = s.plots[i];
    if (plot && plot.pest) {
      const next = [...s.plots];
      next[i] = { ...plot, pest: null, health: Math.min(100, plot.health + 10) };
      set({ plots: next, bugCatching: null });
    } else {
      set({ bugCatching: null });
    }
  },

  skipBug: () => set({ bugCatching: null }),
  cancelPlant: () => set({ selectingPlot: null }),
}));
