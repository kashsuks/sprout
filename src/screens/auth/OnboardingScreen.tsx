import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/useAuthStore';

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export default function OnboardingScreen() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const usernameValid = USERNAME_RE.test(username);
  const canSubmit = usernameValid && displayName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    clearError();
    setSubmitting(true);
    try {
      await bootstrap(username, displayName.trim(), bio.trim());
    } catch {
      // error surfaced via store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[textStyles.appLogo, styles.title]}>one more step</Text>
      <Text style={styles.subtitle}>set up your profile</Text>

      <View style={styles.field}>
        <Text style={styles.label}>username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoCapitalize="none"
          placeholder="lowercase, numbers, underscores"
          placeholderTextColor={colors.inkSoft}
        />
        {username.length > 0 && !usernameValid ? (
          <Text style={styles.hint}>3-24 chars: a-z, 0-9, _</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="how friends see you"
          placeholderTextColor={colors.inkSoft}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>bio (optional)</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          placeholder="a short line about you"
          placeholderTextColor={colors.inkSoft}
          maxLength={160}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        {submitting ? <ActivityIndicator color={colors.card} /> : <Text style={styles.buttonText}>finish setup</Text>}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 },
  title: { color: colors.ink, textAlign: 'center', fontSize: 28, marginBottom: 4 },
  subtitle: { ...textStyles.caption, color: colors.inkSoft, textAlign: 'center', marginBottom: 32 },

  field: { marginBottom: 14 },
  label: { ...textStyles.eyebrow, color: colors.inkSoft, marginBottom: 6 },
  input: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hint: { ...textStyles.small, color: colors.navy, marginTop: 4 },

  error: { ...textStyles.body, color: colors.navy, marginBottom: 12 },

  button: {
    backgroundColor: colors.stamp,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.card, letterSpacing: 0.5 },
});
