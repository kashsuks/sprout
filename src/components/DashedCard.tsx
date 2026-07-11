import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { useState, useCallback } from 'react';
import { colors } from '@/theme/colors';
import { DashedRect } from './DashedBorder';

type DashedCardProps = {
  children: React.ReactNode;
  color?: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Card with a dashed border, measured at runtime so the SVG overlay matches
 * the rendered box exactly regardless of content height. Used for the duo
 * streak card and the "link a friend" rows.
 */
export function DashedCard({ children, color = colors.stamp, radius = 8, style }: DashedCardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]} onLayout={onLayout}>
      {size.width > 0 && (
        <DashedRect width={size.width} height={size.height} radius={radius} color={color} />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  content: {
    padding: 10,
  },
});
