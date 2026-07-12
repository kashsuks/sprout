import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { usePointsStore } from '@/store/usePointsStore';
import { useGardenStore, GARDEN_STAGES, SEED_PRICES, HARVEST_REWARDS, GARDEN_COSTS, CATEGORIES, type ToolMode, type GardenPlot } from '@/store/useGardenStore';

function healthColor(hp: number) {
  if (hp > 60) return colors.forest;
  if (hp > 30) return '#c99a45';
  return '#c94a4a';
}

function ToolBtn({ icon, label, cost, mode, active, onPress }: { icon: string; label: string; cost: number; mode: ToolMode; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tool, active && styles.toolActive]} onPress={onPress}>
      <Text style={styles.toolIcon}>{icon}</Text>
      <Text style={[styles.toolLabel, active && styles.toolLabelActive]}>{label}</Text>
      <Text style={styles.toolCost}>{cost} pts</Text>
    </Pressable>
  );
}

function PlotCell({ plot, index, toolMode, onPress }: { plot: GardenPlot | null; index: number; toolMode: ToolMode; onPress: () => void }) {
  if (!plot) {
    return (
      <Pressable style={styles.plotEmpty} onPress={onPress}>
        <Text style={styles.plotEmptyIcon}>+</Text>
      </Pressable>
    );
  }

  const bloomed = plot.stage >= 2;
  const emoji = GARDEN_STAGES[plot.type][plot.stage];
  const hpColor = healthColor(plot.health);

  return (
    <Pressable style={[styles.plot, bloomed && styles.plotBloomed]} onPress={onPress}>
      <View style={styles.healthBar}>
        <View style={[styles.healthFill, { width: `${plot.health}%`, backgroundColor: hpColor }]} />
      </View>
      <Text style={styles.plotEmoji}>{emoji}</Text>
      {plot.pest ? <Text style={styles.plotPest}>{plot.pest === 'caterpillar' ? '🐛' : '🐜'}</Text> : null}
      {plot.weed ? <Text style={styles.plotWeed}>🌿</Text> : null}
      <View style={styles.dots}>
        {[0, 1, 2].map((s) => (
          <View key={s} style={[styles.dot, s <= plot!.stage && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.plotTag}>{bloomed ? `+${HARVEST_REWARDS[plot.type]}` : plot.type}</Text>
    </Pressable>
  );
}

export default function GardenScreen() {
  const {
    plots, toolMode, selectingPlot, bugCatching,
    setToolMode, tapPlot, waterAll, plantSeed, catchBug, skipBug, cancelPlant,
  } = useGardenStore();
  const points = usePointsStore((s) => s.points);

  const planted = plots.filter((p) => p !== null).length;
  const waterAllCost = GARDEN_COSTS.water * planted;

  const bugPlot = bugCatching !== null ? plots[bugCatching] : null;

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>my garden</Text>
        <View style={styles.ptsChip}>
          <Text style={styles.ptsText}>{points} pts</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        {planted}/{plots.length} plots planted · {toolMode ? `tap a plot to use ${toolMode}` : 'tap a sprout to grow, a bloom to harvest'}
      </Text>

      <View style={styles.legend}>
        <Text style={styles.legendItem}>{GARDEN_STAGES.health[0]}→{GARDEN_STAGES.health[1]}→{GARDEN_STAGES.health[2]} health</Text>
        <Text style={styles.legendItem}>{GARDEN_STAGES.mind[0]}→{GARDEN_STAGES.mind[1]}→{GARDEN_STAGES.mind[2]} mind</Text>
        <Text style={styles.legendItem}>{GARDEN_STAGES.social[0]}→{GARDEN_STAGES.social[1]}→{GARDEN_STAGES.social[2]} social</Text>
      </View>

      <View style={styles.toolbar}>
        <ToolBtn icon="💧" label="water" cost={GARDEN_COSTS.water} mode="water" active={toolMode === 'water'} onPress={() => setToolMode('water')} />
        <ToolBtn icon="🧪" label="fertilize" cost={GARDEN_COSTS.fertilize} mode="fertilize" active={toolMode === 'fertilize'} onPress={() => setToolMode('fertilize')} />
        <ToolBtn icon="🌿" label="weed" cost={GARDEN_COSTS.weed} mode="weed" active={toolMode === 'weed'} onPress={() => setToolMode('weed')} />
        <ToolBtn icon="🐛" label="catch" cost={GARDEN_COSTS.catch} mode="catch" active={toolMode === 'catch'} onPress={() => setToolMode('catch')} />
      </View>

      <Pressable style={styles.waterAllBtn} onPress={waterAll}>
        <Text style={styles.waterAllText}>water all ({waterAllCost} pts)</Text>
      </Pressable>

      {bugCatching !== null && bugPlot && bugPlot.pest ? (
        <View style={styles.bugOverlay}>
          <Text style={styles.bugMsg}>a {bugPlot.pest} is eating your {bugPlot.type}!</Text>
          <Text style={styles.bugHint}>tap to catch it for +10 health</Text>
          <View style={styles.bugActions}>
            <Pressable style={styles.bugCatchBtn} onPress={catchBug}>
              <Text style={styles.bugCatchText}>catch it!</Text>
            </Pressable>
            <Pressable style={styles.bugIgnoreBtn} onPress={skipBug}>
              <Text style={styles.bugIgnoreText}>ignore</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {selectingPlot !== null ? (
        <View style={styles.seedPicker}>
          <Text style={styles.seedTitle}>plant a seed</Text>
          {CATEGORIES.map((cat) => {
            const price = SEED_PRICES[cat.id];
            const canAfford = points >= price;
            return (
              <View key={cat.id} style={styles.seedRow}>
                <Text style={styles.seedEmoji}>{GARDEN_STAGES[cat.id][0]}</Text>
                <View style={styles.seedInfo}>
                  <Text style={styles.seedName}>{cat.label} seed</Text>
                  <Text style={styles.seedPrice}>● {price} pts · harvests for {HARVEST_REWARDS[cat.id]} pts</Text>
                </View>
                <Pressable
                  style={[styles.seedPlantBtn, !canAfford && styles.seedPlantBtnLocked]}
                  disabled={!canAfford}
                  onPress={() => plantSeed(cat.id)}
                >
                  <Text style={[styles.seedPlantText, !canAfford && styles.seedPlantTextLocked]}>plant</Text>
                </Pressable>
              </View>
            );
          })}
          <Pressable style={styles.seedCancelBtn} onPress={cancelPlant}>
            <Text style={styles.seedCancelText}>cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.grid}>
        {plots.map((plot, i) => (
          <PlotCell key={i} plot={plot} index={i} toolMode={toolMode} onPress={() => tapPlot(i)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  ptsChip: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.forestBg,
  },
  ptsText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.forest },

  hint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginBottom: 10 },

  legend: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  legendItem: { fontFamily: fonts.mono, fontSize: 8.5, color: colors.inkSoft },

  toolbar: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tool: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  toolActive: { backgroundColor: colors.forestBg, borderColor: colors.forest },
  toolIcon: { fontSize: 14 },
  toolLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ink, marginTop: 2 },
  toolLabelActive: { color: colors.forest },
  toolCost: { fontFamily: fonts.mono, fontSize: 7, color: colors.inkSoft, opacity: 0.7, marginTop: 1 },

  waterAllBtn: {
    borderWidth: 1,
    borderColor: colors.forest,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    marginBottom: 12,
  },
  waterAllText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.forest },

  bugOverlay: {
    backgroundColor: 'rgba(91,122,63,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.forest,
    borderStyle: 'dashed',
  },
  bugMsg: { fontFamily: fonts.monoBold, fontSize: 13, color: colors.ink, textAlign: 'center', marginBottom: 4 },
  bugHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', marginBottom: 10 },
  bugActions: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  bugCatchBtn: { backgroundColor: colors.stamp, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  bugCatchText: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.white },
  bugIgnoreBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  bugIgnoreText: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft },

  seedPicker: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  seedTitle: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink, marginBottom: 10 },
  seedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  seedEmoji: { fontSize: 22 },
  seedInfo: { flex: 1 },
  seedName: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },
  seedPrice: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft, marginTop: 2 },
  seedPlantBtn: { backgroundColor: colors.stamp, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  seedPlantBtnLocked: { opacity: 0.35 },
  seedPlantText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.white },
  seedPlantTextLocked: { color: colors.white },
  seedCancelBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 6 },
  seedCancelText: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  plot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plotBloomed: { borderColor: colors.brass, backgroundColor: colors.brassBg },
  plotEmpty: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotEmptyIcon: { fontSize: 22, color: colors.inkSoft, fontWeight: '300' },

  healthBar: { position: 'absolute', top: 5, left: 5, right: 5, height: 3, backgroundColor: colors.line, borderRadius: 2, overflow: 'hidden' },
  healthFill: { height: '100%', borderRadius: 2 },

  plotEmoji: { fontSize: 28, lineHeight: 32 },
  plotPest: { position: 'absolute', top: 2, right: 2, fontSize: 12 },
  plotWeed: { position: 'absolute', bottom: 14, right: 3, fontSize: 10, opacity: 0.7 },

  dots: { flexDirection: 'row', gap: 3, marginTop: 5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.line },
  dotFilled: { backgroundColor: colors.forest },

  plotTag: { position: 'absolute', bottom: 5, fontFamily: fonts.mono, fontSize: 6.5, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
});
