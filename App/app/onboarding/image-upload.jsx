import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Onboarding Progress Bar Component (refined version)
const OnboardingProgressBar = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.headerProgressBarContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        return (
          <View 
            key={stepNumber}
            style={[
              styles.headerProgressStep,
              isActive ? styles.activeHeaderProgressStep : styles.inactiveHeaderProgressStep,
            ]}
          />
        );
      })}
    </View>
  );
};

export default function ImageUploadPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  const handleChooseFromLibrary = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log("Requesting library permissions...");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Library permission status:", status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need library access to choose an image.');
        return;
      }
      
      console.log("Launching image library...");
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });
      console.log("Image library result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsOptionsModalVisible(false);
      } else {
        console.log("Library picking cancelled or no assets found.");
      }
    } catch (error) {
      console.error("LibraryPicker Error: ", error);
      Alert.alert('Error', 'Could not pick image from library.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log("Requesting camera permissions...");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission status:", status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to take a photo.');
        return;
      }
      
      console.log("Launching camera...");
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });
      console.log("Camera result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setIsOptionsModalVisible(false);
      } else {
        console.log("Camera cancelled or no assets found.");
      }
    } catch (error) {
      console.error("Camera Error: ", error);
      Alert.alert('Error', 'Could not take photo.');
    }
  };

  const handleFinish = () => {
    if (selectedImage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Selected Image URI:', selectedImage);
      router.push('/modal/signup');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      alert('Please select or take an image to continue.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#fff', height: 80 },
          headerTintColor: '#333',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15, padding: 5 }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={styles.customHeaderTitleContainer}>
              <Text style={styles.customHeaderTitleText}>Step 7 of 7: Your Image</Text>
              <OnboardingProgressBar currentStep={7} totalSteps={7} />
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
            <Text style={styles.title}>Upload Your Full Body Image</Text>
            <Text style={styles.subtitle}>
                This image will be used for virtual try-on. Ensure good lighting and a clear view.
            </Text>

            <TouchableOpacity
              style={styles.imagePreviewContainer}
              onPress={() => setIsOptionsModalVisible(true)}
              activeOpacity={0.7}
            >
              {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                  <View style={styles.imagePlaceholder}>
                      <Ionicons name="person-outline" size={80} color="#C0C0C0" />
                      <Text style={styles.imagePlaceholderText}>Tap to Add Image</Text>
                  </View>
              )}
            </TouchableOpacity>

            <Text style={styles.imageNote}>You can change this image later in settings.</Text>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity 
                style={styles.nextButtonWrapper} 
                onPress={handleFinish} 
                disabled={!selectedImage}
            >
                <LinearGradient
                    colors={selectedImage ? ['#8A2BE2', '#A020F0'] : ['#D3D3D3', '#C0C0C0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextButton}
                >
                    <Text style={styles.nextButtonText}>Finish & Sign Up</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isOptionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setIsOptionsModalVisible(false)}
        >
            <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.modalContentContainer} onStartShouldSetResponder={() => true}>
                <Text style={styles.modalTitle}>Upload Image</Text>
                <Text style={styles.modalSubtitle}>Choose how you'd like to add your image.</Text>
                
                <TouchableOpacity
                  style={styles.modalOptionButton}
                  onPress={handleChooseFromLibrary}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={26} color="#8A2BE2" style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionText}>Choose from Library</Text>
                  <Ionicons name="chevron-forward" size={22} color="#B0B0B0" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalOptionButton}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={26} color="#8A2BE2" style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionText}>Take Photo</Text>
                  <Ionicons name="chevron-forward" size={22} color="#B0B0B0" />
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setIsOptionsModalVisible(false)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  customHeaderTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerProgressBarContainer: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EAEAEA',
    width: width * 0.6,
  },
  headerProgressStep: {
    flex: 1,
    height: '100%',
    borderRadius: 2.5,
    marginRight: 1,
  },
  activeHeaderProgressStep: {
    backgroundColor: '#8A2BE2',
  },
  inactiveHeaderProgressStep: {
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  imagePreviewContainer: {
    width: width * 0.7,
    height: width * 0.85,
    borderRadius: 15,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
      marginTop: 8,
      color: '#777',
      fontSize: 15,
      fontWeight: '500'
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageNote: {
      fontSize: 13,
      color: '#888',
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingBottom: 30,
  },
  nextButtonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  nextButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: '88%',
    maxWidth: 380,
    alignItems: 'stretch',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#555555',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  modalOptionIcon: {
    marginRight: 15,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  modalCancelButton: {
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#777777',
    textAlign: 'center',
  },
}); 