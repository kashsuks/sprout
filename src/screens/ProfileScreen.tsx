import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Image, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useAuthStore } from '@/store/useAuthStore';
import { useScrapbook, useUpdatePrivacy } from '@/api/hooks/users';
import { usePins } from '@/api/hooks/pins';

export default function ProfileScreen({ navigation }: any) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const updatePrivacy = useUpdatePrivacy();
  const { data: pinsData } = usePins();
  const { data: scrapbookData, isLoading: scrapbookLoading } = useScrapbook();

  const earnedPins = (pinsData?.pins ?? []).filter((p) => p.earned);
  const scrapbook = scrapbookData?.entries ?? [];

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>profile</Text>

      <View style={styles.idCard}>
        <View style={styles.idPhoto}>
          <Text style={styles.idInitial}>{mongoUser?.displayName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.idName}>{mongoUser?.displayName ?? ''}</Text>
          <View style={styles.idMetaRow}>
            <FlameIcon size={11} color={colors.stamp} />
            <Text style={styles.idMeta}> day {mongoUser?.currentStreak ?? 0} streak · {mongoUser?.points ?? 0} pts</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>collected pins</Text>
      {earnedPins.length === 0 ? (
        <Text style={styles.emptyHint}>no pins earned yet</Text>
      ) : (
        <View style={styles.pins}>
          {earnedPins.map((pin) => (
            <View key={pin.key} style={styles.pin}>
              <Text style={{ fontSize: 13 }}>{pin.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.privacyRow}
        onPress={() => updatePrivacy.mutate(!mongoUser?.friendsOnlyProfile)}
      >
        <Text style={styles.privacyLabel}>friends-only visibility</Text>
        <Switch
          value={mongoUser?.friendsOnlyProfile ?? true}
          onValueChange={(v) => updatePrivacy.mutate(v)}
          trackColor={{ false: colors.line, true: colors.forest }}
          thumbColor={colors.white}
        />
      </Pressable>

      <Text style={styles.sectionLabel}>scrapbook</Text>
      {scrapbookLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginBottom: 18 }} />
      ) : scrapbook.length === 0 ? (
        <Text style={styles.emptyHint}>nothing stamped yet</Text>
      ) : (
        <View style={styles.filmstrip}>
          {scrapbook.map((entry) => (
            <Image key={entry._id} source={{ uri: entry.photoUrl }} style={styles.frame} resizeMode="cover" />
          ))}
        </View>
      )}

      <Pressable style={styles.recapBtn} onPress={() => navigation?.navigate('Wrapped')}>
        <Text style={styles.recapBtnText}>view recap →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  idPhoto: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.brassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idInitial: { fontFamily: fonts.display, fontSize: 20, color: colors.brass },
  idName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  idMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  idMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },

  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginBottom: 8 },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginBottom: 18 },

  pins: { flexDirection: 'row', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 18,
  },
  privacyLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink },

  filmstrip: { flexDirection: 'row', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  frame: { width: 60, height: 60, borderRadius: 4, backgroundColor: colors.forestBg },

  recapBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: colors.navyBg,
    alignItems: 'center',
  },
  recapBtnText: { fontFamily: fonts.mono, fontSize: 11, color: colors.navy, letterSpacing: 0.5 },
});
