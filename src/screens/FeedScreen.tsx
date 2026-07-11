import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { Stamp } from '@/components/Stamp';
import { DashedCard } from '@/components/DashedCard';
import { currentUser, feedEntries, duoCard } from '@/data/mockData';

export default function FeedScreen() {
  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Text style={[textStyles.appLogo, { color: colors.ink }]}>still</Text>
        <Stamp label={String(currentUser.streak)} size={32} />
      </View>

      {/* Duo streak card */}
      <DashedCard color={colors.stamp} style={{ marginBottom: 12 }}>
        <Text style={styles.duoTitle}>{duoCard.names}</Text>
        <View style={styles.duoPhotos}>
          {duoCard.photos.map((p, i) => (
            <View key={i} style={[styles.duoPhoto, { backgroundColor: p.bg }]}>
              <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.duoCaption}>{duoCard.caption}</Text>
        <View style={styles.duoMeta}>
          <Text style={styles.duoFlame}>● duo streak: {duoCard.streak}</Text>
          <Text style={textStyles.small}>miss a day, both break</Text>
        </View>
      </DashedCard>

      {/* Feed entries */}
      {feedEntries.map((entry) => (
        <View key={entry.id} style={styles.visaCard}>
          <View style={styles.stampCorner}>
            <Stamp label={entry.stampLabel} size={30} rotation={10} fontSize={9} />
          </View>
          <View style={styles.visaRow}>
            <View style={[styles.visaPhoto, { backgroundColor: entry.photoBg }]}>
              <Text style={{ fontSize: 20 }}>{entry.photoEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.visaName}>{entry.name}</Text>
              <Text style={styles.visaTask}>{entry.task}</Text>
              <Text style={styles.visaCaption}>{entry.caption}</Text>
            </View>
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

  duoTitle: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink, marginBottom: 8 },
  duoPhotos: { flexDirection: 'row', gap: 3, marginBottom: 7 },
  duoPhoto: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duoCaption: { fontFamily: fonts.handwritingRegular, fontSize: 15, color: colors.ink, marginBottom: 6 },
  duoMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  duoFlame: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.stamp, fontWeight: '600' },

  visaCard: {
    position: 'relative',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 9,
    marginBottom: 12,
  },
  stampCorner: { position: 'absolute', top: -8, right: -8, zIndex: 2 },
  visaRow: { flexDirection: 'row', gap: 9 },
  visaPhoto: {
    width: 52,
    height: 52,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaName: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },
  visaTask: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginTop: 1 },
  visaCaption: { fontFamily: fonts.handwritingRegular, fontSize: 16, color: colors.ink, marginTop: 4 },
});
