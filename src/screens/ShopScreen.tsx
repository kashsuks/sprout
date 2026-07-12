import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { usePointsStore } from '@/store/usePointsStore';
import { useShopStore, type ShopTab, type ShopItem } from '@/store/useShopStore';

const TABS: { key: ShopTab; label: string }[] = [
  { key: 'themes', label: 'themes' },
  { key: 'flairs', label: 'flairs' },
  { key: 'decor', label: 'avatar decor' },
];

function ThemePreview({ item }: { item: ShopItem }) {
  return (
    <View style={styles.themePreview}>
      <View style={styles.swatchRow}>
        {item.swatch?.map((c, i) => (
          <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
        ))}
      </View>
    </View>
  );
}

function FlairPreview({ item }: { item: ShopItem }) {
  return (
    <View style={styles.flairPreview}>
      <Text style={styles.flairText}>{item.label ?? item.name}</Text>
    </View>
  );
}

function DecorPreview({ item }: { item: ShopItem }) {
  return (
    <View style={styles.decorPreview}>
      <Text style={styles.decorLetter}>E</Text>
      {item.id === 'gold-ring' && <View style={styles.goldRing} />}
      {item.id === 'dashed-halo' && <View style={styles.dashedHalo} />}
      {item.id === 'leaf-crown' && <Text style={styles.leafCrown}>🌿</Text>}
    </View>
  );
}

function ShopCard({ item, tab }: { item: ShopItem; tab: ShopTab }) {
  const buyItem = useShopStore((s) => s.buyItem);
  const equipItem = useShopStore((s) => s.equipItem);
  const points = usePointsStore((s) => s.points);

  const canAfford = points >= item.price;

  let buttonLabel: string;
  let buttonStyle: object;
  let onPress: (() => void) | undefined;

  if (item.equipped) {
    buttonLabel = 'equipped';
    buttonStyle = styles.btnEquipped;
    onPress = undefined;
  } else if (item.owned) {
    buttonLabel = 'equip';
    buttonStyle = styles.btnOwned;
    onPress = () => equipItem(tab, item.id);
  } else {
    buttonLabel = 'buy';
    buttonStyle = canAfford ? styles.btnBuy : styles.btnLocked;
    onPress = canAfford ? () => buyItem(tab, item.id) : undefined;
  }

  return (
    <View style={styles.card}>
      {tab === 'themes' && <ThemePreview item={item} />}
      {tab === 'flairs' && <FlairPreview item={item} />}
      {tab === 'decor' && <DecorPreview item={item} />}

      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardPrice}>{item.price === 0 ? 'free' : `● ${item.price} pts`}</Text>

      <Pressable
        style={[styles.btn, buttonStyle]}
        disabled={item.equipped || (!item.owned && !canAfford)}
        onPress={onPress}
      >
        <Text style={[
          styles.btnText,
          item.equipped && styles.btnTextEquipped,
          !item.owned && !canAfford && styles.btnTextLocked,
        ]}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ShopScreen() {
  const { tab, setTab, itemsForTab } = useShopStore();
  const points = usePointsStore((s) => s.points);
  const items = itemsForTab(tab);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>marketplace</Text>
        <View style={styles.ptsChip}>
          <Text style={styles.ptsText}>{points} pts</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <ShopCard key={item.id} item={item} tab={tab} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  ptsChip: {
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.stampBg,
  },
  ptsText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.stamp },

  tabBar: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  tabBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },
  tabLabelActive: { color: colors.page },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },

  card: {
    width: '48%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
  },

  themePreview: { height: 56, borderRadius: 8, marginBottom: 8, overflow: 'hidden', backgroundColor: colors.page },
  swatchRow: { flexDirection: 'row', flex: 1 },
  swatch: { flex: 1 },

  flairPreview: { height: 56, borderRadius: 8, marginBottom: 8, backgroundColor: colors.page, alignItems: 'center', justifyContent: 'center' },
  flairText: { fontFamily: fonts.handwriting, fontSize: 16, color: colors.ink },

  decorPreview: { height: 56, borderRadius: 8, marginBottom: 8, backgroundColor: colors.page, alignItems: 'center', justifyContent: 'center' },
  decorLetter: { fontFamily: fonts.display, fontSize: 22, color: colors.brass },
  goldRing: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.brass },
  dashedHalo: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.inkSoft, borderStyle: 'dashed' },
  leafCrown: { position: 'absolute', top: 2, fontSize: 14 },

  cardName: { fontSize: 10.5, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  cardPrice: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginBottom: 7 },

  btn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.stamp,
  },
  btnBuy: { borderColor: colors.stamp },
  btnOwned: { borderStyle: 'solid', borderColor: colors.line },
  btnEquipped: { borderStyle: 'solid', borderColor: colors.forest, backgroundColor: colors.forestBg },
  btnLocked: { opacity: 0.4 },

  btnText: { fontFamily: fonts.monoBold, fontSize: 9.5, color: colors.stamp },
  btnTextEquipped: { color: colors.forest },
  btnTextLocked: { color: colors.stamp },
});
