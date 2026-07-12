import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { DashedCircle } from './DashedBorder';

type StampProps = {
  /** Short text inside the badge, e.g. "9", "RUN", "GYM" */
  label: string;
  size?: number;
  color?: string;
  rotation?: number; // degrees
  dashed?: boolean;
  fontSize?: number;
};

/**
 * The wax-stamp badge: a rotated, dashed (or solid) circle with typewriter
 * text, used for the streak counter (top-right of Feed), and the mini
 * task-type stamps on each feed entry (RUN / RD / GYM).
 */
export function Stamp({
  label,
  size = 30,
  color = colors.stamp,
  rotation = -8,
  dashed = true,
  fontSize = 11,
}: StampProps) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, alignSelf: 'flex-start', transform: [{ rotate: `${rotation}deg` }] },
      ]}
    >
      {dashed ? (
        <DashedCircle size={size} color={color} strokeWidth={1.5} dash={[3, 3]} />
      ) : (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
      )}
      <Text style={[styles.label, { color, fontSize }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.monoBold,
    textAlign: 'center',
  },
});
