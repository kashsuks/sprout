import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { DashedRect } from '@/components/DashedBorder';
import { friendsToLink } from '@/data/mockData';

function LinkPill({ linked, onPress }: { linked: boolean; onPress: () => void }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => setSize(e.nativeEvent.layout), []);

  return (
    <Pressable
      style={({ pressed }) => [styles.linkBtn, linked && styles.linkBtnOn, pressed && styles.pressed]}
      onPress={onPress}
      onLayout={onLayout}
      hitSlop={4}
    >
      {!linked && size.width > 0 && (
        <DashedRect width={size.width} height={size.height} radius={12} color={colors.stamp} strokeWidth={1.5} dash={[3, 3]} />
      )}
      <Text style={[styles.linkBtnText, linked && styles.linkBtnTextOn]}>{linked ? 'linked' : 'link'}</Text>
    </Pressable>
  );
}

export default function LinkDuoScreen() {
  const [linked, setLinked] = useState<Record<string, boolean>>(
    Object.fromEntries(friendsToLink.map((f) => [f.id, f.linked]))
  );

  return (
    <Screen contentStyle={{ paddingTop: 4 }}>
      <Text style={[textStyles.appLogo, { color: colors.ink }]}>link duo</Text>
      <Text style={styles.subtitle}>pick a friend to link "gym session" with</Text>

      {friendsToLink.map((f) => (
        <View key={f.id} style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.brass }]}>
            <Text style={styles.avatarText}>{f.initial}</Text>
          </View>
          <Text style={styles.name}>{f.name}</Text>
          <LinkPill
            linked={linked[f.id]}
            onPress={() => setLinked((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: fonts.handwritingRegular,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 11,
    marginBottom: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 13, color: colors.white },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },

  linkBtn: {
    position: 'relative',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  linkBtnOn: { backgroundColor: colors.stamp },
  linkBtnText: { fontFamily: fonts.typewriter, fontSize: 9, color: colors.stamp },
  linkBtnTextOn: { color: colors.card },
  pressed: { opacity: 0.6 },
});
