import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

const COLOR_OPTIONS = [
  { id: 'bright_bold', label: 'Bright & Bold', color: '#FF4500' }, // OrangeRed
  { id: 'dark_tones', label: 'Dark Tones', color: '#2F4F4F' },    // DarkSlateGray
  { id: 'neutral_shades', label: 'Neutral Shades', color: '#D2B48C' }, // Tan
  { id: 'pastels', label: 'Pastels', color: '#FFB6C1' },          // LightPink
  { id: 'earthy_tones', label: 'Earthy Tones', color: '#8B4513' },   // SaddleBrown
  { id: 'monochrome', label: 'Monochrome (B&W)', color: '#708090' },// SlateGray (mix for B&W feel)
  { id: 'blues_denims', label: 'Blues & Denims', color: '#4682B4'}, // SteelBlue
  { id: 'greens_khakis', label: 'Greens & Khakis', color: '#556B2F'}, // DarkOliveGreen
];

export default function ColorPreferencesPage() {
  const router = useRouter();
  const existingParams = useLocalSearchParams();
  const [selectedColors, setSelectedColors] = useState([]);

  const handleSelectColor = (colorId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColors((prevSelected) =>
      prevSelected.includes(colorId)
        ? prevSelected.filter((id) => id !== colorId)
        : [...prevSelected, colorId]
    );
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Selected Colors:', selectedColors);
    console.log('Existing Params (ColorPreferencesPage):', existingParams);

    const dataToPass = {
      ...existingParams,
      colors: selectedColors,
    };

    router.push({ 
      pathname: '/onboarding/info-page2',
      params: dataToPass,
    });
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
              <Text style={styles.customHeaderTitleText}>Step 5 of 7: Colors</Text>
              <OnboardingProgressBar currentStep={5} totalSteps={7} />
            </View>
          ),
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Your Color Palette</Text>
          <Text style={styles.subtitle}>Pick colors or palettes you often wear or are drawn to. This helps us find outfits you'll love.</Text>

          <View style={styles.optionsContainer}>
            {COLOR_OPTIONS.map((option) => {
              const isSelected = selectedColors.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOptionButton,
                    isSelected && { backgroundColor: option.color, borderColor: darkenColor(option.color, 0.2) }
                  ]}
                  onPress={() => handleSelectColor(option.id)}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: option.color }]} />
                  <Text 
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                      isSelected && !isLightColor(option.color) && { color: '#fff' },
                      isSelected && isLightColor(option.color) && { color: '#333' }
                    ]}
                  >
                    {option.label}
                  </Text>
                  <View style={styles.checkbox}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={isLightColor(option.color) ? '#333' : '#fff'} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButtonWrapper} 
          onPress={handleNext} 
        >
          <LinearGradient
            colors={['#8A2BE2', '#A020F0']}
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

// Helper function to determine if a color is light (for checkmark visibility)
const isLightColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return true; // Default to light if invalid
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

// Helper function to darken a hex color (for selected border)
const darkenColor = (hexColor, percent) => {
    if (!hexColor || hexColor.length < 7) return '#000000'; // Default to black if invalid
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    r = Math.max(0, Math.floor(r * (1 - percent)));
    g = Math.max(0, Math.floor(g * (1 - percent)));
    b = Math.max(0, Math.floor(b * (1 - percent)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

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
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  optionsContainer: {},
  optionButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOptionButton: {
    // backgroundColor is set dynamically for selected color options
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12, // Circular swatch
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    backgroundColor: '#F7F7F7',
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
}); 