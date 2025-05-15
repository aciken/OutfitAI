import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage, ImageGravity } from 'react-native-appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';

export default function OutfitDetailsPage() {
  const { user } = useGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; // id from the route path e.g., outfit1
  let items = [];
  // pageTitle is no longer used for a visible header title

  const [image, setImage] = useState(null);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);

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
    // Consider showing an error message to the user on the page
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
                parsedUser.fileId, // Use fileId from AsyncStorage
            );
            setImage(result);
            console.log("Appwrite image preview URL:", result); // Resource URL
          } else {
            console.log("fileId not found in stored user data.");
          }
        } else {
          console.log("No user data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage or getting image preview:", error);
      }
    };

    fetchUserAndImage();
  }, []); // Empty dependency array, so it runs once on mount

  const handleApplyOutfit = () => {
    setIsApplyingOutfit(true);
    // Simulate an API call or processing
    setTimeout(() => {
      setIsApplyingOutfit(false);
      // Here you would typically do something with the result or navigate
      // For now, just resetting the loading state
      console.log("Outfit applied (simulated)");
    }, 3000); // Simulate a 3-second loading animation
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
          {/* Display the fetched image or loading animation */}
          <View style={styles.outfitImageContainer}>
            {isApplyingOutfit ? (
              <View style={styles.loadingOverlayContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Applying Outfit...</Text>
              </View>
            ) : (
              image && image.href && (
                <Image
                  source={{ uri: image.href }}
                  style={styles.outfitImage}
                  resizeMode="cover"
                />
              )
            )}
          </View>

          {/* Outfit Items Section */}
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
                    {/* You can add item.label here if needed, like in your original modal */}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Apply Outfit Button at the bottom */}
        <TouchableOpacity 
          onPress={handleApplyOutfit}
          style={styles.continueButton}
          disabled={isApplyingOutfit}
        >
          <LinearGradient
            colors={isApplyingOutfit ? ['#BDBDBD', '#A0A0A0'] : ['#8A2BE2', '#A020F0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Apply Outfit</Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
  },
  closeButton: { 
    zIndex: 100,
    width: 40, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  outfitImageContainer: {
    width: '95%',
    height: 300,
    marginBottom: 25,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4.5,
    elevation: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemsSectionContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    marginBottom: 15,
  },
  horizontalItemsScroll: {
    paddingLeft: 15,
    paddingRight: 5,
  },
  itemCard: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemImageInCard: {
    width: '100%',
    height: '100%',
  },
  continueButton: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 25,
    left: '5%',
    right: '5%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  continueButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 