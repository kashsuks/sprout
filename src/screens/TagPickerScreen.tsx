import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAppStore, colorToken } from '@/store/useAppStore';

export default function TagPickerScreen({ navigation }: any) {
  const friends = useAppStore((s) => s.friends);
  const composeFriend = useAppStore((s) => s.composeFriend);
  const setComposeFriend = useAppStore((s) => s.setComposeFriend);

  function select(name: string) {
    setComposeFriend(name);
    navigation?.goBack();
  }

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Pressable onPress={() => navigation?.goBack()}>
        <Text style={styles.back}>← back</Text>
      </Pressable>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginVertical: 8 }]}>tag a friend</Text>
      <Text style={styles.subtitle}>this becomes a duo task — both of you need a photo to count it</Text>

      {friends.map((f) => {
        const selected = composeFriend === f.name;
        return (
          <View key={f.name} style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colorToken(f.color) }]}>
              <Text style={styles.avatarText}>{f.name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{f.name}</Text>
            <Pressable
              style={[styles.selectBtn, selected && styles.selectBtnOn]}
              onPress={() => select(f.name)}
            >
              <Text style={[styles.selectBtnText, selected && styles.selectBtnTextOn]}>
                {selected ? 'selected' : 'select'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft },
  subtitle: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginBottom: 12 },

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

  selectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderStyle: 'dashed',
  },
  selectBtnOn: { backgroundColor: colors.stamp, borderStyle: 'solid' },
  selectBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.stamp },
  selectBtnTextOn: { color: colors.card },
});
