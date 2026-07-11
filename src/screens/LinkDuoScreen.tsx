import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAppStore, colorToken } from '@/store/useAppStore';

export default function LinkDuoScreen() {
  const friends = useAppStore((s) => s.friends);
  const toggleFriendLink = useAppStore((s) => s.toggleFriendLink);

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink }]}>link duo</Text>
      <Text style={styles.subtitle}>pick a friend to link "gym session" with</Text>

      {friends.map((f, i) => (
        <View key={f.name} style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colorToken(f.color) }]}>
            <Text style={styles.avatarText}>{f.name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{f.name}</Text>
          <Pressable
            style={[styles.linkBtn, f.linked && styles.linkBtnOn]}
            onPress={() => toggleFriendLink(i)}
          >
            <Text style={[styles.linkBtnText, f.linked && styles.linkBtnTextOn]}>
              {f.linked ? 'linked' : 'link'}
            </Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...textStyles.caption, color: colors.ink, marginTop: 4, marginBottom: 14 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 9,
    marginBottom: 9,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },

  linkBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderStyle: 'dashed',
  },
  linkBtnOn: { backgroundColor: colors.stamp, borderStyle: 'solid' },
  linkBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.stamp },
  linkBtnTextOn: { color: colors.card },
});
