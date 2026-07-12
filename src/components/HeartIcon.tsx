import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';

type Props = { size?: number; filled?: boolean; color?: string };

// Same heart path as src/assets/heart-outline.svg and heart-filled.svg —
// rendered as a component (like FlameIcon) rather than required as an image,
// since this project has react-native-svg installed but no SVG-file
// transformer configured in metro.config.js yet. If that gets added later,
// the two asset files are still there as the source of truth for the path.
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

export function HeartIcon({ size = 20, filled = false, color = colors.stamp }: Props) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={HEART_PATH} fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={HEART_PATH} fill="none" stroke={colors.inkSoft} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}