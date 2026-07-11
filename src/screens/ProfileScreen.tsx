import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { PhotoTile } from '@/components/PhotoTile';
import { FlameIcon } from '@/components/FlameIcon';
import { useAppStore } from '@/store/useAppStore';

const SCRAPBOOK: Array<'run' | 'gym' | 'read' | 'books'> = ['run', 'gym', 'read', 'books'];

export default function ProfileScreen({ navigation }: any) {
  const streakDays = useAppStore((s) => s.streakDays);
  const points = useAppStore((s) => s.points);
  const pins = useAppStore((s) => s.pins);
  const privacy = useAppStore((s) => s.privacy);
  const togglePrivacy = useAppStore((s) => s.togglePrivacy);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>profile</Text>

      <View style={styles.idCard}>
        <View style={styles.idPhoto}>
          <Text style={styles.idInitial}>E</Text>
        </View>
        <View>
          <Text style={styles.idName}>eason</Text>
          <View style={styles.idMetaRow}>
            <FlameIcon size={11} color={colors.stamp} />
            <Text style={styles.idMeta}> day {streakDays} streak · {points} pts</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>collected pins</Text>
      <View style={styles.pins}>
        {pins.map((pin, i) => (
          <View key={i} style={styles.pin}>
            <Text style={{ fontSize: 13 }}>{pin}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.privacyRow} onPress={togglePrivacy}>
        <Text style={styles.privacyLabel}>friends-only visibility</Text>
        <Switch
          value={privacy}
          onValueChange={togglePrivacy}
          trackColor={{ false: colors.line, true: colors.forest }}
          thumbColor={colors.white}
        />
      </Pressable>

      <Text style={styles.sectionLabel}>scrapbook</Text>
      <View style={styles.filmstrip}>
        {SCRAPBOOK.map((type) => (
          <PhotoTile key={type} type={type} style={styles.frame} />
        ))}
      </View>

      <Pressable style={styles.recapBtn} onPress={() => navigation?.navigate('Wrapped')}>
        <Text style={styles.recapBtnText}>view june recap →</Text>
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

  pins: { flexDirection: 'row', gap: 6, marginBottom: 18 },
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

  filmstrip: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  frame: { width: 60, height: 60, borderRadius: 4 },

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
