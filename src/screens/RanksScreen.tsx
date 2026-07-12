import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useLeaderboard } from '@/api/hooks/leaderboard';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

export default function RanksScreen() {
  const { data, isLoading, refetch } = useLeaderboard();
  const rows = data?.leaderboard ?? [];

  useRefetchOnFocus(refetch);
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>ranks</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
      ) : rows.length === 0 ? (
        <Text style={styles.emptyHint}>no ranked friends yet — add friends to see the leaderboard</Text>
      ) : (
        rows.map((row) => (
          <View key={row._id} style={[styles.row, row.me && styles.rowMe]}>
            <View style={[styles.rankBadge, row.rank <= 3 ? styles.rankGold : styles.rankPlain]}>
              <Text style={[styles.rankText, row.rank <= 3 && { color: colors.brass }]}>{row.rank}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: avatarColorFor(row.username) }]}>
              <Text style={styles.avatarText}>{row.displayName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{row.me ? 'you' : row.displayName}</Text>
            <Text style={styles.points}>{row.points.toLocaleString()}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },

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
  points: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.forest,
    minWidth: 40,
    textAlign: 'right',
  },
});
