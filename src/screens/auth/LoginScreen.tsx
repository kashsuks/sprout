import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    clearError();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // error surfaced via store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[textStyles.appLogo, styles.title]}>sprout</Text>
      <Text style={styles.subtitle}>welcome back</Text>

      <View style={styles.field}>
        <Text style={styles.label}>email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.inkSoft}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
          placeholderTextColor={colors.inkSoft}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !email || !password}
      >
        {submitting ? <ActivityIndicator color={colors.card} /> : <Text style={styles.buttonText}>sign in</Text>}
      </Pressable>

      <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>no account yet? <Text style={styles.linkTextBold}>sign up</Text></Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8 },
  title: { color: colors.ink, textAlign: 'center', fontSize: 32, marginBottom: 4 },
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

  linkRow: { marginTop: 18, alignItems: 'center' },
  linkText: { ...textStyles.body, color: colors.inkSoft },
  linkTextBold: { fontFamily: fonts.monoBold, color: colors.stamp },
});
