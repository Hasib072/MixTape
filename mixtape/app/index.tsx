// app/index.tsx
import React, { useEffect, useCallback } from 'react';
import { Text, View, Button, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import * as Network from 'expo-network';

SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function Index() {
  const [apiStatus, setApiStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  const checkApiStatus = async () => {
    try {
      // Check network connectivity
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        setApiStatus('error');
        console.error('No network connection');
        await SplashScreen.hideAsync();
        return;
      }

      setApiStatus('loading');
      const response = await fetch('https://mixtapeapis.onrender.com/api');
      const text = await response.text();
      if (text === 'MixTape Api Running...') {
        setApiStatus('success');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('Error pinging API:', error);
      setApiStatus('error');
    } finally {
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    // Any additional setup after layout
  }, [apiStatus]);

  if (apiStatus === 'loading') {
    // Keep the splash screen visible
    return null;
  } else if (apiStatus === 'error') {
    return (
      <View style={styles.errorContainer} onLayout={onLayoutRootView}>
        <Text style={styles.errorText}>Failed to connect to the MixTape API.</Text>
        <Button title="Retry" onPress={checkApiStatus} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});
