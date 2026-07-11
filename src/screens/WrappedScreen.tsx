import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { PhotoTile } from '@/components/PhotoTile';
import { FlameIcon } from '@/components/FlameIcon';
import { useAppStore } from '@/store/useAppStore';

export default function WrappedScreen({ navigation }: any) {
  const points = useAppStore((s) => s.points);
  const [reflection, setReflection] = useState('');

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.close} onPress={() => navigation?.goBack()}>
        <Text style={styles.closeText}>✕ close</Text>
      </Pressable>
      <Screen scroll contentStyle={{ paddingTop: 14 }}>
        <Text style={styles.sub}>monthly recap</Text>
        <Text style={styles.title}>your june</Text>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Text style={styles.statN}>22</Text>
            <Text style={styles.statL}>tasks done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statN}>{points}</Text>
            <Text style={styles.statL}>points</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.flameStatRow}>
              <FlameIcon size={16} color={colors.page} />
              <Text style={styles.statN}> 14</Text>
            </View>
            <Text style={styles.statL}>best streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statN}>3</Text>
            <Text style={styles.statL}>squad wins</Text>
          </View>
        </View>

        <Text style={styles.stripLabel}>one year ago today</Text>
        <View style={styles.strip}>
          <PhotoTile type="run" style={styles.stripFrame} />
          <PhotoTile type="gym" style={styles.stripFrame} />
          <PhotoTile type="read" style={styles.stripFrame} />
        </View>

        <View style={styles.reflect}>
          <Text style={styles.reflectPrompt}>what felt good this month?</Text>
          <TextInput
            style={styles.reflectInput}
            placeholder="type here or skip"
            placeholderTextColor="rgba(246,242,231,0.5)"
            value={reflection}
            onChangeText={setReflection}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.navy },
  close: { position: 'absolute', top: 10, right: 12, zIndex: 5 },
  closeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.page },

  sub: { fontFamily: fonts.mono, fontSize: 9, color: colors.page, opacity: 0.65, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  title: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.page, marginBottom: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  statBox: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: 'rgba(246,242,231,0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  flameStatRow: { flexDirection: 'row', alignItems: 'center' },
  statN: { fontFamily: fonts.display, fontSize: 22, color: colors.page },
  statL: { fontFamily: fonts.mono, fontSize: 8, color: colors.page, opacity: 0.7, letterSpacing: 0.5, marginTop: 2 },

  stripLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.page, opacity: 0.65, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  strip: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  stripFrame: { width: 48, height: 48, borderRadius: 4 },

  reflect: { borderTopWidth: 1, borderTopColor: 'rgba(246,242,231,0.25)', paddingTop: 10 },
  reflectPrompt: { ...textStyles.caption, color: colors.page, marginBottom: 6 },
  reflectInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(246,242,231,0.4)',
    color: colors.page,
    fontFamily: fonts.mono,
    fontSize: 10,
    paddingVertical: 4,
  },
});
