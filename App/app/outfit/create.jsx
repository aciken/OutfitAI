import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList
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

const IMAGE_MAX_DIMENSION = 512;
const ITEM_IMAGE_SIZE = 100; // Consistent with [id].jsx item card image size

export default function OutfitCreationPage() {
  const { user } = useGlobalContext();
  const router = useRouter();

  const [outfitItems, setOutfitItems] = useState([]);
  const [appwriteImage, setAppwriteImage] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

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
          Alert.alert('Permission Denied', 'Camera roll access is needed.');
        }
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is needed.');
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
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Optional haptics
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newItem = { 
        id: Date.now().toString(), 
        source: { uri: result.assets[0].uri },
        label: `Item ${outfitItems.length + 1}`
      };
      setOutfitItems(prevItems => [...prevItems, newItem]);
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
    <View style={styles.itemCardContainer}> 
      <View style={styles.itemCard}>
        <Image source={item.source} style={styles.itemImageInCard} />
        {item.label && <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.itemRemoveButton}>
          <Ionicons name="trash-bin-outline" size={20} color="#FF6B6B" />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {outfitItems.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <Image source={item.source} style={styles.itemImageInCard} />
                  {item.label && <Text style={styles.itemLabel}>{item.label}</Text>}
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Ionicons name="close" size={15} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.itemCard}
                onPress={() => Alert.alert(
                  "Add Item", 
                  "Select image source",
                  [
                    { text: "Take Photo", onPress: () => handlePickImage(true) },
                    { text: "Choose from Library", onPress: () => handlePickImage(false) },
                    { text: "Cancel", style: "cancel" }
                  ]
                )}
              >
                <View style={styles.plusIconContainer}>
                  <Ionicons name="add" size={40} color="#C07EFF" />
                </View>
                <Text style={styles.itemLabel}>Add Item</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>

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
  itemCard: {
    width: 100, height: 130, borderRadius: 10, marginRight: 12,
    backgroundColor: 'rgba(44,27,74,0.8)',
    alignItems: 'center', padding: 5,
    borderWidth: 1, borderColor: 'rgba(192,126,255,0.25)',
    position: 'relative', // for the remove button positioning
  },
  itemImageInCard: { width: '100%', height: 80, resizeMode: 'contain' },
  itemLabel: { fontSize: 11, color: '#E0E0E0', textAlign: 'center', marginTop: 5 },
  itemRemoveButton: {
    marginTop: 5,
    backgroundColor: 'rgba(44, 27, 74, 0.8)',
    borderRadius: 15,
    padding: 4,
    zIndex: 1,
  },
  removeButton: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: 'rgba(44,27,74,0.8)',
    borderRadius: 10, padding: 2,
    borderWidth: 1, borderColor: 'rgba(192,126,255,0.25)',
  },
  plusIconContainer: {
    width: '100%', height: 80, justifyContent: 'center', 
    alignItems: 'center', marginBottom: 6
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