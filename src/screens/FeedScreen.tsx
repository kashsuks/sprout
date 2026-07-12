import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Stamp } from '@/components/Stamp';
import { DashedCard } from '@/components/DashedCard';
import { FlameIcon } from '@/components/FlameIcon';
import { useFeed, useFeedDuo, useToggleLike } from '@/api/hooks/feed';
import { useAuthStore } from '@/store/useAuthStore';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { HeartIcon } from '@/components/HeartIcon';

const POLL_INTERVAL_MS = 20000;

function abbrev(name: string) {
  return name.replace(/[^a-zA-Z ]/g, '').split(' ')[0].slice(0, 3).toUpperCase();
}

export default function FeedScreen({ navigation }: any) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const isFocused = useIsFocused();
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useFeed({
    refetchInterval: isFocused ? POLL_INTERVAL_MS : false,
  });
  const { data: duoData, refetch: refetchDuo } = useFeedDuo();
  const toggleLike = useToggleLike();

  const allEntries = feedData?.entries ?? [];
  const duo = duoData?.duo;

  // Newly-polled entries don't appear in the list immediately — they're held
  // back behind a "new posts" banner (like Google Classroom) until the user
  // taps it or pulls to refresh, so the feed doesn't shift under them.
  const [shownIds, setShownIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (shownIds === null && feedData) setShownIds(allEntries.map((e) => e._id));
  }, [feedData]);

  const entries = shownIds ? allEntries.filter((e) => shownIds.includes(e._id)) : allEntries;
  const newCount = shownIds ? allEntries.filter((e) => !shownIds.includes(e._id)).length : 0;

  function revealNewEntries() {
    setShownIds(allEntries.map((e) => e._id));
  }

  useRefetchOnFocus(refetchFeed);
  useRefetchOnFocus(refetchDuo);

  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    const [feedResult] = await Promise.all([refetchFeed(), refetchDuo()]);
    if (feedResult.data) setShownIds(feedResult.data.entries.map((e) => e._id));
    setRefreshing(false);
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>sprout</Text>
        <View style={styles.streakChip}>
          <FlameIcon size={13} color={colors.stamp} />
          <Text style={styles.streakChipText}>{mongoUser?.currentStreak ?? 0}</Text>
        </View>
      </View>

      {newCount > 0 && (
        <Pressable style={styles.newPostsBanner} onPress={revealNewEntries}>
          <Text style={styles.newPostsBannerText}>
            {newCount} new {newCount === 1 ? 'post' : 'posts'} — tap to view
          </Text>
        </Pressable>
      )}

      {duo && (
        <Pressable onPress={() => navigation?.navigate('SquadTab')}>
          <DashedCard color={colors.stamp} style={{ marginBottom: 14 }}>
            <Text style={styles.duoTitle}>
              {duo.names[0] ?? '?'} &amp; {duo.names[1] ?? '?'} · {duo.taskTitle}
            </Text>
            <View style={styles.duoPhotos}>
              {duo.photos[0] ? (
                <Image source={{ uri: duo.photos[0] }} style={[styles.duoPhoto, styles.duoPhotoA]} resizeMode="cover" />
              ) : (
                <View style={[styles.duoPhoto, styles.duoPhotoA, styles.duoPhotoEmpty]} />
              )}
              {duo.photos[1] ? (
                <Image source={{ uri: duo.photos[1] }} style={[styles.duoPhoto, styles.duoPhotoB]} resizeMode="cover" />
              ) : (
                <View style={[styles.duoPhoto, styles.duoPhotoB, styles.duoPhotoEmpty]} />
              )}
            </View>
            {duo.caption ? <Text style={styles.duoCaption}>{duo.caption}</Text> : null}
            <View style={styles.duoMeta}>
              <View style={styles.duoFlameRow}>
                <FlameIcon size={12} color={colors.stamp} />
                <Text style={styles.duoFlame}> duo streak: {duo.streak}</Text>
              </View>
              <Text style={textStyles.small}>miss a day, both break</Text>
            </View>
          </DashedCard>
        </Pressable>
      )}

      {feedLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
      ) : entries.length === 0 ? (
        <Text style={styles.emptyHint}>no entries from friends yet — add friends and start sprouting</Text>
      ) : (
        entries.map((entry) => {
          const name = entry.author?.displayName ?? entry.author?.username ?? 'someone';
          const avatarColor = avatarColorFor(entry.author?.username ?? entry._id);
          return (
            <View key={entry._id} style={styles.visaCard}>
              <Pressable
                style={styles.visaHeader}
                disabled={!entry.author}
                onPress={() => navigation?.navigate('UserProfile', { userId: entry.author!._id })}
              >
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.visaName}>{name}</Text>
                  <Text style={styles.visaTask}>{entry.taskTitle}</Text>
                </View>
              </Pressable>

              <View style={styles.visaPhoto}>
                <Image source={{ uri: entry.photoUrl }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                <View style={styles.stampCorner}>
                  <Stamp label={abbrev(entry.taskTitle)} size={30} color={colors.stamp} rotation={10} fontSize={9} />
                </View>
              </View>

              {entry.caption ? <Text style={styles.visaCaption}>{entry.caption}</Text> : null}

              <Pressable
                style={styles.likeRow}
                hitSlop={8}
                onPress={() => toggleLike.mutate({ entryId: entry._id, like: !entry.likedByMe })}
              >
                <HeartIcon size={19} filled={entry.likedByMe} />
                <Text style={[styles.likeCount, entry.likedByMe && { color: colors.stamp }]}>
                  {entry.likeCount}
                </Text>
              </Pressable>

              <View style={styles.visaStats}>
                <Text style={styles.visaStatsText}>+{entry.pointsAwarded} points</Text>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 30,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.stamp,
    backgroundColor: colors.stampBg,
  },
  streakChipText: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.stamp },

  newPostsBanner: {
    alignSelf: 'center',
    backgroundColor: colors.stamp,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  newPostsBannerText: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.white },

  duoTitle: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.ink, marginBottom: 8 },
  duoPhotos: { height: 100, marginBottom: 14 },
  duoPhoto: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  duoPhotoA: { left: 6, top: 6, transform: [{ rotate: '-7deg' }], zIndex: 1 },
  duoPhotoB: { left: 66, top: 0, transform: [{ rotate: '5deg' }], zIndex: 2 },
  duoPhotoEmpty: { backgroundColor: colors.forestBg },
  duoCaption: { ...textStyles.caption, color: colors.ink, marginBottom: 5 },
  duoMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duoFlameRow: { flexDirection: 'row', alignItems: 'center' },
  duoFlame: { fontFamily: fonts.monoBold, fontSize: 9.5, color: colors.stamp },

  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },

  visaCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  visaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  visaName: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },
  visaTask: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginTop: 1 },

  visaPhoto: {
    width: '100%',
    aspectRatio: 5 / 4,
    borderRadius: 6,
    marginBottom: 9,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.forestBg,
  },
  stampCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244,236,216,0.92)',
  },

  visaCaption: { ...textStyles.caption, color: colors.ink, marginBottom: 6 },

  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  likeCount: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkSoft },

  visaStats: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  visaStatsText: { fontFamily: fonts.monoBold, fontSize: 9, color: colors.forest },
});