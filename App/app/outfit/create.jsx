import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList, Modal
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
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
import { BlurView } from 'expo-blur';
import axios from 'axios';

const IMAGE_MAX_DIMENSION = 512;
// const ITEM_IMAGE_SIZE = 100; // No longer explicitly needed here, defined in styles

export default function OutfitCreationPage() {
  const { user, selectedOutfitItem, clearSelectedOutfitItem, setUser } = useGlobalContext();
  const router = useRouter();

  const [outfitItems, setOutfitItems] = useState([]);
  const [appwriteImage, setAppwriteImage] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);
  const [isUploadingBaseImage, setIsUploadingBaseImage] = useState(false);

  const flingGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => router.back());

  useEffect(() => {
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
          } else {
             setErrorMsg("No main user image set. Please set one in your profile.");
          }
        }
      } catch (error) {
        console.error("Error loading user image:", error);
        setErrorMsg("Failed to load main user image.");
      }
    };
    fetchUserImage();

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
  }, []);

  // Listen for selected items from global context
  useEffect(() => {
    if (selectedOutfitItem) {
      setOutfitItems(prevItems => {
        // Check if item already exists to avoid duplicates
        const itemExists = prevItems.some(item => 
          item.label === selectedOutfitItem.label && item.isAsset === selectedOutfitItem.isAsset
        );
        if (!itemExists) {
          return [...prevItems, selectedOutfitItem];
        }
        return prevItems;
      });
      // Clear the selected item from global context
      clearSelectedOutfitItem();
    }
  }, [selectedOutfitItem, clearSelectedOutfitItem]);

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
  
  const handlePickImage = async (fromCamera = false) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    try {
      if (fromCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItem = { 
          id: Date.now().toString(), 
          source: { uri: result.assets[0].uri },
          label: `Item ${outfitItems.length + 1}` // Simple label for now
        };
        setOutfitItems(prevItems => [...prevItems, newItem]);
      }
    } catch (permissionError) {
      Alert.alert("Permission Error", "Please ensure you have granted camera and media library permissions in your device settings.")
      console.error("Image picker permission error:", permissionError);
    }
  };
  
  const handleRemoveItem = (itemId) => {
    setOutfitItems(prevItems => prevItems.filter(item => item.id !== itemId));
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
      if (!appwriteImage?.href) throw new Error("No user image for applying the outfit.");

      const userImageRemoteUrl = appwriteImage.href;
      const downloadedUserImageUri = await downloadImage(userImageRemoteUrl);
      const userImageFileUri = await imageToPngBuffer(downloadedUserImageUri);

      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', 'Dress the person in the main image using the provided outfit item images. Ensure the outfit looks natural and cohesive. Full body of the person must be visible. Without making the person look weird or deformed, make the person look good in the outfit, without making even a slight change in the persons face, reapat you CANT MAKE ANY CHANGES TO THE FACE IT NEEDS TO LOOK EXACTLY LIKE IN THE PHOTO, same with the new clothes that person wears.');
      formData.append('size', '1024x1024');
      formData.append('n', '1');
      formData.append('quality', 'medium');
      formData.append('image[]', {
        uri: userImageFileUri,
        name: 'user.png',
        type: 'image/png',
      });

      for (let i = 0; i < outfitItems.length; i++) {
        const item = outfitItems[i];
        try {
          let itemFileUri;
          
          console.log(`Processing item ${i}:`, { 
            label: item.label, 
            isAsset: item.isAsset,
            sourceType: typeof item.source,
            hasUri: !!item.source?.uri 
          });
          
          // Handle asset items (from app assets) vs camera/gallery items
          if (item.source?.uri) {
            // Camera/gallery item - has uri
            console.log(`Item ${i}: Processing as camera/gallery item`);
            itemFileUri = await imageToPngBuffer(item.source.uri);
          } else if (item.source && typeof item.source === 'number') {
            // Asset item - source is a require() call (number)
            console.log(`Item ${i}: Processing as asset item (require)`);
            try {
              const assetUri = Image.resolveAssetSource(item.source).uri;
              console.log(`Item ${i}: Resolved asset URI:`, assetUri);
              if (assetUri) {
                // Download the asset to a local file so we can process it
                const localAssetUri = await downloadImage(assetUri);
                console.log(`Item ${i}: Downloaded to local URI:`, localAssetUri);
                itemFileUri = await imageToPngBuffer(localAssetUri);
              } else {
                throw new Error(`Could not resolve asset for item: ${item.label || 'Unknown'}`);
              }
            } catch (assetError) {
              console.error(`Error resolving asset for item ${i}:`, assetError);
              throw assetError;
            }
          } else if (item.isAsset && item.source && typeof item.source === 'object') {
            // Handle case where asset might be an object but still from require()
            console.log(`Item ${i}: Processing as asset object`);
            try {
              const assetUri = Image.resolveAssetSource(item.source).uri;
              console.log(`Item ${i}: Resolved asset object URI:`, assetUri);
              if (assetUri) {
                const localAssetUri = await downloadImage(assetUri);
                itemFileUri = await imageToPngBuffer(localAssetUri);
              } else {
                throw new Error(`Could not resolve asset object for item: ${item.label || 'Unknown'}`);
              }
            } catch (assetObjError) {
              console.error(`Error resolving asset object for item ${i}:`, assetObjError);
              throw assetObjError;
            }
          } else if (item.source && item.source.uri) {
            // Handle case where source might be { uri: ... } but uri is asset
            console.log(`Item ${i}: Processing as source with uri`);
            itemFileUri = await imageToPngBuffer(item.source.uri);
          } else {
            console.error(`Item ${i}: Invalid source format`, item.source);
            throw new Error(`Invalid source format for item: ${item.label || 'Unknown'}`);
          }
          
          if (itemFileUri) {
            console.log(`Item ${i}: Successfully processed, adding to form data`);
            formData.append('image[]', {
              uri: itemFileUri,
              name: `item_${i}.png`,
              type: 'image/png',
            });
          }
        } catch (manipulationError) {
          console.error(`Error processing item image:`, manipulationError);
          setErrorMsg(`Failed to process item: ${item.label || 'Unknown'}.`);
        }
      }

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Image edit failed.');

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
                   const outfitId = 'custom'; // Use 'custom' for created outfits
                   
                   axios.put('https://18c9-109-245-204-138.ngrok-free.app/createdImage', {
                       userID, imageID, outfitId
                   })
                   .then(backendResponse => {
                    AsyncStorage.setItem('user', JSON.stringify(backendResponse.data));
                    setUser(backendResponse.data);
                    Alert.alert("Success", "Custom outfit saved!");
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
          const outfitId = 'custom'; // Use 'custom' for created outfits

          console.log("Sending data to backend:", { userID, imageID, outfitId });

          axios.put('https://18c9-109-245-204-138.ngrok-free.app/createdImage', {
            userID,
            imageID,
            outfitId
          })
          .then(backendResponse => {
            console.log("Backend update success:", backendResponse.data);
            Alert.alert("Success", "Custom outfit saved!");
            AsyncStorage.setItem('user', JSON.stringify(backendResponse.data));
            setUser(backendResponse.data);
          })
          .catch(backendError => {
            console.log("Backend update error:", backendError.response ? backendError.response.data : backendError.message);
            console.log(backendError);
            Alert.alert("Error", "Failed to save outfit data to backend.");
          });

        }).catch(function (appwriteError) {
          console.log("Appwrite upload error (detailed):", appwriteError);
          console.log(appwriteError);
          Alert.alert("Upload Error", `Failed to upload generated image: ${appwriteError.message}`);
        });
      }
      // ---- Appwrite Upload and Backend Call END ----

    } catch (error) {
      console.error("Apply outfit error:", error);
      setErrorMsg(error.message);
      Alert.alert("Error Applying Outfit", error.message);
    } finally {
      setIsApplyingOutfit(false);
    }
  };
  
  const renderOutfitItem = ({ item, index }) => (
    <View style={styles.addedItemCard}>
      <Image source={item.source} style={styles.itemImageInCard} />
      {item.label && <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>}
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
          <Ionicons name="close-circle" size={22} color="#FF7F7F" />
      </TouchableOpacity>
    </View>
  );

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
    setAppwriteImage({ href: localUri }); // Show local preview immediately

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
      
      const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('682371f4001597e0b4a7');
      const storage = new Storage(client);

      const uploadedFile = await storage.createFile(
        '6823720b001cdc257539',
        ID.unique(),
        appwritePayload
      );
      
      const newRemoteUrl = storage.getFileDownload('6823720b001cdc257539', uploadedFile.$id).href;
      setAppwriteImage({ href: newRemoteUrl });

    } catch (error) {
      console.error("Error uploading selected base image:", error);
      Alert.alert("Upload Error", "Failed to upload the selected image. Please try again.");
    } finally {
      setIsUploadingBaseImage(false);
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
          <TouchableOpacity onPress={handleChangeDisplayImage} activeOpacity={0.8} disabled={isApplyingOutfit || isUploadingBaseImage}>
            <View style={styles.outfitImageContainer}>
              {isApplyingOutfit || isUploadingBaseImage ? (
                <View style={styles.loadingOverlayContainer}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.loadingText}>{isApplyingOutfit ? 'Crafting outfit...' : 'Preparing image...'}</Text>
                </View>
              ) : generatedImageUrl ? (
                <Image source={{ uri: generatedImageUrl }} style={styles.outfitImage} />
              ) : appwriteImage?.href ? (
                <Image source={{ uri: appwriteImage.href }} style={styles.outfitImage} />
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

          <View style={styles.itemsSectionContainer}>
            <Text style={styles.itemsTitle}>Outfit Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsScrollContent}>
              {/* Add Item Card - always first */}
              <TouchableOpacity
                style={styles.addItemCard}
                onPress={() => setIsAddItemModalVisible(true)}
              >
                <LinearGradient
                  colors={['rgba(38,23,64,0.95)', 'rgba(26,13,46,0.98)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.addItemGradient}
                >
                  <View style={styles.plusIconContainer}>
                    <Ionicons name="add-circle" size={50} color="#C07EFF" />
                  </View>
                  <Text style={styles.addItemLabel}>Add Item</Text>
                </LinearGradient>
              </TouchableOpacity>

              {outfitItems.map((item, index) => (
                 <View key={item.id} style={styles.addedItemCard}>
                    <Image source={item.source} style={styles.itemImageInCard} />
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
                        <Ionicons name="close-circle" size={22} color="#FF7F7F" />
                    </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Add Item Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isAddItemModalVisible}
          onRequestClose={() => setIsAddItemModalVisible(false)}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="dark" style={styles.modalBlurOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setIsAddItemModalVisible(false);
                  Alert.alert(
                    "Add Your Photo",
                    "Select image source",
                    [
                      { text: "Take Photo", onPress: () => handlePickImage(true) },
                      { text: "Choose from Library", onPress: () => handlePickImage(false) },
                      { text: "Cancel", style: "cancel" }
                    ]
                  );
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#C07EFF" style={styles.modalOptionIcon} />
                <Text style={styles.modalOptionText}>Take or Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setIsAddItemModalVisible(false);
                  router.push('/modal/OutfitItemAdd'); 
                }}
              >
                <Ionicons name="folder-open-outline" size={24} color="#C07EFF" style={styles.modalOptionIcon} />
                <Text style={styles.modalOptionText}>Choose from App Assets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsAddItemModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>

        <TouchableOpacity
          onPress={handleApplyOutfit}
          disabled={isApplyingOutfit || outfitItems.length === 0 || isUploadingBaseImage}
          style={[
            styles.continueButton,
            (isApplyingOutfit || outfitItems.length === 0 || isUploadingBaseImage) && styles.continueButtonDisabled
          ]}
        >
          <LinearGradient
            colors={(isApplyingOutfit || outfitItems.length === 0 || isUploadingBaseImage) ? ['#4A3B5E', '#5A4B6E'] : ['#8A2BE2', '#A020F0']}
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
  itemsScrollContent: { paddingRight: 12 }, // Ensure last item has some spacing
  
  addItemCard: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  
  addItemGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderWidth: 1.5,
    borderColor: '#8A2BE2',
    borderRadius: 10,
  },
  
  plusIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#C07EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  
  addItemLabel: {
    fontSize: 12,
    color: '#D8BFD8',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  addedItemCard: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(44,27,74,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(192,126,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  itemImageInCard: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 6,
  },
  itemLabel: { 
    fontSize: 11, 
    color: '#D8BFD8',
    textAlign: 'center', 
    fontWeight: '500',
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    padding: 3,
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
  // Styles for Modal
  modalBlurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%', // Slightly wider
    maxWidth: 400, // Max width for larger screens
    backgroundColor: '#311B4E', // New background color - a deeper purple
    borderRadius: 20, // More rounded corners
    padding: 20, // Adjusted padding
    alignItems: 'stretch', // Stretch children to fill width (e.g., buttons)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 }, // Adjusted shadow
    shadowOpacity: 0.4, // Increased shadow opacity
    shadowRadius: 12, // Softer shadow
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.3)', // Softer border color
  },
  modalTitle: {
    fontSize: 24, // Larger title
    fontWeight: 'bold',
    color: '#EAE0FF', // Brighter title text
    marginBottom: 30, // More space below title
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 58, 105, 0.9)', // Slightly adjusted button background
    paddingVertical: 18, // Taller buttons
    paddingHorizontal: 20,
    borderRadius: 12, // More rounded buttons
    marginBottom: 18, // More space between buttons
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.25)',
  },
  modalOptionIcon: {
    marginRight: 18, // More space for icon
    color: '#D0A0FF', // Icon color adjusted
  },
  modalOptionText: {
    fontSize: 17, // Slightly larger text
    color: '#EAE0FF', // Brighter option text
    fontWeight: '500',
  },
  modalCancelButton: {
    marginTop: 15, // More space above cancel
    paddingVertical: 15, // Adjusted padding
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(50, 30, 75, 0.7)', // Adjusted cancel button background
    alignSelf: 'center', // Center the cancel button
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#D0A0FF', // Adjusted text color
    fontWeight: '600',
  },
}); 