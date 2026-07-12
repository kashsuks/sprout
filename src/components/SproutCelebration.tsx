import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';

const LEAF_COUNT = 5;

function LeafBit({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const left = useRef(30 + Math.random() * 40).current;
  const drift = useRef((Math.random() - 0.5) * 70).current;
  const spin = useRef((Math.random() - 0.5) * 60).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.Text
      style={[
        styles.leaf,
        { left: `${left}%`, opacity, transform: [{ translateY }, { translateX }, { rotate }, { scale }] },
      ]}
    >
      🌿
    </Animated.Text>
  );
}

export function SproutCelebration({ emoji, message, streakLine }: { emoji: string; message: string; streakLine?: string }) {
  const pop = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(0)).current;
  const streakRise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4.5, tension: 60, useNativeDriver: true }).start();
    Animated.timing(textRise, { toValue: 1, duration: 400, delay: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    Animated.timing(streakRise, { toValue: 1, duration: 400, delay: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, []);

  const scale = pop.interpolate({ inputRange: [0, 0.55, 0.75, 1], outputRange: [0.2, 1.2, 0.94, 1] });
  const rotate = pop.interpolate({ inputRange: [0, 0.55, 0.75, 1], outputRange: ['-8deg', '4deg', '-2deg', '0deg'] });

  return (
    <View style={styles.celebrate}>
      {Array.from({ length: LEAF_COUNT }).map((_, i) => (
        <LeafBit key={i} delay={i * 80} />
      ))}
      <Animated.Text style={[styles.emoji, { transform: [{ scale }, { rotate }] }]}>{emoji}</Animated.Text>
      <Animated.Text
        style={[
          styles.msg,
          { opacity: textRise, transform: [{ translateY: textRise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
      >
        {message}
      </Animated.Text>
      {streakLine ? (
        <Animated.Text
          style={[
            styles.streakline,
            { opacity: streakRise, transform: [{ translateY: streakRise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
          ]}
        >
          {streakLine}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  celebrate: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  leaf: { position: 'absolute', bottom: '46%', fontSize: 16 },
  emoji: { fontSize: 48 },
  msg: { ...textStyles.appLogo, fontSize: 18, color: colors.ink, marginTop: 13, marginBottom: 4, textAlign: 'center' },
  streakline: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.stamp },
});
