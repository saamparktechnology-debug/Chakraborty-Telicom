import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const theme = useAuthStore((s) => s.theme);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(dse)/index" />
        <Stack.Screen name="(retailer)/index" />
        <Stack.Screen name="(customer)/index" />
      </Stack>
    </SafeAreaProvider>
  );
}
