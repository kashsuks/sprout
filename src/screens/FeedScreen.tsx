import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Stamp } from '@/components/Stamp';
import { DashedCard } from '@/components/DashedCard';
import { FlameIcon } from '@/components/FlameIcon';
import { useFeed, useFeedDuo } from '@/api/hooks/feed';
import { useAuthStore } from '@/store/useAuthStore';

function abbrev(name: string) {
  return name.replace(/[^a-zA-Z ]/g, '').split(' ')[0].slice(0, 3).toUpperCase();
}

export default function FeedScreen({ navigation }: any) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const { data: feedData, isLoading: feedLoading } = useFeed();
  const { data: duoData } = useFeedDuo();

  const entries = feedData?.entries ?? [];
  const duo = duoData?.duo;

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>sprout</Text>
        <View style={styles.streakChip}>
          <FlameIcon size={13} color={colors.stamp} />
          <Text style={styles.streakChipText}>{mongoUser?.currentStreak ?? 0}</Text>
        </View>
      </View>

      {duo && (
        <Pressable onPress={() => navigation?.navigate('SquadTab')}>
          <DashedCard color={colors.stamp} style={{ marginBottom: 14 }}>
            <Text style={styles.duoTitle}>
              {duo.names[0] ?? '?'} &amp; {duo.names[1] ?? '?'} · {duo.taskTitle}
            </Text>
            <View style={styles.duoPhotos}>
              {duo.photos.map((photo, i) =>
                photo ? (
                  <Image key={i} source={{ uri: photo }} style={styles.duoPhoto} resizeMode="cover" />
                ) : (
                  <View key={i} style={[styles.duoPhoto, styles.duoPhotoEmpty]} />
                )
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
              <View style={styles.visaHeader}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.visaName}>{name}</Text>
                  <Text style={styles.visaTask}>{entry.taskTitle}</Text>
                </View>
              </View>

              <View style={styles.visaPhoto}>
                <Image source={{ uri: entry.photoUrl }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                <View style={styles.stampCorner}>
                  <Stamp label={abbrev(entry.taskTitle)} size={30} color={colors.stamp} rotation={10} fontSize={9} />
                </View>
              </View>

              {entry.caption ? <Text style={styles.visaCaption}>{entry.caption}</Text> : null}

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

  duoTitle: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.ink, marginBottom: 8 },
  duoPhotos: { flexDirection: 'row', gap: 3, marginBottom: 7 },
  duoPhoto: { flex: 1, aspectRatio: 1, borderRadius: 4 },
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

  visaCaption: { ...textStyles.caption, color: colors.ink },

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
