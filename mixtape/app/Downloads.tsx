// app/Downloads.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import DownloadItem from './components/DownloadItem';

const Downloads = () => {
  const [files, setFiles] = useState<string[]>([]);

  const downloadDirectory = FileSystem.documentDirectory + 'MixTape/downloads/';

  // Function to list all downloaded files
  const listFiles = async () => {
    try {
      const filesInfo = await FileSystem.readDirectoryAsync(downloadDirectory);
      setFiles(filesInfo);
    } catch (error) {
      console.error('Error listing files:', error);
      Alert.alert('Error', 'Failed to list downloaded files.');
    }
  };

  useEffect(() => {
    listFiles();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Downloads</Text>
      {files.length === 0 ? (
        <Text style={styles.noFilesText}>No files downloaded yet.</Text>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <DownloadItem fileName={item} directory={downloadDirectory} refreshList={listFiles} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

export default Downloads;

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
  noFilesText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  list: {
    paddingBottom: 20,
  },
});
