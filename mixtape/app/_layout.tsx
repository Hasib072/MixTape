// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers globally
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Splash' }} />
      <Stack.Screen name="Home" options={{ title: 'Home' }} />
      <Stack.Screen name="Downloads" options={{ title: 'Downloads' }} /> {/* Add Downloads */}
      {/* Add other screens here */}
    </Stack>
  );
}
