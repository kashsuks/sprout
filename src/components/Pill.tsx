import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type PillProps = {
  label: string;
  active?: boolean;
  activeBg?: string;
  activeTextColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Small rounded chip/pill used for category selectors, filters, and toggles. */
export function Pill({ label, active, activeBg = colors.ink, activeTextColor = colors.page, onPress, style }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.pill,
        active && { backgroundColor: activeBg, borderColor: activeBg },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, active && { color: activeTextColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft },
  pressed: { opacity: 0.65 },
});
