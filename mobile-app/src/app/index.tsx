import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function IndexGateScreen() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Starting Amul Party App...</Text>
      </View>
    );
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'DSE' || user.role === 'ADMIN') {
    return <Redirect href="/(dse)" />;
  }
  if (user.role === 'RETAILER') {
    return <Redirect href="/(retailer)" />;
  }
  if (user.role === 'CUSTOMER') {
    return <Redirect href="/(customer)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
