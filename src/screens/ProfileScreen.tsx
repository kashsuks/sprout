import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { profile } from '@/data/mockData';

export default function ProfileScreen() {
  const [friendsOnly, setFriendsOnly] = useState(true);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>profile</Text>

      <View style={styles.idCard}>
        <View style={styles.idPhoto}>
          <Text style={styles.idInitial}>{profile.name[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.idName}>{profile.name}</Text>
          <Text style={styles.idMeta}>
            day {profile.streak} streak · {profile.points} pts
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>COLLECTED PINS</Text>
      <View style={styles.pins}>
        {profile.pins.map((pin, i) => (
          <View key={i} style={styles.pin}>
            <Text style={{ fontSize: 13 }}>{pin}</Text>
          </View>
        ))}
      </View>

      <View style={styles.privacyRow}>
        <Text style={styles.privacyLabel}>friends-only visibility</Text>
        <Switch
          value={friendsOnly}
          onValueChange={setFriendsOnly}
          trackColor={{ false: colors.line, true: colors.forest }}
          thumbColor={colors.white}
        />
      </View>

      <Text style={styles.sectionLabel}>SCRAPBOOK</Text>
      <View style={styles.scrapbook}>
        {profile.scrapbook.map((bg, i) => (
          <View key={i} style={[styles.frame, { backgroundColor: bg }]} />
        ))}
      </View>
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
  idMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginTop: 2 },

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

  scrapbook: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  frame: { width: 60, height: 60, borderRadius: 4 },
});
