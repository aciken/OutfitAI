import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList, Modal
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage } from 'react-native-appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '@env';
import { BlurView } from 'expo-blur';

const IMAGE_MAX_DIMENSION = 512;
// const ITEM_IMAGE_SIZE = 100; // No longer explicitly needed here, defined in styles

export default function OutfitCreationPage() {
  const { user } = useGlobalContext();
  const router = useRouter();

  const [outfitItems, setOutfitItems] = useState([]);
  const [appwriteImage, setAppwriteImage] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);

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
        if (item.source?.uri) {
          try {
            const itemFileUri = await imageToPngBuffer(item.source.uri);
            formData.append('image[]', {
              uri: itemFileUri,
              name: `item_${i}.png`,
              type: 'image/png',
            });
          } catch (manipulationError) {
            console.error(`Error processing item image:`, manipulationError);
            setErrorMsg(`Failed to process item: ${item.label || 'Unknown'}.`);
          }
        }
      }

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Image edit failed.');

      if (json.data?.[0]?.b64_json) {
        setGeneratedImageUrl(`data:image/png;base64,${json.data[0].b64_json}`);
      } else if (json.data?.[0]?.url) {
        setGeneratedImageUrl(json.data[0].url);
      } else {
        throw new Error("No image data returned.");
      }
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
          <View style={styles.outfitImageContainer}>
            {isApplyingOutfit ? (
              <View style={styles.loadingOverlayContainer}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Crafting outfit...</Text>
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

            {errorMsg && !isApplyingOutfit && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
          </View>

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
                    {item.label && <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>}
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
          disabled={isApplyingOutfit || outfitItems.length === 0}
          style={[
            styles.continueButton,
            (isApplyingOutfit || outfitItems.length === 0) && styles.continueButtonDisabled
          ]}
        >
          <LinearGradient
            colors={(isApplyingOutfit || outfitItems.length === 0) ? ['#4A3B5E', '#5A4B6E'] : ['#8A2BE2', '#A020F0']}
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
    height: 130,
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
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    // Add glow effect to the icon
    shadowColor: '#C07EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  
  addItemLabel: {
    fontSize: 14,
    color: '#D8BFD8', // Lighter text color for better contrast against dark background
    textAlign: 'center',
    fontWeight: '600',
  },
  
  addedItemCard: {
    width: 100,
    height: 130,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(54,37,84,0.9)', // Slightly different background for added items
    borderWidth: 1,
    borderColor: 'rgba(192,126,255,0.35)',
    alignItems: 'center',
    padding: 8, // Adjusted padding
    position: 'relative',
  },
  itemImageInCard: { 
    width: '100%', 
    height: 75, // Adjusted height
    resizeMode: 'cover', // Changed to cover for better fill
    borderRadius: 6, // Rounded corners for the image itself
    marginBottom: 6,
  },
  itemLabel: { 
    fontSize: 11, 
    color: '#D8BFD8', // Lighter purple for label
    textAlign: 'center', 
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 2, // Adjusted for better placement
    right: 2, // Adjusted for better placement
    padding: 3,
    // backgroundColor: 'rgba(0,0,0,0.3)', // Optional subtle background for button
    // borderRadius: 11, 
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