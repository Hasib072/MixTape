// components/DownloadItem.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import MusicInfo from 'expo-music-info-2';

interface DownloadItemProps {
  fileName: string;
  directory: string;
  refreshList: () => void; // No arguments
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  fileName,
  directory,
  refreshList,
}) => {
  const fileUri = `${directory}${fileName}`;

  const [metadata, setMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);

  // Helper function to remove .mp3 extension
  const removeMp3Extension = (filename: string): string => {
    return filename.toLowerCase().endsWith('.mp3')
      ? filename.slice(0, -4)
      : filename;
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

  // Function to load metadata
  const loadMetadata = async () => {
    try {
      setIsLoadingMetadata(true);
      const metadata = await MusicInfo.getMusicInfoAsync(fileUri, {
        title: true,
        artist: true,
        album: true,
        genre: true,
        picture: true,
      });
      setMetadata(metadata);
      console.log(metadata.picture?.pictureData);
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Load metadata when the component mounts
  useEffect(() => {
    loadMetadata();
  }, []);

  // Extract picture data
  let albumArtUri: string | undefined = undefined;
  if (metadata && metadata.picture) {
    albumArtUri = metadata.picture.pictureData;
  }

  return (
    <View style={styles.itemContainer}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {isLoadingMetadata ? (
          <ActivityIndicator style={styles.coverloader} size="small" color="#fff" />
        ) : (
          <Image
            source={
              albumArtUri
                ? { uri: albumArtUri }
                : require('../../assets/images/icon.png')
            }
            style={styles.thumbnail}
            resizeMode="cover" // Ensure the image covers the entire area
          />
        )}
      </View>

      {/* File Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.fileName}>
          {metadata && metadata.title
            ? metadata.title
            : removeMp3Extension(fileName)}
        </Text>
        <Text style={styles.artistName}>
          {metadata && metadata.artist ? metadata.artist : 'Unknown Artist'}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Share Button */}
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DownloadItem;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  thumbnail: {
    flex: 1,
    width: undefined,
    height: undefined,
  },
  infoContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 15,
  },
  actionText: {
    color: '#1e90ff',
    fontSize: 16,
  },
  deleteText: {
    color: 'red',
  },
  coverloader:{
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
