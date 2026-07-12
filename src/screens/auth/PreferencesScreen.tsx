import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useSavePreferences } from '@/api/hooks/users';
import { useAuthStore } from '@/store/useAuthStore';

const PREFERENCE_OPTIONS = [
  { id: 'fitness', emoji: '💪', label: 'fitness' },
  { id: 'mindfulness', emoji: '🧘', label: 'mindfulness' },
  { id: 'learning', emoji: '📚', label: 'learning & reading' },
  { id: 'social', emoji: '👯', label: 'social & relationships' },
  { id: 'creativity', emoji: '🎨', label: 'creativity' },
  { id: 'productivity', emoji: '✅', label: 'productivity' },
  { id: 'nature', emoji: '🌿', label: 'nature & outdoors' },
  { id: 'cooking', emoji: '🍳', label: 'cooking & food' },
];

export default function PreferencesScreen({ navigation }: any = {}) {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const isEditing = mongoUser?.hasSetPreferences ?? false;
  const savePreferences = useSavePreferences();
  const [selected, setSelected] = useState<Set<string>>(new Set(mongoUser?.contentPreferences ?? []));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submit() {
    savePreferences.mutate([...selected], { onSuccess: () => navigation?.goBack?.() });
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[textStyles.appLogo, styles.title]}>what are you into?</Text>
      <Text style={styles.subtitle}>pick a few things you'd like to see more of — you can change this later</Text>

      <View style={styles.grid}>
        {PREFERENCE_OPTIONS.map((opt) => {
          const on = selected.has(opt.id);
          return (
            <Pressable key={opt.id} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(opt.id)}>
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.button} onPress={submit} disabled={savePreferences.isPending}>
        {savePreferences.isPending ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? 'save' : selected.size > 0 ? 'continue' : 'skip for now'}
          </Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 },
  title: { color: colors.ink, textAlign: 'center', fontSize: 26, marginBottom: 4 },
  subtitle: { ...textStyles.caption, color: colors.inkSoft, textAlign: 'center', marginBottom: 28, paddingHorizontal: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.stamp, borderColor: colors.stamp },
  chipEmoji: { fontSize: 13 },
  chipText: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink },
  chipTextOn: { color: colors.card },

  button: {
    backgroundColor: colors.stamp,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.card, letterSpacing: 0.5 },
});
