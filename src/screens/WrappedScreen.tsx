import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useAuthStore } from '@/store/useAuthStore';
import { useScrapbook, useUserProfile } from '@/api/hooks/users';
import { useActiveDuo } from '@/api/hooks/duo';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function useMonthRecap() {
  const { data } = useScrapbook(50);
  return useMemo(() => {
    const entries = data?.entries ?? [];
    const now = new Date();
    const thisMonthEntries = entries.filter((e) => {
      const d = new Date(`${e.localDate}T00:00:00`);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const dayCounts = new Array(7).fill(0);
    const taskCounts = new Map<string, number>();
    thisMonthEntries.forEach((e) => {
      const d = new Date(`${e.localDate}T00:00:00`);
      dayCounts[d.getDay()] += 1;
      taskCounts.set(e.taskTitle, (taskCounts.get(e.taskTitle) ?? 0) + 1);
    });

    const busiestDayIdx = dayCounts.reduce((best, count, i) => (count > dayCounts[best] ? i : best), 0);
    const busiestDay = dayCounts[busiestDayIdx] >= 2 ? WEEKDAYS[busiestDayIdx] : null;

    const topTask = [...taskCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .filter((t) => t.count >= 2)
      .sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      month: MONTHS[now.getMonth()],
      tasksDone: thisMonthEntries.length,
      distinctGoals: new Set(thisMonthEntries.map((e) => e.taskTitle)).size,
      busiestDay,
      topTask,
      recentEntries: thisMonthEntries.slice(0, 3),
    };
  }, [data]);
}

export default function WrappedScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const recap = useMonthRecap();
  const { topTask } = recap;
  const { data: duoData } = useActiveDuo();
  const duo = duoData?.duo;
  const partnerId = duo ? (duo.userAId === mongoUser?._id ? duo.userBId : duo.userAId) : null;
  const { data: partnerData } = useUserProfile(partnerId);
  const [reflection, setReflection] = useState('');

  async function shareRecap() {
    const lines = [
      `my ${recap.month} on sprout:`,
      `${recap.tasksDone} tasks done · ${mongoUser?.points ?? 0} points · ${mongoUser?.currentStreak ?? 0} day streak`,
    ];
    if (reflection.trim()) lines.push(`"${reflection.trim()}"`);
    await Share.share({ message: lines.join('\n') });
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={[styles.close, { top: insets.top + 12 }]} onPress={() => navigation?.goBack()}>
        <Text style={styles.closeText}>✕ close</Text>
      </Pressable>
      <Screen scroll contentStyle={{ paddingTop: 14 }} backgroundColor={colors.navy}>
        <View style={styles.idCard}>
          <View style={[styles.idPhoto, { backgroundColor: avatarColorFor(mongoUser?.username ?? '') }]}>
            <Text style={styles.idInitial}>{mongoUser?.displayName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.idName}>{mongoUser?.displayName ?? ''}</Text>
            <View style={styles.idMetaRow}>
              <FlameIcon size={11} color={colors.page} />
              <Text style={styles.idMeta}> day {mongoUser?.currentStreak ?? 0} streak · {mongoUser?.points ?? 0} pts</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sub}>your recap</Text>
        <Text style={styles.title}>your {recap.month}</Text>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Text style={styles.statN}>{recap.tasksDone}</Text>
            <Text style={styles.statL}>TASKS DONE</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statN}>{mongoUser?.points ?? 0}</Text>
            <Text style={styles.statL}>POINTS</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.flameStatRow}>
              <FlameIcon size={16} color={colors.page} />
              <Text style={styles.statN}> {mongoUser?.currentStreak ?? 0}</Text>
            </View>
            <Text style={styles.statL}>CURRENT STREAK</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statN}>{recap.distinctGoals}</Text>
            <Text style={styles.statL}>GOALS WORKED ON</Text>
          </View>
        </View>

        <View style={styles.gardenBed}>
          <Text style={styles.gardenHeading}>your garden this month · {recap.tasksDone} planted</Text>
          {recap.tasksDone === 0 ? (
            <Text style={styles.emptyHintLight}>nothing sprouted yet this month</Text>
          ) : (
            <View style={styles.gardenIcons}>
              {Array.from({ length: Math.min(recap.tasksDone, 60) }).map((_, i) => (
                <Text key={i} style={styles.gardenIcon}>🌱</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.highlights}>
          {recap.busiestDay ? (
            <View style={styles.highlight}>
              <Text style={styles.hiEmoji}>📅</Text>
              <Text style={styles.hiText}>your busiest day was <Text style={styles.hiBold}>{recap.busiestDay}</Text></Text>
            </View>
          ) : null}
          {topTask ? (
            <View style={styles.highlight}>
              <FlameIcon size={14} color={colors.page} />
              <Text style={styles.hiText}>"<Text style={styles.hiBold}>{topTask.name}</Text>" was your steadiest habit — {topTask.count} times this month</Text>
            </View>
          ) : null}
          {duo && partnerData ? (
            <View style={styles.highlight}>
              <Text style={styles.hiEmoji}>👯</Text>
              <Text style={styles.hiText}>
                <Text style={styles.hiBold}>{partnerData.user.displayName}</Text> kept you accountable — {duo.streak} day duo streak on "{duo.taskTitle}"
              </Text>
            </View>
          ) : null}
          {!recap.busiestDay && !recap.topTask && !duo ? (
            <Text style={styles.emptyHintLight}>not enough data yet for highlights — keep stamping</Text>
          ) : null}
        </View>

        {recap.recentEntries.length > 0 && (
          <>
            <Text style={styles.stripLabel}>a few from this month</Text>
            <View style={styles.strip}>
              {recap.recentEntries.map((entry) => (
                <Image key={entry._id} source={{ uri: entry.photoUrl }} style={styles.stripFrame} resizeMode="cover" />
              ))}
            </View>
          </>
        )}

        <View style={styles.reflect}>
          <Text style={styles.reflectPrompt}>what felt good this month?</Text>
          <TextInput
            style={styles.reflectInput}
            placeholder="type here or skip"
            placeholderTextColor="rgba(246,242,231,0.5)"
            value={reflection}
            onChangeText={setReflection}
          />
        </View>

        <Pressable style={styles.shareBtn} onPress={shareRecap}>
          <Text style={styles.shareBtnText}>share your recap card</Text>
        </Pressable>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.navy },
  close: { position: 'absolute', right: 12, zIndex: 5 },
  closeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.page },

  idCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  idPhoto: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  idInitial: { fontFamily: fonts.display, fontSize: 17, color: colors.white },
  idName: { fontFamily: fonts.display, fontSize: 15, color: colors.page },
  idMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  idMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.page, opacity: 0.75 },

  sub: { fontFamily: fonts.mono, fontSize: 9, color: colors.page, opacity: 0.65, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  title: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.page, marginBottom: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  statBox: {
    width: '47%',
    borderWidth: 1.5,
    borderColor: 'rgba(246,242,231,0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  flameStatRow: { flexDirection: 'row', alignItems: 'center' },
  statN: { fontFamily: fonts.display, fontSize: 22, color: colors.page },
  statL: { fontFamily: fonts.mono, fontSize: 8, color: colors.page, opacity: 0.7, letterSpacing: 0.5, marginTop: 2 },

  gardenBed: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 11, marginBottom: 14 },
  gardenHeading: { fontFamily: fonts.mono, fontSize: 9, color: colors.page, opacity: 0.65, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 9 },
  gardenIcons: { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  gardenIcon: { fontSize: 16, lineHeight: 18 },
  emptyHintLight: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.page, opacity: 0.65 },

  highlights: { marginBottom: 14 },
  highlight: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 10 },
  hiEmoji: { fontSize: 16, marginTop: -1 },
  hiText: { flex: 1, fontFamily: fonts.mono, fontSize: 11.5, color: colors.page, lineHeight: 16 },
  hiBold: { fontFamily: fonts.monoBold, color: colors.page },

  stripLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.page, opacity: 0.65, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  strip: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  stripFrame: { width: 48, height: 48, borderRadius: 4, backgroundColor: 'rgba(246,242,231,0.15)' },

  reflect: { borderTopWidth: 1, borderTopColor: 'rgba(246,242,231,0.25)', paddingTop: 10, marginBottom: 12 },
  reflectPrompt: { ...textStyles.caption, color: colors.page, marginBottom: 6 },
  reflectInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(246,242,231,0.4)',
    color: colors.page,
    fontFamily: fonts.mono,
    fontSize: 10,
    paddingVertical: 4,
  },

  shareBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(246,242,231,0.55)',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  shareBtnText: { fontFamily: fonts.mono, fontSize: 11, color: colors.page, letterSpacing: 0.5 },
});
