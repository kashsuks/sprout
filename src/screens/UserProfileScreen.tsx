import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useUserProfile } from '@/api/hooks/users';
import { useUserPins } from '@/api/hooks/pins';

export default function UserProfileScreen({ route, navigation }: any) {
  const userId = route?.params?.userId as string | undefined;
  const { data, isLoading } = useUserProfile(userId ?? null);
  const { data: pinsData } = useUserPins(userId ?? null);

  const user = data?.user;
  const limited = data?.limited ?? false;
  const pins = pinsData?.pins ?? [];

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Pressable onPress={() => navigation?.goBack()}>
        <Text style={styles.back}>← back</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator color={colors.stamp} style={{ marginTop: 24 }} />
      ) : !user ? (
        <Text style={styles.emptyHint}>couldn't find this profile</Text>
      ) : (
        <>
          <View style={styles.idCard}>
            <View style={[styles.idPhoto, { backgroundColor: avatarColorFor(user.username) }]}>
              <Text style={styles.idInitial}>{user.displayName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.idName}>{user.displayName}</Text>
              <Text style={styles.idUsername}>@{user.username}</Text>
              {!limited && user.currentStreak !== undefined && (
                <View style={styles.idMetaRow}>
                  <FlameIcon size={11} color={colors.stamp} />
                  <Text style={styles.idMeta}> day {user.currentStreak} streak · {user.points ?? 0} pts</Text>
                </View>
              )}
            </View>
          </View>

          {!limited && user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {limited ? (
            <Text style={styles.emptyHint}>this profile is friends-only</Text>
          ) : (
            <>
              <Text style={styles.sectionLabel}>collected pins</Text>
              {pins.length === 0 ? (
                <Text style={styles.emptyHint}>no pins earned yet</Text>
              ) : (
                <View style={styles.pins}>
                  {pins.map((pin) => (
                    <View key={pin.key} style={styles.pin}>
                      <Text style={{ fontSize: 13 }}>{pin.emoji}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft, marginBottom: 12 },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginTop: 8 },

  idCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  idPhoto: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  idInitial: { fontFamily: fonts.display, fontSize: 20, color: colors.white },
  idName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  idUsername: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginTop: 1 },
  idMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  idMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },

  bio: { ...textStyles.caption, color: colors.ink, marginBottom: 18 },

  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginTop: 6, marginBottom: 8 },
  pins: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
