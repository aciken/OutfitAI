import React, { useState, useEffect } from 'react';
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
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '@env';
import axios from 'axios';

const IMAGE_MAX_DIMENSION = 512;

export default function OutfitDetailsPage() {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  let items = [];

  const [appwriteImage, setAppwriteImage] = useState(null);
  const [displayImageUri, setDisplayImageUri] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const flingGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => router.back());

  try {
    if (params.items) items = JSON.parse(params.items);
  } catch (e) {
    console.error("Failed to parse items:", e);
    setErrorMsg("Failed to load outfit items.");
  }

  useEffect(() => {
    const loadOutfitImage = async () => {
      console.log("Loading outfit image for outfit ID:", params.id);
      let imageSetFromCreated = false;
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const parsedUser = JSON.parse(storedUserString);
          console.log("Parsed user:", parsedUser);
          console.log('params.id', params.id)
          console.log(parsedUser, parsedUser.createdImages, parsedUser.createdImages > 0, params.id)
          if (parsedUser && parsedUser.createdImages && parsedUser.createdImages.length > 0 && params.id) {
            const foundImage = parsedUser.createdImages.find(img => img.outfitId === params.id);
            if (foundImage && foundImage.imageId) {
              console.log("Found image in AsyncStorage:", foundImage);
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
                console.log("Loaded previously generated image for outfit from AsyncStorage user:", result.href);
                imageSetFromCreated = true;
              } catch (error) {
                console.error("Error loading previously generated image from Appwrite (AsyncStorage user):", error);
                setErrorMsg("Failed to load previous outfit image.");
              }
            }
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
    };

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
      } catch (error) {
        console.error("Error loading image:", error);
        setErrorMsg("Failed to load image.");
      }
    };

    loadOutfitImage(); // Call the new orchestrating function

    (async () => {
      if (Platform.OS !== 'web') {
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus.status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera roll access is needed to select images.');
        }
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is needed to take photos.');
        }
      }
    })();
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
              setDisplayImageUri(result.assets[0].uri);
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
              setDisplayImageUri(result.assets[0].uri);
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
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
      formData.append('prompt', 'Dress the person in the main image using the provided outfit item images. Ensure the outfit looks natural and cohesive. Full body of the person must be visible. Without making the person look weird or deformed, make the person look good in the outfit, without making even a slight change in the persons face, reapat you CANT MAKE ANY CHANGES TO THE FACE IT NEEDS TO LOOK EXACTLY LIKE IN THE PHOTO, same with the new clothes that person wears.');
      formData.append('size', '1024x1024');
      formData.append('n', '1');
      formData.append('quality', 'high');
      formData.append('image[]', {
        uri: userImageFileUri,
        name: 'user.png',
        type: 'image/png',
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
                   
                   axios.put('https://a4ec-109-245-193-150.ngrok-free.app/createdImage', {
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

          axios.put('https://a4ec-109-245-193-150.ngrok-free.app/createdImage', {
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
    <GestureDetector gesture={flingGesture}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor="#1A0D2E" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={32} color="#C07EFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity onPress={handleChangeDisplayImage} activeOpacity={0.8}>
            <View style={styles.outfitImageContainer}>
              {isApplyingOutfit ? (
                <View style={styles.loadingOverlayContainer}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.loadingText}>Crafting outfit...</Text>
                </View>
              ) : displayImageUri ? (
                <Image source={{ uri: displayImageUri }} style={styles.outfitImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={60} color="#888" />
                  <Text style={styles.placeholderText}>Your outfit preview will appear here.</Text>
                </View>
              )}

              {errorMsg && !isApplyingOutfit && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {items.length > 0 && (
            <View style={styles.itemsSectionContainer}>
              <Text style={styles.itemsTitle}>Outfit Items</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {items.map((item, index) => (
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
          disabled={isApplyingOutfit}
          style={[styles.continueButton, isApplyingOutfit && styles.continueButtonDisabled]}
        >
          <LinearGradient
            colors={isApplyingOutfit ? ['#4A3B5E', '#5A4B6E'] : ['#8A2BE2', '#A020F0']}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {generatedImageUrl ? 'Regenerate Outfit' : 'Apply Outfit with AI'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </GestureDetector>
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
