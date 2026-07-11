import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type TicketProps = {
  icon: string; // emoji
  iconBg: string;
  title: string;
  subtitle: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

const NOTCH_SIZE = 11;

/**
 * The "torn ticket stub" row used for task cards in the New Entry screen.
 * The semicircular notches on the left/right edges are recreated with two
 * small circles colored to match the surrounding page background, clipped
 * by overflow:hidden on the wrapping row — same trick as the CSS version's
 * ::before/::after pseudo-elements.
 */
export function Ticket({ icon, iconBg, title, subtitle, style, onPress }: TicketProps) {
  return (
    <View style={[styles.outer, style]}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
        onPress={onPress}
        disabled={!onPress}
        android_ripple={onPress ? { color: colors.line } : undefined}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </Pressable>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={[styles.notch, styles.notchRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  rowPressed: { backgroundColor: colors.page },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 14 },
  title: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginTop: 2 },
  notch: {
    position: 'absolute',
    top: '50%',
    marginTop: -NOTCH_SIZE / 2,
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: colors.page,
  },
  notchLeft: { left: -NOTCH_SIZE / 2 },
  notchRight: { right: -NOTCH_SIZE / 2 },
});
