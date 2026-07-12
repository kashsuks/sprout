import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

type IconProps = { active?: boolean; size?: number };
const strokeWidth = 1.6;

function iconColor(active?: boolean) {
  return active ? colors.stamp : colors.inkSoft;
}

// Feed — three horizontal lines
export function FeedIcon({ active, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M3 12h18M3 18h18" stroke={iconColor(active)} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// Leaderboard — ascending bars
export function LeaderboardIcon({ active, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20V10M12 20V4M20 20v-7"
        stroke={iconColor(active)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// New entry — circled plus
export function NewEntryIcon({ active, size = 19 }: IconProps) {
  const c = iconColor(active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={strokeWidth} />
      <Path d="M12 8v8M8 12h8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// Squad/friends — two overlapping people
export function SquadIcon({ active, size = 19 }: IconProps) {
  const c = iconColor(active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={9} r={3} stroke={c} strokeWidth={strokeWidth} />
      <Circle cx={17} cy={10} r={2.4} stroke={c} strokeWidth={strokeWidth} />
      <Path d="M3 20c0-3 3-5 6-5s6 2 6 5" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// Profile — single person
export function ProfileIcon({ active, size = 19 }: IconProps) {
  const c = iconColor(active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={3.5} stroke={c} strokeWidth={strokeWidth} />
      <Path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// Garden — plant/leaf sprout
export function GardenIcon({ active, size = 19 }: IconProps) {
  const c = iconColor(active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22V8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M5 12c0-4 3-7 7-7s7 3 7 7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 18a3 3 0 100-6 3 3 0 000 6z" stroke={c} strokeWidth={strokeWidth} />
      <Path d="M8 22h8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// Shop — shopping bag
export function ShopIcon({ active, size = 19 }: IconProps) {
  const c = iconColor(active);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9h18l-1.5 9H4.5L3 9z" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 9V6a4 4 0 018 0v3" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
