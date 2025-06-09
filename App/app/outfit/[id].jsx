import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Platform, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage, ID } from 'react-native-appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '@env';
import axios from 'axios';

const IMAGE_MAX_DIMENSION = 512;

// Appwrite configuration for outfit items
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '682371f4001597e0b4a7';
const APPWRITE_OUTFIT_BUCKET_ID = '683ef4f30035c008b96e'; // For outfit items

// Helper function to get Appwrite image URL for outfit items
const getAppwriteItemImageUrl = (fileId) => {
  try {
    if (!fileId || fileId.trim() === '') {
      console.error('Error getting Appwrite item image URL: fileId is missing or empty');
      return null;
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    const storage = new Storage(client);
    
    // Use getFileDownload for outfit items
    const result = storage.getFileDownload(APPWRITE_OUTFIT_BUCKET_ID, fileId);
    console.log(`Generated Appwrite URL for item fileId ${fileId}:`, result.href);
    return result.href;
  } catch (error) {
    console.error('Error getting Appwrite item image URL:', error);
    return null;
  }
};

export default function OutfitDetailsPage() {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;

  const [appwriteImage, setAppwriteImage] = useState(null);
  const [displayImageUri, setDisplayImageUri] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isUploadingBaseImage, setIsUploadingBaseImage] = useState(false);
  
  // State for processed outfit items
  const [processedItems, setProcessedItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Parse items using useMemo to prevent infinite re-renders
  const items = useMemo(() => {
    try {
      if (params.items) {
        const parsed = JSON.parse(params.items);
        console.log('Parsed items from params:', parsed);
        return parsed;
      }
      return [];
    } catch (e) {
      console.error("Failed to parse items:", e);
      setErrorMsg("Failed to load outfit items.");
      return [];
    }
  }, [params.items]);

  // Process raw Appwrite file IDs into display-ready items
  useEffect(() => {
    const processOutfitItems = async () => {
      if (!items || items.length === 0) {
        console.log('No items to process');
        setProcessedItems([]);
        return;
      }

      console.log('Processing outfit items:', items);
      setIsLoadingItems(true);

      try {
        // Check if items are already processed (have source property) or are raw file IDs
        const isRawFileIds = typeof items[0] === 'string';
        
        if (isRawFileIds) {
          // Process raw Appwrite file IDs
          console.log('Processing raw Appwrite file IDs:', items);
          const processedItemsData = items.map((fileId, index) => {
            const imageUrl = getAppwriteItemImageUrl(fileId);
            return {
              id: fileId,
              source: imageUrl ? { uri: imageUrl } : null,
              label: `Item ${index + 1}`,
              name: `Item ${index + 1}`,
              category: 'Clothing'
            };
          }).filter(item => item.source !== null);
          
          console.log('Processed items from file IDs:', processedItemsData);
          setProcessedItems(processedItemsData);
        } else {
          // Items are already processed (from predefined outfits)
          console.log('Using pre-processed items:', items);
          setProcessedItems(items);
        }
      } catch (error) {
        console.error('Error processing outfit items:', error);
        setErrorMsg('Failed to load outfit items');
        setProcessedItems([]);
      } finally {
        setIsLoadingItems(false);
      }
    };

    processOutfitItems();
  }, [items]); // Now depends on the memoized items

  useEffect(() => {
    const loadOutfitImage = async () => {
      console.log("Loading outfit image for outfit ID:", params.id);
      let imageSetFromCreated = false;

      try {
        const storedUserString = await AsyncStorage.getItem('user');
        console.log("Stored user string:", storedUserString);
        
        if (storedUserString) {
          const parsedUser = JSON.parse(storedUserString);
          console.log("Parsed user:", parsedUser);
          console.log('params.id', params.id)
          if (parsedUser && parsedUser.createdImages && parsedUser.createdImages.length > 0 && params.id) {
            const matchingImages = parsedUser.createdImages.filter(img => img.outfitId === params.id);
            
            if (matchingImages.length > 0) {
              const foundImage = matchingImages[matchingImages.length - 1];
              console.log("Found image(s) in AsyncStorage, selecting the last one:", foundImage);
              
              if (foundImage && foundImage.imageId) {
                try {
                  const client = new Client()
                    .setEndpoint('https://fra.cloud.appwrite.io/v1')
                    .setProject('682371f4001597e0b4a7');
                  const storage = new Storage(client);
                  const result = storage.getFileDownload(
                    '6823720b001cdc257539', // Assuming same bucket ID
                    foundImage.imageId
                  );
                  setGeneratedImageUrl(result.href); // Display as the main generated/preview image
                  setDisplayImageUri(result.href);   // Also set this to ensure consistency
                  console.log("Loaded previously generated image for outfit from AsyncStorage user (last one):", result.href);
                  imageSetFromCreated = true;
                } catch (error) {
                  console.error("Error loading previously generated image from Appwrite (AsyncStorage user):", error);
                  setErrorMsg("Failed to load previous outfit image.");
                }
              }
            } else {
              console.log("No images found for outfit ID:", params.id, "in parsedUser.createdImages");
            }
          } else {
            console.log("Conditions not met to search for created images: ", {
              hasParsedUser: !!parsedUser,
              hasCreatedImages: parsedUser && !!parsedUser.createdImages,
              createdImagesLength: parsedUser && parsedUser.createdImages ? parsedUser.createdImages.length : 0,
              hasParamsId: !!params.id
            });
          }
        }
      } catch (e) {
        console.error("Error reading user from AsyncStorage in loadOutfitImage:", e);
        // Continue to fallback if AsyncStorage read fails
      }

      if (!imageSetFromCreated) {
        // Fallback to fetching the default user image if no specific outfit image was found/loaded
        fetchUserImage();
      }
    }

    const fetchUserImage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.fileId) {
            const client = new Client()
              .setEndpoint('https://fra.cloud.appwrite.io/v1')
              .setProject('682371f4001597e0b4a7');
            const storage = new Storage(client);
            const result = storage.getFileDownload(
              '6823720b001cdc257539',
              parsedUser.fileId,
            );
            setAppwriteImage(result);
            setDisplayImageUri(result.href);
            console.log(result);
          }
        }
      } catch (e) {
        console.error("Error reading user from AsyncStorage in fetchUserImage:", e);
        // Continue to fallback if AsyncStorage read fails
      }
    };

    loadOutfitImage();
  }, [user]);

  const handleChangeDisplayImage = async () => {
    Alert.alert(
      "Change Image",
      "Select new image source",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              uploadSelectedBaseImage(result.assets[0].uri, result.assets[0].mimeType);
            }
          }
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              uploadSelectedBaseImage(result.assets[0].uri, result.assets[0].mimeType);
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const uploadSelectedBaseImage = async (localUri, mimeType) => {
    setIsUploadingBaseImage(true);
    setDisplayImageUri(localUri); // Show local preview immediately

    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error("Selected file does not exist.");
      }

      const fileName = localUri.split('/').pop() || `user_base_${ID.unique()}.jpg`;
      const resolvedMimeType = mimeType || 'image/jpeg';

      const appwritePayload = {
        uri: localUri,
        name: fileName,
        type: resolvedMimeType,
        size: fileInfo.size,
      };
      
      const client = new Client() // Re-initialize client as it might not be in scope otherwise
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('682371f4001597e0b4a7');
      const storageInstance = new Storage(client); // Use a local instance

      const uploadedFile = await storageInstance.createFile(
        '6823720b001cdc257539', // BUCKET_ID for user images / temporary uploads
        ID.unique(),
        appwritePayload
      );
      
      const newRemoteUrl = storageInstance.getFileDownload('6823720b001cdc257539', uploadedFile.$id).href;
      setDisplayImageUri(newRemoteUrl); // Update to the remote URL

      // Optionally, if this newly uploaded image should become the user's *default* profile image,
      // you would call your backend here to update user.fileId, similar to changeProfileImage.jsx.
      // For now, it's just used for this session's outfit generation.
      // Example:
      // const storedUserString = await AsyncStorage.getItem('user');
      // const storedUser = JSON.parse(storedUserString);
      // if (storedUser && storedUser._id) {
      //   // await axios.put(`${USER_BACKEND_URL}/user/profileImage`, { userID: storedUser._id, newFileId: uploadedFile.$id });
      //   // Potentially update AsyncStorage and contextUser if backend confirms
      // }


    } catch (error) {
      console.error("Error uploading selected base image:", error);
      Alert.alert("Upload Error", "Failed to upload the selected image. Please try again.");
      // Optionally revert to a previous image or clear displayImageUri
      // For simplicity, we'll leave the local URI for now, but generation will likely fail if it reaches that stage.
    } finally {
      setIsUploadingBaseImage(false);
    }
  };

  const downloadImage = async (imageUrl) => {
    const localUri = FileSystem.cacheDirectory + `img_${Date.now()}.png`;
    const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
    return uri;
  };

  const imageToPngBuffer = async (inputImageUri) => {
    const manipulated = await ImageManipulator.manipulateAsync(
      inputImageUri,
      [{ resize: { width: IMAGE_MAX_DIMENSION, height: IMAGE_MAX_DIMENSION } }],
      { format: ImageManipulator.SaveFormat.PNG, compress: 0.7 }
    );
    return manipulated.uri;
  };

  const handleApplyOutfit = async () => {
    setIsApplyingOutfit(true);
    setGeneratedImageUrl(null);
    setErrorMsg(null);

    if (!OPENAI_API_KEY) {
      Alert.alert("Missing API Key", "Set OPENAI_API_KEY in your .env file.");
      setIsApplyingOutfit(false);
      return;
    }

    try {
      if (!displayImageUri) throw new Error("No user image available.");

      const userImageRemoteUrl = displayImageUri;
      const downloadedUserImageUri = await downloadImage(userImageRemoteUrl);
      const userImageFileUri = await imageToPngBuffer(downloadedUserImageUri);

      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', 'Dress the person in the main image using the provided outfit item images. Ensure the outfit looks natural and cohesive. Full body of the person must be visible. Without making the person look weird or deformed, make the person look good in the outfit, without making even a slight change in the persons face, reapat you CANT MAKE ANY CHANGES TO THE FACE IT NEEDS TO LOOK EXACTLY LIKE IN THE PHOTO, same with the new clothes that person wears. If persons full body is not visible, change the position of the person in the image so that the full body is visible.');
      formData.append('size', '1024x1024');
      formData.append('n', '1');
      formData.append('quality', 'medium');
      formData.append('image[]', {
        uri: userImageFileUri,
        name: 'user.png',
        type: 'image/png',
      });

      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        let imageUriToProcess = null;

        if (typeof item.source === 'number') {
          const resolvedAsset = Image.resolveAssetSource(item.source);
          if (resolvedAsset?.uri) {
            imageUriToProcess = resolvedAsset.uri;
            console.log(`Processing bundled item image (ID: ${item.source}): ${imageUriToProcess}`);
          } else {
            console.warn(`Could not resolve asset URI for item source: ${item.source}`);
            continue;
          }
        } else if (item.source?.uri) {
          console.log("Processing item image from direct URI:", item.source.uri);
          imageUriToProcess = item.source.uri;
        } else {
          console.warn("Invalid or unsupported item source:", item.source);
          continue;
        }

        if (imageUriToProcess) {
          try {
            const itemFileUri = await imageToPngBuffer(imageUriToProcess);
            formData.append('image[]', {
              uri: itemFileUri,
              name: `item_${i}.png`,
              type: 'image/png',
            });
          } catch (manipulationError) {
            console.error(`Error processing item image (Source: ${JSON.stringify(item.source)}):`, manipulationError);
            setErrorMsg(`Failed to process item image: ${item.label || 'Unknown item'}.`);
          }
        }
      }

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || 'Image edit failed');
      }

      let finalGeneratedImageUrl;
      let isBase64 = false;

      if (json.data?.[0]?.b64_json) {
        const base64Image = json.data[0].b64_json;
        finalGeneratedImageUrl = `data:image/png;base64,${base64Image}`;
        isBase64 = true;
        setGeneratedImageUrl(finalGeneratedImageUrl);
      } else if (json.data?.[0]?.url) {
        finalGeneratedImageUrl = json.data[0].url;
        setGeneratedImageUrl(finalGeneratedImageUrl);
      } else {
        throw new Error("No image data returned.");
      }

      // ---- Appwrite Upload and Backend Call START ----
      if (finalGeneratedImageUrl) {
        let imageFileUriForAppwrite;
        let imageFileSize;

        if (isBase64) {
          const base64Code = finalGeneratedImageUrl.split("data:image/png;base64,")[1];
          const tempFilename = FileSystem.cacheDirectory + `${ID.unique()}.png`;
          await FileSystem.writeAsStringAsync(tempFilename, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imageFileUriForAppwrite = tempFilename;
          const fileInfo = await FileSystem.getInfoAsync(tempFilename);
          if (!fileInfo.exists) {
            throw new Error("Failed to create temporary file for upload.");
          }
          imageFileSize = fileInfo.size;
        } else { // It's a URL
          const downloadedUri = await downloadImage(finalGeneratedImageUrl);
          imageFileUriForAppwrite = downloadedUri;
          const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
          if (!fileInfo.exists) {
            throw new Error("Failed to download image for upload.");
          }
          imageFileSize = fileInfo.size;
        }

        const client = new Client()
          .setEndpoint('https://fra.cloud.appwrite.io/v1')
          .setProject('682371f4001597e0b4a7');
        const storage = new Storage(client);

        const appwritePayload = {
            uri: imageFileUriForAppwrite,
            name: `${ID.unique()}.png`,
            type: 'image/png',
            size: imageFileSize,
        };

        console.log("Attempting to upload to Appwrite:", appwritePayload);

        storage.createFile(
          '6823720b001cdc257539', // BUCKET_ID
          ID.unique(), // FILE_ID
          appwritePayload
        ).then(async function (response) {
          const imageID = response.$id;

          if (!user || !user._id) {

            try {
              const storedUser = await AsyncStorage.getItem('user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser._id) {
                   const userID = parsedUser._id;
                   const outfitId = params.id; // id from useLocalSearchParams
                   
                   axios.put('https://18c9-109-245-204-138.ngrok-free.app/createdImage', {
                       userID, imageID, outfitId
                   })
                   .then(backendResponse => {
                    AsyncStorage.setItem('user', JSON.stringify(backendResponse.data));
                    setUser(backendResponse.data);
                   })
                   .catch(backendError => {
                       console.log("Backend update error (fallback user ID):", backendError.response ? backendError.response.data : backendError.message);
                       console.log(backendError);
                       Alert.alert("Error", "Failed to save outfit data to backend.");
                   });
                   return; // Exit after attempting with fallback
                }
              }
            } catch (e) {
              console.error("Error fetching user from AsyncStorage for fallback:", e);
            }
            // If fallback also fails or user._id wasn't there initially
            Alert.alert("Error", "Critical: User ID not found. Cannot save image details.");
            return;
          }
          
          const userID = user._id;
          const outfitId = params.id; // id from useLocalSearchParams

          console.log("Sending data to backend:", { userID, imageID, outfitId });

          axios.put('https://18c9-109-245-204-138.ngrok-free.app/createdImage', {
            userID,
            imageID,
            outfitId
          })
          .then(backendResponse => {
            console.log("Backend update success:", backendResponse.data);
            Alert.alert("Success", "Outfit image saved!");
            AsyncStorage.setItem('user', JSON.stringify(backendResponse.data));
            setUser(backendResponse.data);
          })
          .catch(backendError => {
            console.log("Backend update error:", backendError.response ? backendError.response.data : backendError.message);
            console.log(backendError); // As per user's preferred logging
            Alert.alert("Error", "Failed to save outfit data to backend.");
          });

        }).catch(function (appwriteError) {
          console.log("Appwrite upload error (detailed):", appwriteError);
          console.log(appwriteError); // As per user's preferred logging
          Alert.alert("Upload Error", `Failed to upload generated image: ${appwriteError.message}`);
        });
      }
      // ---- Appwrite Upload and Backend Call END ----

    } catch (error) {
      console.error("Apply outfit error:", error);
      setErrorMsg(error.message);
      Alert.alert("Error", error.message);
    } finally {
      setIsApplyingOutfit(false);
    }
  };

  return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor="#1A0D2E" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={32} color="#C07EFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity onPress={handleChangeDisplayImage} activeOpacity={0.8} disabled={isApplyingOutfit || isUploadingBaseImage}>
            <View style={styles.outfitImageContainer}>
              {isApplyingOutfit || isUploadingBaseImage ? (
                <View style={styles.loadingOverlayContainer}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.loadingText}>{isApplyingOutfit ? 'Crafting outfit...' : 'Preparing image...'}</Text>
                </View>
              ) : displayImageUri ? (
                <Image source={{ uri: displayImageUri }} style={styles.outfitImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={60} color="#888" />
                  <Text style={styles.placeholderText}>Your outfit preview will appear here.</Text>
                </View>
              )}

              {errorMsg && !isApplyingOutfit && !isUploadingBaseImage && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {processedItems.length > 0 && (
            <View style={styles.itemsSectionContainer}>
              <Text style={styles.itemsTitle}>Outfit Items</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {processedItems.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <Image source={item.source} style={styles.itemImageInCard} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          onPress={handleApplyOutfit}
          disabled={isApplyingOutfit || isUploadingBaseImage || !displayImageUri}
          style={[styles.continueButton, (isApplyingOutfit || isUploadingBaseImage) && styles.continueButtonDisabled]}
        >
          <LinearGradient
            colors={(isApplyingOutfit || isUploadingBaseImage) ? ['#4A3B5E', '#5A4B6E'] : ['#8A2BE2', '#A020F0']}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {generatedImageUrl ? 'Regenerate Outfit' : 'Apply Outfit with AI'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A0D2E' },
  headerContainer: {
    height: 60, justifyContent: 'flex-end', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 15, backgroundColor: '#1A0D2E',
  },
  closeButton: { padding: 5 },
  scrollContainer: { paddingBottom: 100, alignItems: 'center' },
  outfitImageContainer: {
    width: '95%', aspectRatio: 1, marginTop: 20, marginBottom: 25, borderRadius: 16,
    backgroundColor: 'rgba(44,27,74,0.6)',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  outfitImage: { width: '100%', height: '100%' },
  loadingOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: '#FFF', marginTop: 10 },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { color: '#B0B0B0', marginTop: 10 },
  errorOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.85)',
    padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  errorText: { color: '#FFF', marginLeft: 8 },
  itemsSectionContainer: { width: '95%', marginBottom: 20 },
  itemsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#E0E0E0' },
  itemCard: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(44,27,74,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(192,126,255,0.25)',
  },
  itemImageInCard: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  continueButton: {
    position: 'absolute', bottom: 30, left: '5%', right: '5%',
    borderRadius: 30, overflow: 'hidden', elevation: 6,
  },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonGradient: {
    width: '100%', paddingVertical: 16, alignItems: 'center', justifyContent: 'center'
  },
  continueButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
