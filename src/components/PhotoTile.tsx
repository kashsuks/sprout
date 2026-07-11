import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { photoGradients } from '@/theme/colors';

type PhotoType = 'run' | 'gym' | 'read' | 'books';

function Icon({ type, size }: { type: PhotoType; size: number }) {
  const stroke = '#f4ecd8';
  switch (type) {
    case 'run':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={22} cy={8} r={3} fill={stroke} stroke="none" />
          <Path d="M22 12 L18 20 L23 24 L21 32 M18 20 L28 17 M23 24 L30 28 M18 20 L11 26" />
        </Svg>
      );
    case 'gym':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={4} y={16} width={6} height={8} rx={1.5} />
          <Rect x={30} y={16} width={6} height={8} rx={1.5} />
          <Line x1={10} y1={20} x2={30} y2={20} />
          <Rect x={1} y={18} width={3} height={4} rx={1} />
          <Rect x={36} y={18} width={3} height={4} rx={1} />
        </Svg>
      );
    case 'read':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 10 C16 7 9 7 6 9 V29 C9 27 16 27 20 30 C24 27 31 27 34 29 V9 C31 7 24 7 20 10 Z" />
          <Line x1={20} y1={10} x2={20} y2={30} />
        </Svg>
      );
    case 'books':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={7} y={10} width={26} height={5} rx={1} />
          <Rect x={7} y={17} width={26} height={5} rx={1} />
          <Rect x={7} y={24} width={18} height={5} rx={1} />
        </Svg>
      );
  }
}

type PhotoTileProps = {
  type: PhotoType;
  style?: StyleProp<ViewStyle>;
  iconRatio?: number;
};

export function PhotoTile({ type, style, iconRatio = 0.55 }: PhotoTileProps) {
  const [start, end] = photoGradients[type] ?? photoGradients.run;
  const [size, setSize] = React.useState(0);

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(e) => setSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}
    >
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {size > 0 && (
        <View style={StyleSheet.absoluteFillObject as any} pointerEvents="none">
          <View style={styles.center}>
            <Icon type={type} size={size * iconRatio} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
