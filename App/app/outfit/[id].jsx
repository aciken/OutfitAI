import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage } from 'react-native-appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';

const IMAGE_MAX_DIMENSION = 512; // Max dimension for processing and output

export default function OutfitDetailsPage() {
  const { user } = useGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  let items = [];

  const [appwriteImage, setAppwriteImage] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const flingGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      router.back();
    });

  try {
    if (params.items) {
      items = JSON.parse(params.items);
    }
  } catch (e) {
    console.error("Failed to parse items for outfit details:", e);
    setErrorMsg("Failed to load outfit items.");
  }

  useEffect(() => {
    const fetchUserAndImage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.fileId) {
            const client = new Client()
              .setEndpoint('https://fra.cloud.appwrite.io/v1')
              .setProject('682371f4001597e0b4a7');
            const storage = new Storage(client);
            const result = storage.getFileDownload(
                '6823720b001cdc257539',
                parsedUser.fileId,
            );
            setAppwriteImage(result);
            console.log("Appwrite image preview URL object:", result);
          } else {
            console.log("fileId not found in stored user data.");
          }
        } else {
          console.log("No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage or getting image preview:", error);
        setErrorMsg("Failed to load user image.");
      }
    };
    fetchUserAndImage();
  }, []);

  const downloadImage = async (imageUrl) => {
    try {
      const localUri = FileSystem.cacheDirectory + `temp_image_${Date.now()}.png`;
      console.log(`Downloading ${imageUrl} to ${localUri}`);
      const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
      return uri;
    } catch (e) {
      console.error("Failed to download image:", imageUrl, e);
      throw new Error(`Failed to download image: ${imageUrl}`);
    }
  };

  const imageToPngBuffer = async (source) => {
    let localUri;
    if (typeof source === 'number') {
      const asset = Image.resolveAssetSource(source);
      if (!asset || !asset.uri) {
        throw new Error(`Could not resolve asset for source: ${source}`);
      }
      localUri = await downloadImage(asset.uri);
    } else if (source && source.uri) {
      localUri = await downloadImage(source.uri);
    } else {
      throw new Error('Invalid image source provided');
    }

    console.log(`Manipulating image: ${localUri}`);
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: IMAGE_MAX_DIMENSION, height: IMAGE_MAX_DIMENSION } }],
      { format: ImageManipulator.SaveFormat.PNG, compress: 0.7 } // Keep it as PNG, no base64 needed here
    );
    console.log(`Image manipulated. URI: ${manipResult.uri}`);
    return manipResult.uri; // Return the URI of the manipulated file
  };

  const handleApplyOutfit = async () => {
    setIsApplyingOutfit(true);
    setGeneratedImageUrl(null);
    setErrorMsg(null);
    console.log("handleApplyOutfit started - USING FETCH AND FORMDATA");

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      Alert.alert("Configuration Error", "OpenAI API key is not set. Please configure it in your .env file.");
      setIsApplyingOutfit(false);
      return;
    }

    try {
      if (!appwriteImage || !appwriteImage.href) {
        throw new Error("User image not available.");
      }
      console.log("Processing user image:", appwriteImage.href);
      const manipulatedImageUri = await imageToPngBuffer({ uri: appwriteImage.href });
      console.log("User image processed. Manipulated URI:", manipulatedImageUri);

      const formData = new FormData();
      formData.append('image', {
        uri: manipulatedImageUri,
        name: 'image.png',
        type: 'image/png',
      });

      // Process and append outfit item images
      if (items && items.length > 0) {
        console.log(`Processing and appending ${items.length} outfit items to FormData...`);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.source) {
            try {
              console.log(`Processing item image ${i} from source:`, item.source);
              const manipulatedItemImageUri = await imageToPngBuffer(item.source); // Use existing imageToPngBuffer
              formData.append(`image`, { 
                uri: manipulatedItemImageUri,
                name: `item_${i}.png`,
                type: 'image/png',
              });
              console.log(`Appended item_image_${i} to FormData with URI: ${manipulatedItemImageUri}`);
            } catch (itemError) {
              console.error(`Failed to process and append item image ${i}:`, itemError.message, "Source was:", item.source);
            }
          } else {
            console.log(`Skipping item image ${i} due to missing source.`);
          }
        }
      } else {
        console.log("No outfit items to process for FormData.");
      }

      const dynamicPrompt = "Dress the person in the main image using the provided outfit item images. Ensure the outfit looks natural and cohesive.";
      console.log("Using dynamic prompt for FormData:", dynamicPrompt);
      formData.append('prompt', dynamicPrompt);
      formData.append('model', "gpt-image-1");
      formData.append('n', 1);

      console.log("Calling OpenAI API via fetch with FormData (model: gpt-image-1, no response_format)...");

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          // 'Content-Type': 'multipart/form-data' // fetch automatically sets this with FormData
        },
        body: formData,
      });

      console.log("OpenAI API response status:", response.status);
      const responseData = await response.json();

      if (!response.ok) {
        console.error("OpenAI API Error Full Response:", JSON.stringify(responseData, null, 2));
        throw new Error(responseData.error?.message || `API request failed with status ${response.status}`);
      }
      
      console.log("OpenAI API response data received. Full response:", JSON.stringify(responseData, null, 2));

      if (responseData.data && responseData.data[0] && responseData.data[0].b64_json) {
        const base64Image = responseData.data[0].b64_json;
        const newImageUrl = `data:image/png;base64,${base64Image}`;
        console.log("Generated base64 image data. Attempting to set new image URL:", newImageUrl.substring(0, 100) + "..."); // Log a snippet
        setGeneratedImageUrl(newImageUrl);
        console.log("Generated image set from b64_json.");
      } else if (responseData.data && responseData.data[0] && responseData.data[0].url) {
        const newImageUrl = responseData.data[0].url;
        console.log("Generated image URL received:", newImageUrl);
        console.log("Attempting to set new image URL:", newImageUrl);
        setGeneratedImageUrl(newImageUrl); // If API returns URL
        console.log("Generated image set from URL.");
      } else {
        console.error("Invalid response format from OpenAI. No b64_json or url found in data[0]:", JSON.stringify(responseData, null, 2));
        throw new Error('Invalid response format from OpenAI. No image data or URL found.');
      }
    } catch (error) {
      console.error('Error applying outfit with OpenAI (fetch):', error);
      let errorMessage = error.message;
      // No error.response or error.request for fetch errors in the same way as axios/openai client
      setErrorMsg(`OpenAI Error (fetch): ${errorMessage}`);
      Alert.alert(
        'Image Generation Failed (Fetch)',
        `Could not generate outfit image. ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsApplyingOutfit(false);
      console.log("Finished handleApplyOutfit (fetch).");
    }
  };

  return (
    <GestureDetector gesture={flingGesture}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#fff" />
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={32} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.outfitImageContainer}>
            {isApplyingOutfit ? (
              <View style={styles.loadingOverlayContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Magically Crafting Your Outfit...</Text>
              </View>
            ) : generatedImageUrl ? (
              <Image
                source={{ uri: generatedImageUrl }}
                style={styles.outfitImage}
                resizeMode="cover"
              />
            ) : appwriteImage && appwriteImage.href ? (
              <Image
                source={{ uri: appwriteImage.href }}
                style={styles.outfitImage}
                resizeMode="cover"
              />
            ) : (
               <View style={styles.placeholderContainer}>
                 <Ionicons name="image-outline" size={60} color="#AAAAAA" />
                 <Text style={styles.placeholderText}>Your outfit preview will appear here.</Text>
               </View>
            )}
            
            {errorMsg && !isApplyingOutfit && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" style={{marginRight: 5}} />
                <Text style={styles.errorText} numberOfLines={2}>{errorMsg}</Text>
              </View>
            )}
          </View>

          {items.length > 0 && (
            <View style={styles.itemsSectionContainer}>
              <Text style={styles.itemsTitle}>Outfit Items</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalItemsScroll}>
                {items.map((item, index) => (
                  <View key={item.id || index.toString()} style={styles.itemCard}>
                    <Image 
                      source={item.source} 
                      style={styles.itemImageInCard}
                      resizeMode="contain"
                    />
                    {item.label && <Text style={styles.itemLabel} numberOfLines={2}>{item.label}</Text>}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity 
          onPress={handleApplyOutfit}
          style={[styles.continueButton, isApplyingOutfit && styles.continueButtonDisabled]}
          disabled={isApplyingOutfit}
        >
          <LinearGradient
            colors={isApplyingOutfit ? ['#BDBDBD', '#A0A0A0'] : ['#8A2BE2', '#A020F0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerContainer: { 
    height: 60, 
    width: '100%',
    backgroundColor: '#F7F7F7', 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'flex-end',
    paddingHorizontal: 15, 
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: { 
    padding: 5,
  },
  scrollContainer: {
    paddingBottom: 100, // Ensure space for the button
    alignItems: 'center',
  },
  outfitImageContainer: {
    width: '95%',
    aspectRatio: 1, // Make it square or adjust as needed
    marginTop: 20,
    marginBottom: 25,
    borderRadius: 16,
    backgroundColor: '#E9E9E9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', 
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16, // Match parent
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 15,
    color: '#777777',
    marginTop: 10,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 53, 69, 0.85)', // Red error background
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink
  },
  itemsSectionContainer: {
    width: '100%',
    paddingHorizontal: '2.5%', // Align with image container
    marginTop: 10, // Reduced margin
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 18, // Slightly smaller
    fontWeight: '600', // Boldened
    color: '#222',
    marginBottom: 12,
  },
  horizontalItemsScroll: {
    paddingVertical: 5,
  },
  itemCard: {
    width: 100, // Smaller item cards
    height: 130, // Adjusted height for label
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDEDED',
    overflow: 'hidden',
    alignItems: 'center',
    padding: 5,
  },
  itemImageInCard: {
    width: '100%',
    height: 80, // Adjusted for smaller card
  },
  itemLabel: {
    fontSize: 11, // Smaller label
    color: '#444',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 3,
  },
  continueButton: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, // Adjust for different OS
    left: '5%',
    right: '5%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    overflow: 'hidden', // Ensure gradient is clipped
  },
  continueButtonDisabled: {
    shadowOpacity: 0.1, // Reduced shadow when disabled
  },
  continueButtonGradient: {
    width: '100%',
    paddingVertical: 16, // Slightly less padding
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Ensure gradient also has radius
  },
  continueButtonText: {
    fontSize: 17, // Slightly smaller
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 