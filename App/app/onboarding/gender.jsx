import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Onboarding Progress Bar Component (styles adjusted for header)
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

const GENDER_OPTIONS = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'prefer_not_say', label: 'Prefer not to say' },
];

export default function GenderSelectionPage() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState(null);

  const handleSelectGender = (genderId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGender(genderId);
  };

  const handleNext = () => {
    if (selectedGender) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Selected Gender:', selectedGender);
      router.push('/onboarding/style-preferences');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      alert('Please select a gender to continue.');
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
              <Text style={styles.customHeaderTitleText}>Step 1 of 7: Gender</Text>
              <OnboardingProgressBar currentStep={1} totalSteps={7} />
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>Select the gender you identify with. This helps us personalize your experience.</Text>

        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedGender === option.id && styles.selectedOptionButton,
              ]}
              onPress={() => handleSelectGender(option.id)}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedGender === option.id && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.nextButtonWrapper} 
          onPress={handleNext} 
          disabled={!selectedGender}
        >
          <LinearGradient
            colors={selectedGender ? ['#8A2BE2', '#A020F0'] : ['#D3D3D3', '#C0C0C0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  customHeaderTitleContainer: {
    alignItems: 'center', // Center children (text and progress bar)
    justifyContent: 'center',
    // No fixed width, allow it to be centered by headerTitleAlign
    // flex: 1, // If you want it to try and take more space (might conflict with back button)
  },
  customHeaderTitleText: {
    fontSize: 17, // Slightly larger title text in header
    fontWeight: 'bold', // Keep it bold
    color: '#333',
    textAlign: 'center',
    marginBottom: 6, // Increased space between title and progress bar
  },
  headerProgressBarContainer: {
    flexDirection: 'row',
    height: 5, // Thinner progress bar
    borderRadius: 2.5,
    backgroundColor: '#EAEAEA', // Softer inactive track color
    width: width * 0.6, // Define a width for the bar itself
    // No horizontal margin, as it's centered by its container's alignItems
    // marginTop is handled by marginBottom of customHeaderTitleText
  },
  headerProgressStep: {
    flex: 1,
    height: '100%',
    borderRadius: 2.5, // Rounded segments too
    marginRight: 1, // Tiny separation between segments
  },
  activeHeaderProgressStep: {
    backgroundColor: '#8A2BE2',
  },
  inactiveHeaderProgressStep: {
    backgroundColor: 'transparent', // Let the container's bg show through for inactive parts
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20, // Keep some margin if progress bar was removed from here
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  optionsContainer: {
    flexGrow: 1, 
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOptionButton: {
    backgroundColor: '#8A2BE2',
    borderColor: '#7A1FB8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nextButtonWrapper: {
    borderRadius: 25, 
    overflow: 'hidden', 
    marginTop: 20, 
    marginBottom: 10, 
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
}); 