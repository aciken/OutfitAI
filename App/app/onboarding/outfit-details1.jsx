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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const COMPONENT_OPTIONS = [
  { id: 'tops', label: 'Tops (Shirts, Blouses)', iconType: 'Ionicons', iconName: 'shirt-outline' },
  { id: 'bottoms', label: 'Bottoms (Jeans, Pants)', iconType: 'MaterialCommunityIcons', iconName: 'jeans' },
  { id: 'dresses', label: 'Dresses', iconType: 'MaterialCommunityIcons', iconName: 'hanger' },
  { id: 'skirts', label: 'Skirts', iconType: 'MaterialCommunityIcons', iconName: 'tshirt-crew' },
  { id: 'outerwear', label: 'Outerwear (Jackets, Coats)', iconType: 'MaterialCommunityIcons', iconName: 'jacket-cuff' },
  { id: 'sneakers', label: 'Sneakers', iconType: 'MaterialCommunityIcons', iconName: 'shoe-sneaker' },
  { id: 'boots', label: 'Boots', iconType: 'MaterialCommunityIcons', iconName: 'shoe-boot' },
  { id: 'heels', label: 'Heels', iconType: 'MaterialCommunityIcons', iconName: 'shoe-heel' },
  { id: 'accessories', label: 'Accessories (Bags, Jewelry)', iconType: 'Ionicons', iconName: 'watch-outline' },
  { id: 'hats', label: 'Hats', iconType: 'MaterialCommunityIcons', iconName: 'hard-hat' },
];

export default function OutfitComponentsPage() {
  const router = useRouter();
  const existingParams = useLocalSearchParams();
  const [selectedComponents, setSelectedComponents] = useState([]);

  const handleSelectComponent = (componentId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedComponents((prevSelected) =>
      prevSelected.includes(componentId)
        ? prevSelected.filter((id) => id !== componentId)
        : [...prevSelected, componentId]
    );
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Selected Outfit Components:', selectedComponents);
    console.log('Existing Params (OutfitDetails1):', existingParams);

    const dataToPass = {
      ...existingParams,
      outfitComponents: selectedComponents,
    };

    router.push({
      pathname: '/onboarding/outfit-details2',
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
              <Text style={styles.customHeaderTitleText}>Step 4 of 7: Key Items</Text>
              <OnboardingProgressBar currentStep={4} totalSteps={7} />
            </View>
          ),
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Your Go-To Items</Text>
          <Text style={styles.subtitle}>Select items you frequently wear or love to see in outfits. This helps us understand your wardrobe basics.</Text>

          <View style={styles.optionsContainer}>
            {COMPONENT_OPTIONS.map((option) => {
              const isSelected = selectedComponents.includes(option.id);
              const IconComponent = option.iconType === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOptionButton,
                  ]}
                  onPress={() => handleSelectComponent(option.id)}
                >
                  <IconComponent 
                    name={option.iconName}
                    size={22}
                    color={isSelected ? '#fff' : '#555'}
                    style={styles.optionIcon}
                  />
                  <Text 
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <View style={styles.checkbox}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
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
    backgroundColor: '#8A2BE2',
    borderColor: '#7A1FB8',
  },
  optionIcon: {
    marginRight: 12,
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