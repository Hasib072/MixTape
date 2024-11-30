// app/index.tsx
import React, { useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Network from 'expo-network';
import { useRouter } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [apiStatus, setApiStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const router = useRouter();

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
      console.log("waiting for api response");
      if (text === 'MixTape Api Running...') {
        setApiStatus('success');
        console.log(text);
        router.replace('/Home'); // Navigate to Home screen
      } else {
        setApiStatus('error');
        console.error('Error no response from server..');
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
    if (apiStatus !== 'loading') {
      await SplashScreen.hideAsync();
    }
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

  // While navigating, keep the splash screen hidden
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* The navigation is handled by the router */}
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
