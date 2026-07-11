import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { FlameIcon } from '@/components/FlameIcon';
import { useAuthStore } from '@/store/useAuthStore';
import { useScrapbook } from '@/api/hooks/users';

export default function WrappedScreen({ navigation }: any) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const { data: scrapbookData } = useScrapbook();
  const [reflection, setReflection] = useState('');

  const recentEntries = (scrapbookData?.entries ?? []).slice(0, 3);

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.close} onPress={() => navigation?.goBack()}>
        <Text style={styles.closeText}>✕ close</Text>
      </Pressable>
      <Screen scroll contentStyle={{ paddingTop: 14 }}>
        <Text style={styles.sub}>your recap</Text>
        <Text style={styles.title}>so far</Text>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Text style={styles.statN}>{mongoUser?.points ?? 0}</Text>
            <Text style={styles.statL}>points</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.flameStatRow}>
              <FlameIcon size={16} color={colors.page} />
              <Text style={styles.statN}> {mongoUser?.currentStreak ?? 0}</Text>
            </View>
            <Text style={styles.statL}>current streak</Text>
          </View>
        </View>

        <Text style={styles.stripLabel}>recent stamps</Text>
        {recentEntries.length === 0 ? (
          <Text style={styles.emptyHint}>nothing stamped yet</Text>
        ) : (
          <View style={styles.strip}>
            {recentEntries.map((entry) => (
              <Image key={entry._id} source={{ uri: entry.photoUrl }} style={styles.stripFrame} resizeMode="cover" />
            ))}
          </View>
        )}

        <View style={styles.reflect}>
          <Text style={styles.reflectPrompt}>what felt good lately?</Text>
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
  stripFrame: { width: 48, height: 48, borderRadius: 4, backgroundColor: 'rgba(246,242,231,0.15)' },
  emptyHint: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.page, opacity: 0.65, marginBottom: 14 },

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
