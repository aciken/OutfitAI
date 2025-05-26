import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalContext } from '../context/GlobalProvider';
import { Client, Storage, ID } from 'react-native-appwrite'; // Using react-native-appwrite
import * as FileSystem from 'expo-file-system'; // For file operations
import axios from 'axios'; // For backend calls

// --- Appwrite Configuration (as per [id].jsx) ---
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '682371f4001597e0b4a7';
const PROFILE_IMAGES_BUCKET_ID = '6823720b001cdc257539'; // Assuming same bucket as in [id].jsx
const USER_BACKEND_URL = 'https://dc8b-109-245-193-150.ngrok-free.app'; // Base URL for your backend

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const storage = new Storage(client);
// --- End Appwrite Configuration ---

export default function ChangeProfileImageScreen() {
  const { user: contextUser, setUser: setContextUser } = useGlobalContext();
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadUserDataAndImage = async () => {
      setIsLoading(true);
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (!storedUserString) {
          Alert.alert("Error", "User not found. Please login again.");
          router.replace('/');
          return;
        }
        const storedUser = JSON.parse(storedUserString);
        
        if (!contextUser || contextUser._id !== storedUser._id) { // Assuming _id is the unique user identifier
          setContextUser(storedUser);
        }

        if (storedUser.fileId) {
          setCurrentFileId(storedUser.fileId);
          const imageUrl = storage.getFileDownload(PROFILE_IMAGES_BUCKET_ID, storedUser.fileId);
          setProfileImageUri(imageUrl.href);
        } else {
          setProfileImageUri(require('../../assets/outfitaiIcon.png')); // Default if no fileId
        }
      } catch (error) {
        console.error("Failed to load user data or image:", error);
        Alert.alert("Error", "Could not load profile information.");
        setProfileImageUri(require('../../assets/outfitaiIcon.png')); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadUserDataAndImage();
  }, []);

  const handleImageSelection = async () => {
    Alert.alert(
      "Select Image Source",
      "Choose where to select your profile picture from:",
      [
        { text: "Camera", onPress: () => pickImage('camera') },
        { text: "Gallery", onPress: () => pickImage('gallery') },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const pickImage = async (source) => {
    if (isUploading) return;

    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    try {
      if (source === 'camera') {
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPerm.status !== 'granted') {
          Alert.alert("Permission Denied", "Camera access is required.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPerm.status !== 'granted') {
          Alert.alert("Permission Denied", "Gallery access is required.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setIsUploading(true);
        setProfileImageUri(localUri); // Show local preview immediately

        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
          throw new Error("File does not exist at the local URI.");
        }

        const fileName = localUri.split('/').pop() || `profile_${ID.unique()}.jpg`;
        const mimeType = result.assets[0].mimeType || 'image/jpeg'; // Get mimeType if available
        
        const appwritePayload = {
          uri: localUri,
          name: fileName,
          type: mimeType,
          size: fileInfo.size,
        };

        // 1. Upload new image to Appwrite Storage
        const uploadedFile = await storage.createFile(PROFILE_IMAGES_BUCKET_ID, ID.unique(), appwritePayload);
        const newFileId = uploadedFile.$id;
        const newImagePreviewUrl = storage.getFileDownload(PROFILE_IMAGES_BUCKET_ID, newFileId).href;

        // 2. Update User via Backend
        const userFromStorageString = await AsyncStorage.getItem('user');
        const userFromStorage = JSON.parse(userFromStorageString);

        if (!userFromStorage || !userFromStorage._id) {
          Alert.alert("Error", "User session error. Cannot update profile image.");
          setIsUploading(false);
          return;
        }
        const userID = userFromStorage._id;

        // **** IMPORTANT: Verify this backend endpoint and payload ****
        const backendResponse = await axios.put(`https://dc8b-109-245-193-150.ngrok-free.app/newImage`, {
          userID: userID,
          newFileId: newFileId,
          // You might also want to send newImagePreviewUrl if your backend stores it
        });

        if (backendResponse.status !== 200 && backendResponse.status !== 201) {
          throw new Error(backendResponse.data.message || "Failed to update profile image on backend.");
        }
        const updatedUserFromBackend = backendResponse.data; // Assuming backend returns updated user

        // 3. Update local user data (AsyncStorage & Context)
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserFromBackend));
        setContextUser(updatedUserFromBackend);
        setProfileImageUri(newImagePreviewUrl);

        // 4. Delete old image from Appwrite Storage (if one existed
        setCurrentFileId(newFileId);

      }
    } catch (error) {
      console.error("Error during image pick/upload:", error);
      Alert.alert("Upload Failed", error.message || "Could not upload image. Please try again.");
      if (currentFileId) {
        const oldImageUrl = storage.getFileDownload(PROFILE_IMAGES_BUCKET_ID, currentFileId);
        setProfileImageUri(oldImageUrl.href);
      } else {
        setProfileImageUri(require('../../assets/outfitaiIcon.png'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#C07EFF" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButtonContainer}>
          <Ionicons name="close" size={24} color="#C07EFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Profile Image</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering title */}
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          Tap the image below to select a new profile picture from your camera or gallery.
        </Text>

        <TouchableOpacity onPress={handleImageSelection} style={styles.imageContainer} disabled={isUploading}>
          <Image
            source={profileImageUri ? { uri: profileImageUri } : require('../../assets/outfitaiIcon.png')}
            style={styles.profileImage}
            onError={(e) => {
              console.log("Image load error:", e.nativeEvent.error);
              setProfileImageUri(require('../../assets/outfitaiIcon.png'));
            }}
          />
          {isUploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.editIconContainer}>
              <Ionicons name="camera-reverse-outline" size={28} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0D2E', // Consistent with SettingsScreen
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#C07EFF',
    marginTop: 10, // Added margin for better spacing with ActivityIndicator
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15, // Adjust for status bar
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(192, 126, 255, 0.15)',
  },
  closeButtonContainer: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(192, 126, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  infoText: {
    color: '#AEAEB2',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 22,
  },
  imageContainer: {
    width: '95%',
    aspectRatio: 1,
    marginTop: 20,
    marginBottom: 25,
    borderRadius: 16,
    backgroundColor: 'rgba(44,27,74,0.6)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#332055'
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5,
  }
}); 