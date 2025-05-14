import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage, ImageGravity } from 'react-native-appwrite';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OutfitDetailsPage() {
  const { user } = useGlobalContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; // id from the route path e.g., outfit1
  let items = [];
  // pageTitle is no longer used for a visible header title

  const [image, setImage] = useState(null);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Floating Back Button with Gradient */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <LinearGradient
          colors={['#8A2BE2', '#A020F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <Ionicons name="arrow-down" size={22} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Back</Text>
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Display the fetched image here */}
        {image && image.href && (
          <View style={styles.outfitImageContainer}>
            <Image
              source={{ uri: image.href }}
              style={styles.outfitImage}
              resizeMode="cover"
            />
          </View>
        )}

        {items.length > 0 ? (
          items.map((outfitItem, index) => (
            <View key={index} style={styles.itemContainer}>
              <Image 
                source={outfitItem.source} 
                style={[styles.image, { height: outfitItem.height || 150 }]} // Provide a default height
                resizeMode="contain" 
              />
              <Text style={styles.label}>{outfitItem.label}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.errorText}>
            No items found for this outfit, or there was an error loading them.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 15,
    zIndex: 10,
    width: 110,
    height: 44,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.20,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingTop: 100,
    paddingVertical: 20,
    paddingHorizontal: 15, 
    alignItems: 'center',
  },
  outfitImageContainer: {
    width: '95%',
    height: 300,
    marginBottom: 25,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4.5,
    elevation: 3,
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  itemContainer: {
    width: '95%', // Make item cards take up most of the width
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4.5,
    elevation: 3,
  },
  image: {
    width: '100%', 
    marginBottom: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  }
}); 