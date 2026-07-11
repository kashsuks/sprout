import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Stamp } from '@/components/Stamp';
import { DashedCard } from '@/components/DashedCard';
import { FlameIcon } from '@/components/FlameIcon';
import { PhotoTile } from '@/components/PhotoTile';
import { useAppStore, colorToken, colorBgToken } from '@/store/useAppStore';

export default function FeedScreen({ navigation }: any) {
  const streakDays = useAppStore((s) => s.streakDays);
  const feed = useAppStore((s) => s.feed);
  const duo = useAppStore((s) => s.duo);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>sprout</Text>
        <View style={styles.streakChip}>
          <FlameIcon size={13} color={colors.stamp} />
          <Text style={styles.streakChipText}>{streakDays}</Text>
        </View>
      </View>

      {/* Duo streak card */}
      <Pressable onPress={() => navigation?.navigate('SquadTab')}>
        <DashedCard color={colors.stamp} style={{ marginBottom: 14 }}>
          <Text style={styles.duoTitle}>eason &amp; {duo.partner} · {duo.label}</Text>
          <View style={styles.duoPhotos}>
            {duo.icons.map((type, i) => (
              <PhotoTile key={i} type={type as any} style={styles.duoPhoto} />
            ))}
          </View>
          <Text style={styles.duoCaption}>leg day, both showed up :)</Text>
          <View style={styles.duoMeta}>
            <View style={styles.duoFlameRow}>
              <FlameIcon size={12} color={colors.stamp} />
              <Text style={styles.duoFlame}> duo streak: {duo.streak}</Text>
            </View>
            <Text style={textStyles.small}>miss a day, both break</Text>
          </View>
        </DashedCard>
      </Pressable>

      {/* Feed entries */}
      {feed.map((entry) => (
        <View key={entry.id} style={styles.visaCard}>
          <View style={styles.visaHeader}>
            <View style={[styles.avatar, { backgroundColor: colorToken(entry.color) }]}>
              <Text style={styles.avatarText}>{entry.name[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.visaName}>{entry.name}</Text>
              <Text style={styles.visaTask}>{entry.task}</Text>
            </View>
          </View>

          <View style={styles.visaPhoto}>
            {entry.photo ? (
              <Image source={{ uri: entry.photo }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            ) : entry.iconType ? (
              <PhotoTile type={entry.iconType as any} style={StyleSheet.absoluteFillObject as any} />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.emojiFill, { backgroundColor: colorBgToken(entry.color) }]}>
                <Text style={{ fontSize: 34 }}>🌱</Text>
              </View>
            )}
            <View style={styles.stampCorner}>
              <Stamp label={entry.code} size={30} color={colors.stamp} rotation={10} fontSize={9} />
            </View>
          </View>

          <Text style={styles.visaCaption}>{entry.caption}</Text>

          <View style={styles.visaStats}>
            <View style={styles.visaStatsLeft}>
              <FlameIcon size={11} color={colors.stamp} />
              <Text style={styles.visaStatsText}> {entry.streak} day streak · <Text style={styles.today}>+{entry.dayPts} today</Text></Text>
            </View>
            <Text style={styles.total}>{entry.total} pts total</Text>
          </View>
        </View>
      ))}
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
  duoCaption: { ...textStyles.caption, color: colors.ink, marginBottom: 5 },
  duoMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duoFlameRow: { flexDirection: 'row', alignItems: 'center' },
  duoFlame: { fontFamily: fonts.monoBold, fontSize: 9.5, color: colors.stamp },

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
  },
  emojiFill: { alignItems: 'center', justifyContent: 'center' },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  visaStatsLeft: { flexDirection: 'row', alignItems: 'center' },
  visaStatsText: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },
  today: { color: colors.forest, fontFamily: fonts.monoBold },
  total: { fontFamily: fonts.monoBold, fontSize: 9, color: colors.ink },
});
