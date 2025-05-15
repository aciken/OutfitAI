import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function ImageResultPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mainImageUri, itemsJson } = params;

  // Parse itemsJson if needed later
  // let items = [];
  // if (itemsJson) { try { items = JSON.parse(itemsJson); } catch(e) { console.error("Error parsing itemsJson on result page:", e); } }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={styles.safeArea.backgroundColor} />
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#F7F7F7' },
          headerTintColor: '#333',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButtonContainer}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
          headerTitle: 'Processing Result',
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          {/* This is where the image will eventually be. For now, it shows a loading state. */}
          <View style={styles.imageSlot}>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Ionicons name="image-outline" size={width * 0.2} color="#D0D0D0" style={styles.imageIconBackground} />
          </View>
          <Text style={styles.mainText}>Working on Your Image</Text>
          <Text style={styles.subText}>Our AI is analyzing your outfit. This might take a moment.</Text>
        </View>
        
        {mainImageUri && (
            <View style={styles.debugPreviewContainer} >
                <Text style={styles.debugText}>Image being processed:</Text>
                <Image source={{uri: mainImageUri}} style={styles.debugImage} />
            </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerButtonContainer: {
    marginLeft: 15,
    padding: 5,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageSlot: {
    width: width * 0.7,
    height: height * 0.35,
    backgroundColor: '#ECECEC',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden', // Ensures icon doesn't bleed out if oversized
  },
  imageIconBackground: {
    position: 'absolute',
    opacity: 0.5, // Make it subtle
  },
  mainText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10, // Add some padding so text doesn't hit edges
  },
  debugPreviewContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  debugImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderColor: '#ccc',
    borderWidth: 1,
  }
}); 