// components/Downloader.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { PermissionStatus } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DownloadItem from './DownloadItem';
// Removed ProgressBar import
// import { ProgressBar } from 'react-native-paper';
import { ApiResponse, DownloadResumableDownloadResult } from '../types/types'; // Adjust the path as needed

const Downloader = () => {
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [userFileName, setUserFileName] = useState<string>(''); // User-edited filename
  const [downloadDirectory, setDownloadDirectory] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [fetchedLink, setFetchedLink] = useState<string>(''); // Downloadable link from API
  const [title, setTitle] = useState<string>(''); // Title from API
  const [filesize, setFilesize] = useState<number>(0); // Filesize in bytes
  const [isFetching, setIsFetching] = useState<boolean>(false); // Indicates API fetch in progress
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // Indicates download in progress
  // Removed isPaused and progress states
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null); // Reference to DownloadResumable instance

  // Helper function to ensure filename ends with .mp3
  const ensureMp3Extension = (filename: string): string => {
    return filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;
  };

  // Function to request storage permissions (required for Android if accessing external storage)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== PermissionStatus.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download files.'
        );
        return false;
      }
    }
    return true;
  };

  // Function to set default download directory and ensure it exists
  const setDefaultDownloadDirectory = async () => {
    const dir = FileSystem.documentDirectory + 'MixTape/downloads/';

    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log(`Created directory at ${dir}`);
      }
      setDownloadDirectory(dir);
      listFiles(dir);
    } catch (error) {
      console.error('Error setting download directory:', error);
      Alert.alert('Error', 'Failed to set up download directory.');
    }
  };

  // Function to list files in the download directory
  const listFiles = async (dir: string) => {
    try {
      const filesInfo = await FileSystem.readDirectoryAsync(dir);
      setFiles(filesInfo);
    } catch (error) {
      console.error('Error listing files:', error);
      Alert.alert('Error', 'Failed to list downloaded files.');
    }
  };

  useEffect(() => {
    setDefaultDownloadDirectory();
    loadPausedDownload(); // Optional: Remove if not using paused downloads
  }, []);

  // Optional: Remove if not using paused downloads
  const loadPausedDownload = async () => {
    try {
      const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
      if (downloadSnapshotJson) {
        const downloadSnapshot = JSON.parse(downloadSnapshotJson);
        const downloadResumable = new FileSystem.DownloadResumable(
          downloadSnapshot.url,
          downloadSnapshot.fileUri,
          downloadSnapshot.options,
          callback,
          downloadSnapshot.resumeData
        );
        downloadResumableRef.current = downloadResumable;
        // Removed isPaused and related state updates
        setDownloadStatus('Download paused. You can resume it.');
      }
    } catch (error) {
      console.error('Error loading paused download:', error);
    }
  };

  // Callback to handle download progress
  const callback = (downloadProgress: FileSystem.DownloadProgressCallbackData) => {
    const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;

    let progressValue = 0;

    if (totalBytesExpectedToWrite > 0) {
      progressValue = totalBytesWritten / totalBytesExpectedToWrite;
      // Clamp progress between 0 and 1
      if (progressValue < 0) progressValue = 0;
      if (progressValue > 1) progressValue = 1;
    }

    setDownloadStatus(`Downloading... ${Math.floor(progressValue * 100)}%`);
  };

  // Function to fetch download details from API
  const fetchDownloadDetails = async () => {
    if (!downloadLink.trim()) {
      Alert.alert('Input Required', 'Please enter a valid download link.');
      return;
    }

    try {
      setIsFetching(true);
      setDownloadStatus('Fetching download details...');

      // Make a POST request to the API with the user-provided link
      const response = await fetch(
        `https://mixtapeapis.onrender.com/api/getmp3?${encodeURIComponent(
          downloadLink.trim()
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data: ApiResponse = await response.json();

      if (data.status === 'ok') {
        setFetchedLink(data.link);
        setTitle(data.title);
        setFilesize(data.filesize);
        setUserFileName(ensureMp3Extension(data.title)); // Set default filename to title with .mp3
        setDownloadStatus('Download details fetched successfully.');
      } else {
        Alert.alert('Error', data.msg || 'Failed to fetch download details.');
        setDownloadStatus('');
      }
    } catch (error) {
      console.error('Error fetching download details:', error);
      Alert.alert('Error', 'Failed to fetch download details.');
      setDownloadStatus('');
    } finally {
      setIsFetching(false);
    }
  };

  // Function to handle the download process
  const handleDownload = async () => {
    if (!fetchedLink) {
      Alert.alert(
        'Details Not Fetched',
        'Please fetch download details before downloading.'
      );
      return;
    }

    if (!downloadDirectory) {
      Alert.alert('Directory Not Set', 'Download directory is not set.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setDownloadStatus('Preparing to download...');

      // Use user-provided filename or title from API
      const finalFileName =
        userFileName.trim() !== ''
          ? ensureMp3Extension(userFileName.trim())
          : ensureMp3Extension('downloaded_file'); // Ensure .mp3 is appended

      const fileUri = `${downloadDirectory}${finalFileName}`;

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        Alert.alert(
          'File Exists',
          `A file named "${finalFileName}" already exists. Do you want to overwrite it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Overwrite',
              style: 'destructive',
              onPress: async () => {
                await FileSystem.deleteAsync(fileUri);
                performDownload(fileUri, finalFileName);
              },
            },
          ]
        );
        return;
      }

      performDownload(fileUri, finalFileName);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed.');
      Alert.alert('Error', 'Failed to download the file.');
    }
  };

  // Function to perform the actual download
  const performDownload = async (fileUri: string, finalFileName: string) => {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        fetchedLink,
        fileUri,
        {},
        callback
      );

      downloadResumableRef.current = downloadResumable;
      setIsDownloading(true);
      setDownloadStatus('Downloading...');

      const downloadResult = await downloadResumable.downloadAsync();
      const { uri } = downloadResult as DownloadResumableDownloadResult;

      setDownloadStatus('Download complete!');
      Alert.alert('Success', `File downloaded to: ${uri}`);
      setIsDownloading(false);
      // Removed progress reset since progress state is removed
      AsyncStorage.removeItem('pausedDownload');
      listFiles(downloadDirectory);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed.');
      Alert.alert('Error', 'Failed to download the file.');
      setIsDownloading(false);
      // Removed progress reset
    }
  };

  return (
    <View style={styles.container}>
      {/* Download Link Input */}
      <Text style={styles.label}>Download Link:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter download URL"
        value={downloadLink}
        onChangeText={setDownloadLink}
        autoCapitalize="none"
        keyboardType="url"
      />

      {/* Fetch Details Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isFetching ? 'Fetching...' : 'Fetch Details'}
          onPress={fetchDownloadDetails}
          disabled={isFetching}
        />
      </View>

      {/* Display Fetched Title and Filesize */}
      {title && filesize > 0 && (
        <>
          <Text style={styles.label}>Title:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter desired filename"
            value={userFileName}
            onChangeText={setUserFileName}
            autoCapitalize="none"
          />

          <Text style={styles.label}>
            File Size: {(filesize / (1024 * 1024)).toFixed(2)} MB
          </Text>

          {/* Download Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Download"
              onPress={handleDownload}
              disabled={isDownloading}
            />
          </View>
        </>
      )}

      {/* Download Status */}
      {downloadStatus ? (
        <Text style={styles.status}>{downloadStatus}</Text>
      ) : null}

      {/* Removed ProgressBar */}

      {/* List of Downloaded Files */}
      {files.length > 0 && (
        <View style={styles.filesContainer}>
          <Text style={styles.filesTitle}>Downloaded Files:</Text>
          <FlatList
            data={files}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <DownloadItem
                fileName={item}
                directory={downloadDirectory}
                refreshList={() => listFiles(downloadDirectory)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      )}
    </View>
  );
};

export default Downloader;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: 'green',
  },
  filesContainer: {
    flex: 1,
    marginTop: 20,
  },
  filesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 20,
  },
});
