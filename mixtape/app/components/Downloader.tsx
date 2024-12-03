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
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { StorageAccessFramework } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types/types'; // Adjust the path as needed
import { useRouter } from 'expo-router';


const Downloader = () => {
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [userFileName, setUserFileName] = useState<string>(''); // User-edited filename
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [fetchedLink, setFetchedLink] = useState<string>(''); // Downloadable link from API
  const [title, setTitle] = useState<string>(''); // Title from API
  const [filesize, setFilesize] = useState<number>(0); // Filesize in bytes
  const [isFetching, setIsFetching] = useState<boolean>(false); // Indicates API fetch in progress
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // Indicates download in progress
  const [selectedDirectoryUri, setSelectedDirectoryUri] = useState<string | null>(null); // Directory selected by user
  const [defaultDirectory, setDefaultDirectory] = useState<string>(''); // Default app-specific directory

  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null); // Reference to DownloadResumable instance

  const router = useRouter();

  // Helper function to ensure filename ends with .mp3
  const ensureMp3Extension = (filename: string): string => {
    return filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;
  };

  // Function to set up the default directory
  const setupDefaultDirectory = async () => {
    const dir = FileSystem.documentDirectory + 'MixTape/downloads/';
    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log(`Created directory at ${dir}`);
      }
      setDefaultDirectory(dir);
    } catch (error) {
      console.error('Error setting up default directory:', error);
      Alert.alert('Error', 'Failed to set up default directory.');
    }
  };

  // Function to request necessary permissions
  const requestPermissions = async () => {
    // Request Media Library permissions
    const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
    if (mediaLibraryPermission.status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Media library permission is required to save files.'
      );
      return false;
    }

    // For Android, check if user has selected external directory
    if (Platform.OS === 'android') {
      const directoryUri = await AsyncStorage.getItem('selectedDirectoryUri');
      if (directoryUri) {
        setSelectedDirectoryUri(directoryUri);
      }
    }

    return true;
  };

  // Function to choose download directory
  const chooseDirectory = async () => {
    try {
      // SAF only works on Android
      if (Platform.OS !== 'android') {
        Alert.alert('Not Supported', 'Directory selection is only available on Android.');
        return;
      }

      // Request permissions to access storage
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        // Save the URI of the selected directory
        setSelectedDirectoryUri(permissions.directoryUri);
        await AsyncStorage.setItem('selectedDirectoryUri', permissions.directoryUri);

        Alert.alert(
          'Directory Selected',
          'You can now download files to the selected directory.'
        );
      } else {
        Alert.alert('Permission Denied', 'You need to grant permission to access directories.');
      }
    } catch (error) {
      console.error('Error choosing directory:', error);
      Alert.alert('Error', 'An error occurred while selecting directory.');
    }
  };

  // Function to reset to default directory
  const resetToDefaultDirectory = async () => {
    try {
      setSelectedDirectoryUri(null);
      await AsyncStorage.removeItem('selectedDirectoryUri');
      Alert.alert('Directory Reset', 'Download directory has been reset to default.');
    } catch (error) {
      console.error('Error resetting to default directory:', error);
      Alert.alert('Error', 'An error occurred while resetting to default directory.');
    }
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

  const goToDownloads = () => {
    router.push('/Downloads');
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

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setDownloadStatus('Preparing to download...');

      // Use user-provided filename or title from API
      const finalFileName =
        userFileName.trim() !== ''
          ? ensureMp3Extension(userFileName.trim())
          : ensureMp3Extension('downloaded_file'); // Ensure .mp3 is appended

      if (selectedDirectoryUri) {
        // If user has selected a directory, use SAF to save the file there
        performDownloadToExternalDirectory(finalFileName);
      } else {
        // Use default app-specific directory
        performDownloadToDefaultDirectory(finalFileName);
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed.');
      Alert.alert('Error', 'Failed to download the file.');
    }
  };

  // Function to perform the actual download to default directory
  const performDownloadToDefaultDirectory = async (finalFileName: string) => {
    try {
      setIsDownloading(true);
      setDownloadStatus('Downloading...');

      const fileUri = defaultDirectory + finalFileName;

      // Download the file to the app-specific directory
      const downloadResumable = FileSystem.createDownloadResumable(
        fetchedLink,
        fileUri,
        {},
        callback
      );

      const downloadResult = await downloadResumable.downloadAsync();
      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed or was canceled');
      }

      setDownloadStatus('Download complete!');
      Alert.alert('Success', `File saved to: ${downloadResult.uri}`);
      setIsDownloading(false);

      // Clear input fields and fetched data
      setDownloadLink('');
      setFetchedLink('');
      setTitle('');
      setFilesize(0);
      setUserFileName('');
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed.');
      Alert.alert('Error', 'Failed to download the file.');
      setIsDownloading(false);
    }
  };

  // Function to perform the download to external directory using SAF
  const performDownloadToExternalDirectory = async (finalFileName: string) => {
    try {
      setIsDownloading(true);
      setDownloadStatus('Downloading...');

      // Create a temporary file in cache directory
      const tempFileUri = FileSystem.cacheDirectory + finalFileName;

      // Download the file to the temp location
      const downloadResumable = FileSystem.createDownloadResumable(
        fetchedLink,
        tempFileUri,
        {},
        callback
      );

      const downloadResult = await downloadResumable.downloadAsync();
      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed or was canceled');
      }
      const { uri } = downloadResult;

      // Read the file content as a binary string
      const fileString = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create a file in the selected directory
      try {
        const newFileUri = await StorageAccessFramework.createFileAsync(
          selectedDirectoryUri!,
          finalFileName,
          'audio/mpeg' // MIME type for MP3 files
        );

        // Write the file content to the new file
        await StorageAccessFramework.writeAsStringAsync(newFileUri, fileString, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setDownloadStatus('Download complete!');
        Alert.alert('Success', `File saved to the selected directory.`);

        // Clear input fields and fetched data
        setDownloadLink('');
        setFetchedLink('');
        setTitle('');
        setFilesize(0);
        setUserFileName('');
      } catch (error) {
        console.error('Error writing file:', error);
        Alert.alert(
          'Error',
          'Failed to save the file to the selected directory. Please make sure the app has access to the directory and try again.'
        );
      }

      setIsDownloading(false);

      // Clean up: delete the temporary file from cache
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed.');
      Alert.alert('Error', 'Failed to download the file.');
      setIsDownloading(false);
    }
  };

  // Callback to handle download progress
  const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
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

  // Initialize default directory and request permissions on app start
  useEffect(() => {
    const init = async () => {
      await setupDefaultDirectory();
      await requestPermissions();
    };
    init();
  }, []);

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

      {/* Display Selected Directory */}
      {selectedDirectoryUri ? (
        <Text style={styles.status}>
          Selected Directory: {selectedDirectoryUri}
        </Text>
      ) : (
        <Text style={styles.status}>
          Using Default Directory: {defaultDirectory}
        </Text>
      )}

      {/* Option to Change Directory */}
      <View style={styles.buttonContainer}>
        <Button
          title="Change Download Directory"
          onPress={() => chooseDirectory()}
        />
      </View>

      {/* Option to Reset to Default Directory */}
      <View style={styles.buttonContainer}>
        <Button
          title="Reset to Default Directory"
          onPress={resetToDefaultDirectory}
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

      {/* Go to Downloads Folder Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Go to Downloads Folder"
          onPress={goToDownloads}
        />
      </View>
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
});
