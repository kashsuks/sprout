import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAppStore, colorToken } from '@/store/useAppStore';

export default function SquadScreen({ navigation }: any) {
  const squad = useAppStore((s) => s.squad);
  const actNudge = useAppStore((s) => s.actNudge);
  const pct = Math.min(100, Math.round((squad.current / squad.target) * 100));

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>squad</Text>

      <View style={styles.runway}>
        <View style={styles.runwayTop}>
          <Text style={styles.runwayLabel}>{squad.label}</Text>
          <Text style={styles.runwayValue}>{squad.current}/{squad.target}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>nudges</Text>
      {squad.nudges.map((n, i) => (
        <View key={i} style={styles.nudgeRow}>
          <View style={[styles.avatar, { backgroundColor: colorToken(n.color) }]}>
            <Text style={styles.avatarText}>{n.name[0].toUpperCase()}</Text>
          </View>
          {n.status === 'pending' ? (
            <>
              <Text style={styles.nudgeText}>{n.name}: "{n.text}"</Text>
              <View style={styles.nudgeActions}>
                <Pressable
                  style={[styles.nudgeBtn, n.acted === 'accept' && styles.nudgeBtnOn]}
                  onPress={() => actNudge(i, 'accept')}
                >
                  <Text style={[styles.nudgeBtnText, n.acted === 'accept' && styles.nudgeBtnTextOn]}>accept</Text>
                </Pressable>
                <Pressable
                  style={[styles.nudgeBtn, n.acted === 'later' && styles.nudgeBtnOn]}
                  onPress={() => actNudge(i, 'later')}
                >
                  <Text style={[styles.nudgeBtnText, n.acted === 'later' && styles.nudgeBtnTextOn]}>later</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.nudgeText}>{n.name} {n.text}</Text>
          )}
        </View>
      ))}

      <Pressable style={styles.manageLinkBtn} onPress={() => navigation?.navigate('LinkDuo')}>
        <Text style={styles.manageLinkText}>manage duo links</Text>
      </Pressable>
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
    marginBottom: 14,
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
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  nudgeText: { flex: 1, fontFamily: fonts.mono, fontSize: 10, color: colors.ink },
  nudgeActions: { flexDirection: 'row', gap: 5, marginLeft: 'auto' },
  nudgeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  nudgeBtnOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  nudgeBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },
  nudgeBtnTextOn: { color: colors.white },

  manageLinkBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  manageLinkText: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },
});
