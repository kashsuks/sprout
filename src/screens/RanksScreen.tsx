import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useLeaderboard, type LeaderboardRow } from '@/api/hooks/leaderboard';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

type RankTab = 'lifetime' | 'today' | 'streak';

const TAB_CONFIG: Record<RankTab, { label: string; sortKey: keyof LeaderboardRow; color: string }> = {
  lifetime: { label: 'lifetime', sortKey: 'points', color: colors.ink },
  today: { label: 'today', sortKey: 'todayPoints', color: colors.navy },
  streak: { label: 'streak', sortKey: 'currentStreak', color: colors.brass },
};

function formatValue(tab: RankTab, row: LeaderboardRow): string {
  if (tab === 'lifetime') return row.points.toLocaleString();
  if (tab === 'today') return `+${row.todayPoints}`;
  return String(row.currentStreak);
}

export default function RanksScreen() {
  const { data, isLoading, refetch } = useLeaderboard();
  const rows = data?.leaderboard ?? [];
  const [tab, setTab] = useState<RankTab>('lifetime');

  useRefetchOnFocus(refetch);
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const { sortKey, color } = TAB_CONFIG[tab];
  const sorted = [...rows].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>ranks</Text>

      <View style={styles.toggle}>
        {(Object.keys(TAB_CONFIG) as RankTab[]).map((t) => (
          <Pressable key={t} style={[styles.toggleBtn, tab === t && styles.toggleBtnOn]} onPress={() => setTab(t)}>
            <Text style={[styles.toggleBtnText, tab === t && styles.toggleBtnTextOn]}>{TAB_CONFIG[t].label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
      ) : sorted.length === 0 ? (
        <Text style={styles.emptyHint}>no ranked friends yet — add friends to see the leaderboard</Text>
      ) : (
        sorted.map((row, i) => (
          <View key={row._id} style={[styles.row, row.me && styles.rowMe]}>
            <View style={[styles.rankBadge, i < 3 ? styles.rankGold : styles.rankPlain]}>
              <Text style={[styles.rankText, i < 3 && { color: colors.brass }]}>{i + 1}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: avatarColorFor(row.username) }]}>
              <Text style={styles.avatarText}>{row.displayName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{row.me ? 'you' : row.displayName}</Text>
            <View style={styles.valueRow}>
              {tab === 'streak' && <FlameIcon size={13} color={color} />}
              <Text style={[styles.points, { color }]}>{formatValue(tab, row)}</Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.line,
    borderRadius: 8,
    padding: 2,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnOn: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleBtnText: { fontFamily: fonts.mono, fontSize: 9.5, lineHeight: 12, color: colors.inkSoft },
  toggleBtnTextOn: { color: colors.ink, fontFamily: fonts.monoBold },

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
  rankText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 13, color: colors.inkSoft, textAlign: 'center' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 11, lineHeight: 14, color: colors.white, textAlign: 'center' },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 14, color: colors.ink },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 40, justifyContent: 'flex-end' },
  points: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'right',
  },
});
