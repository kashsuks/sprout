import { create } from 'zustand';
import { usePointsStore } from './usePointsStore';

export type ShopTab = 'themes' | 'flairs' | 'decor';

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  swatch?: string[];
  label?: string;
};

export const SHOP_THEMES: ShopItem[] = [
  { id: 'default', name: 'sprout green', price: 0, owned: true, equipped: true, swatch: ['#5b7a3f', '#4a6b4d', '#b8863a'] },
  { id: 'sunset', name: 'sunset clay', price: 150, owned: false, equipped: false, swatch: ['#b3673c', '#c99a45', '#4a6b4d'] },
  { id: 'ocean', name: 'ocean navy', price: 150, owned: false, equipped: false, swatch: ['#2f4d63', '#5b7a3f', '#b8863a'] },
  { id: 'berry', name: 'berry', price: 200, owned: false, equipped: false, swatch: ['#8a3e5c', '#5b7a3f', '#b8863a'] },
];

export const SHOP_FLAIRS: ShopItem[] = [
  { id: 'none', name: 'no flair', price: 0, owned: true, equipped: true },
  { id: 'early', name: 'early bird', price: 80, owned: false, equipped: false, label: 'early bird' },
  { id: 'streaker', name: '100 day streaker', price: 250, owned: false, equipped: false, label: '100 day streaker' },
  { id: 'og', name: 'og sprout', price: 500, owned: false, equipped: false, label: 'og sprout' },
];

export const SHOP_DECOR: ShopItem[] = [
  { id: 'none', name: 'no frame', price: 0, owned: true, equipped: true },
  { id: 'gold-ring', name: 'gold ring', price: 120, owned: false, equipped: false },
  { id: 'leaf-crown', name: 'leaf crown', price: 180, owned: false, equipped: false },
  { id: 'dashed-halo', name: 'dashed halo', price: 100, owned: false, equipped: false },
];

type ShopState = {
  tab: ShopTab;
  themes: ShopItem[];
  flairs: ShopItem[];
  decor: ShopItem[];

  setTab: (tab: ShopTab) => void;
  buyItem: (tab: ShopTab, id: string) => void;
  equipItem: (tab: ShopTab, id: string) => void;
  itemsForTab: (tab: ShopTab) => ShopItem[];
};

export const useShopStore = create<ShopState>((set, get) => ({
  tab: 'themes',
  themes: SHOP_THEMES,
  flairs: SHOP_FLAIRS,
  decor: SHOP_DECOR,

  setTab: (tab) => set({ tab }),

  buyItem: (tab, id) => {
    const pts = usePointsStore.getState();
    const list = get().itemsForTab(tab);
    const item = list.find((x) => x.id === id);
    if (!item || item.owned) return;
    if (!pts.spend(item.price)) return;

    const key = tab === 'themes' ? 'themes' : tab === 'flairs' ? 'flairs' : 'decor';
    set((s) => ({
      [key]: (s[key] as ShopItem[]).map((x) =>
        x.id === id ? { ...x, owned: true } : x
      ),
    }));
  },

  equipItem: (tab, id) => {
    const key = tab === 'themes' ? 'themes' : tab === 'flairs' ? 'flairs' : 'decor';
    set((s) => ({
      [key]: (s[key] as ShopItem[]).map((x) => ({
        ...x,
        equipped: x.id === id,
      })),
    }));
  },

  itemsForTab: (tab) => {
    const s = get();
    if (tab === 'themes') return s.themes;
    if (tab === 'flairs') return s.flairs;
    return s.decor;
  },
}));
