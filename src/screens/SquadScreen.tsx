import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useActiveDuo, useUnlinkDuo } from '@/api/hooks/duo';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

export default function SquadScreen({ navigation }: any) {
  const { data, isLoading, refetch } = useActiveDuo();
  const unlinkDuo = useUnlinkDuo();
  const duo = data?.duo;

  useRefetchOnFocus(refetch);
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>squad</Text>
        <Pressable style={styles.addFriendsBtn} onPress={() => navigation?.navigate('AddFriends')}>
          <Text style={styles.addFriendsBtnText}>+ add friends</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>your duo</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginVertical: 12 }} />
      ) : duo ? (
        <View style={styles.duoCard}>
          <View style={styles.duoTop}>
            <FlameIcon size={13} color={colors.stamp} />
            <Text style={styles.duoTask}>{duo.taskTitle}</Text>
          </View>
          <Text style={styles.duoStreak}>{duo.streak} day streak · miss a day, both break</Text>
          <Pressable style={styles.unlinkBtn} onPress={() => unlinkDuo.mutate(duo._id)}>
            <Text style={styles.unlinkBtnText}>unlink</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.emptyHint}>no active duo — link a task with a friend below</Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>squad goals</Text>
      <Text style={styles.emptyHint}>multi-person squad goals aren't available yet</Text>

      <Pressable style={styles.manageLinkBtn} onPress={() => navigation?.navigate('LinkDuo')}>
        <Text style={styles.manageLinkText}>manage duo links</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addFriendsBtn: {
    borderWidth: 1,
    borderColor: colors.stamp,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  addFriendsBtnText: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.stamp },

  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginBottom: 8 },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 14 },

  duoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 11,
    marginBottom: 14,
  },
  duoTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  duoTask: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },
  duoStreak: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginBottom: 8 },
  unlinkBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  unlinkBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },

  divider: { height: 1, backgroundColor: colors.line, borderStyle: 'dashed', marginVertical: 16 },

  manageLinkBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 14,
    alignItems: 'center',
  },
  manageLinkText: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },
});
