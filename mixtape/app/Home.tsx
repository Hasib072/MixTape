// app/Home.tsx
import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import Downloader from './components/Downloader';
import { useRouter } from 'expo-router';

const Home = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Downloader />
      <View style={styles.downloadsButton}>
        <Button title="Go to Downloads" onPress={() => router.push('/Downloads')} />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  downloadsButton: {
    marginTop: 20,
  },
});
