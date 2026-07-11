import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

/**
 * RN's `borderStyle: 'dashed'` renders inconsistently on Android (and doesn't
 * support per-side dash length/gap control at all). Every dashed element in
 * the mockup — ticket cards, duo-streak cards, stamp badges, link buttons —
 * is built here as an absolutely-positioned SVG overlay instead, so the look
 * is pixel-identical across platforms.
 */

type DashedRectProps = {
  width: number;
  height: number;
  radius?: number;
  color?: string;
  strokeWidth?: number;
  dash?: [number, number];
  style?: StyleProp<ViewStyle>;
};

export function DashedRect({
  width,
  height,
  radius = 8,
  color = colors.stamp,
  strokeWidth = 1.5,
  dash = [5, 4],
  style,
}: DashedRectProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        <Rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      </Svg>
    </View>
  );
}

type DashedCircleProps = {
  size: number;
  color?: string;
  strokeWidth?: number;
  dash?: [number, number];
};

export function DashedCircle({
  size,
  color = colors.stamp,
  strokeWidth = 1.5,
  dash = [3, 3],
}: DashedCircleProps) {
  const r = (size - strokeWidth) / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
      />
    </Svg>
  );
}
