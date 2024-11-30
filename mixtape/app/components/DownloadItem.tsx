// components/DownloadItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface DownloadItemProps {
  fileName: string;
  directory: string;
  refreshList: () => void; // No arguments
}

const DownloadItem: React.FC<DownloadItemProps> = ({ fileName, directory, refreshList }) => {
  const fileUri = `${directory}${fileName}`;

  // Helper function to remove .mp3 extension
  const removeMp3Extension = (filename: string): string => {
    return filename.toLowerCase().endsWith('.mp3') ? filename.slice(0, -4) : filename;
  };

  // Function to share/open the file
  const handleShare = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist.');
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this platform.');
        return;
      }

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share the file.');
    }
  };

  // Function to delete the file
  const handleDelete = () => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${removeMp3Extension(fileName)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(fileUri);
              Alert.alert('Success', 'File deleted successfully.');
              refreshList();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete the file.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.itemContainer}>
      <Text style={styles.fileName}>{removeMp3Extension(fileName)}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DownloadItem;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  fileName: {
    fontSize: 16,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 15,
  },
  actionText: {
    color: '#1e90ff',
    fontSize: 16,
  },
  deleteText: {
    color: 'red',
  },
});
