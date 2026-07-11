import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useGoals } from '@/api/hooks/goals';
import { useLinkableFriends, useLinkDuo } from '@/api/hooks/duo';

export default function LinkDuoScreen() {
  const { data: goalsData, isLoading: goalsLoading } = useGoals();
  const goals = goalsData?.goals ?? [];
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = goals.find((g) => g._id === selectedGoalId) ?? null;

  const { data: friendsData, isLoading: friendsLoading } = useLinkableFriends(selectedGoal?.title ?? '');
  const linkDuo = useLinkDuo();
  const friends = friendsData?.friends ?? [];

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink }]}>link duo</Text>
      <Text style={styles.subtitle}>pick one of your tasks, then a friend to link it with</Text>

      <Text style={styles.sectionLabel}>your tasks</Text>
      {goalsLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginBottom: 12 }} />
      ) : goals.length === 0 ? (
        <Text style={styles.emptyHint}>add a task first, then come back to link it</Text>
      ) : (
        <View style={styles.chipRow}>
          {goals.map((g) => (
            <Pressable
              key={g._id}
              style={[styles.chip, selectedGoalId === g._id && styles.chipOn]}
              onPress={() => setSelectedGoalId(g._id)}
            >
              <Text style={[styles.chipText, selectedGoalId === g._id && styles.chipTextOn]}>{g.title}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selectedGoal && (
        <>
          <Text style={styles.sectionLabel}>friends</Text>
          {friendsLoading ? (
            <ActivityIndicator color={colors.stamp} />
          ) : friends.length === 0 ? (
            <Text style={styles.emptyHint}>no friends to link yet</Text>
          ) : (
            friends.map((f) => (
              <View key={f._id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: avatarColorFor(f.username) }]}>
                  <Text style={styles.avatarText}>{f.displayName[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{f.displayName}</Text>
                <Pressable
                  style={[styles.linkBtn, f.linked && styles.linkBtnOn]}
                  disabled={f.linked || linkDuo.isPending}
                  onPress={() =>
                    linkDuo.mutate({ friendUserId: f._id, taskTitle: selectedGoal.title, myGoalId: selectedGoal._id })
                  }
                >
                  <Text style={[styles.linkBtnText, f.linked && styles.linkBtnTextOn]}>
                    {f.linked ? 'linked' : 'link'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...textStyles.caption, color: colors.ink, marginTop: 4, marginBottom: 14 },
  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginTop: 10, marginBottom: 8 },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, paddingVertical: 8 },

  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.stamp, borderColor: colors.stamp },
  chipText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink },
  chipTextOn: { color: colors.card },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 9,
    marginBottom: 9,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },

  linkBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderStyle: 'dashed',
  },
  linkBtnOn: { backgroundColor: colors.stamp, borderStyle: 'solid' },
  linkBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.stamp },
  linkBtnTextOn: { color: colors.card },
});
