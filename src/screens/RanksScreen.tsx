import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Pill } from '@/components/Pill';
import { useAppStore, colorToken } from '@/store/useAppStore';

export default function RanksScreen() {
  const [scope, setScope] = useState<'friends' | 'squad'>('friends');
  const leaderboardFriends = useAppStore((s) => s.leaderboardFriends);
  const leaderboardSquad = useAppStore((s) => s.leaderboardSquad);

  const list = scope === 'friends' ? leaderboardFriends : leaderboardSquad;
  const sorted = [...list].sort((a, b) => b.pts - a.pts);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>ranks</Text>

      <View style={styles.chipRow}>
        <Pill label="friends" active={scope === 'friends'} activeBg={colors.stamp} onPress={() => setScope('friends')} />
        <Pill label="squad" active={scope === 'squad'} activeBg={colors.stamp} onPress={() => setScope('squad')} />
      </View>

      {sorted.map((row, i) => (
        <View key={row.name} style={[styles.row, row.isYou && styles.rowMe]}>
          <View style={[styles.rankBadge, i < 3 ? styles.rankGold : styles.rankPlain]}>
            <Text style={[styles.rankText, i < 3 && { color: colors.brass }]}>{i + 1}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colorToken(row.color) }]}>
            <Text style={styles.avatarText}>{row.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{row.isYou ? 'you' : row.name}</Text>
          <Text style={styles.points}>{row.pts}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },

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
  rankText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.inkSoft },
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
