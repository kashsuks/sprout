import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

type ScreenProps = {
  children: React.ReactNode;
  /** Set false for screens that manage their own scroll (rare). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pass both to enable pull-to-refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Overrides the default page background — e.g. for dark overlay screens like Wrapped. */
  backgroundColor?: string;
};

/**
 * Every screen in the app renders inside this. It handles three things that
 * are easy to get wrong on a real device but invisible in a static mockup:
 *  1. Safe-area insets (notch, home indicator) on both edges — the bottom
 *     tab bar already accounts for its own inset, so screens only need top.
 *  2. Extra bottom padding so the last item in a list isn't hidden behind
 *     the tab bar.
 *  3. KeyboardAvoidingView so text inputs (caption, custom task) aren't
 *     covered by the keyboard on smaller phones.
 */
export function Screen({ children, scroll = true, contentStyle, refreshing, onRefresh, backgroundColor }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[{ paddingBottom: insets.bottom + 24 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.stamp} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={[styles.safe, backgroundColor ? { backgroundColor } : null]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 14 },
});
