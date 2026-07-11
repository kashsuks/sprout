import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { leaderboard } from '@/data/mockData';

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<'friends' | 'squad'>('friends');

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 4 }]}>ranks</Text>

      <View style={styles.chipRow}>
        {(['friends', 'squad'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setScope(s)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.chip,
              scope === s && styles.chipOn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, scope === s && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {leaderboard.map((row) => (
        <View key={row.rank} style={[styles.row, row.me && styles.rowMe]}>
          <View style={[styles.rankBadge, row.gold ? styles.rankGold : styles.rankPlain]}>
            <Text style={[styles.rankText, row.gold && { color: colors.brass }]}>{row.rank}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: row.color }]}>
            <Text style={styles.avatarText}>{row.initial}</Text>
          </View>
          <Text style={styles.name}>{row.name}</Text>
          <Text style={styles.points}>{row.points}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.stamp, borderColor: colors.stamp },
  chipText: { fontFamily: fonts.typewriter, fontSize: 10, color: colors.inkSoft },
  chipTextOn: { color: colors.card },
  pressed: { opacity: 0.6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowMe: {
    backgroundColor: colors.stampBg,
    borderRadius: 6,
    paddingLeft: 6,
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: { backgroundColor: colors.brassBg },
  rankPlain: { backgroundColor: colors.page, borderWidth: 1, borderColor: colors.line },
  rankText: { fontFamily: fonts.mono, fontSize: 10, fontWeight: '600', color: colors.inkSoft },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },
  points: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.forest },
});
