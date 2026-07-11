import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { squadGoal, nudges } from '@/data/mockData';

export default function SquadScreen() {
  const pct = Math.min(100, Math.round((squadGoal.progress / squadGoal.target) * 100));

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>squad</Text>

      <View style={styles.runway}>
        <View style={styles.runwayTop}>
          <Text style={styles.runwayLabel}>{squadGoal.title}</Text>
          <Text style={styles.runwayValue}>
            {squadGoal.progress}/{squadGoal.target}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>NUDGES</Text>
      {nudges.map((n) => (
        <View key={n.id} style={styles.nudgeRow}>
          <View style={[styles.avatar, { backgroundColor: colors.brass }]}>
            <Text style={styles.avatarText}>{n.initial}</Text>
          </View>
          <Text style={styles.nudgeText}>
            {n.type === 'action' ? `${n.name}: "${n.message}"` : n.message}
          </Text>
          {n.type === 'action' && (
            <View style={styles.nudgeActions}>
              <Pressable style={({ pressed }) => [styles.nudgeBtn, styles.nudgeBtnOn, pressed && styles.pressed]}>
                <Text style={styles.nudgeBtnTextOn}>accept</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.nudgeBtn, pressed && styles.pressed]}>
                <Text style={styles.nudgeBtnText}>later</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  runway: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 11,
    marginBottom: 16,
  },
  runwayTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  runwayLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.ink },
  runwayValue: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },
  track: { height: 5, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: colors.forest, borderRadius: 3 },

  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginBottom: 4 },

  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 12, color: colors.white },
  nudgeText: { flex: 1, fontFamily: fonts.mono, fontSize: 10, color: colors.ink },
  nudgeActions: { flexDirection: 'row', gap: 5 },
  nudgeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  nudgeBtnOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  nudgeBtnText: { fontFamily: fonts.typewriter, fontSize: 9, color: colors.inkSoft },
  nudgeBtnTextOn: { fontFamily: fonts.typewriter, fontSize: 9, color: colors.white },
  pressed: { opacity: 0.6 },
});
