import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppFonts } from '@/theme/typography';
import { colors } from '@/theme/colors';
import RootNavigator from '@/navigation/RootNavigator';
import AuthNavigator from '@/navigation/AuthNavigator';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';
import { useAuthStore } from '@/store/useAuthStore';

const queryClient = new QueryClient();

function Gate() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.stamp} />
      </View>
    );
  }

  if (status === 'signedOut') return <AuthNavigator />;

  if (status === 'needsBootstrap') {
    return <OnboardingScreen />;
  }

  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.stamp} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Gate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
});
