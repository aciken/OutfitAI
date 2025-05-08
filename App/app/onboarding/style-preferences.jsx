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
import { useRouter, Stack } from 'expo-router';
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

const STYLE_OPTIONS = [
  { id: 'casual', label: 'Casual', icon: 'body-outline' },
  { id: 'formal', label: 'Formal', icon: 'man-outline' }, // Using 'man' as a placeholder for a suit/tie icon
  { id: 'sporty', label: 'Sporty', icon: 'basketball-outline' },
  { id: 'vintage', label: 'Vintage', icon: 'time-outline' },
  { id: 'bohemian', label: 'Bohemian', icon: 'flower-outline' },
  { id: 'minimalist', label: 'Minimalist', icon: 'remove-circle-outline' },
  { id: 'streetwear', label: 'Streetwear', icon: 'walk-outline' },
  { id: 'preppy', label: 'Preppy', icon: 'school-outline' },
  { id: 'artistic', label: 'Artistic', icon: 'color-palette-outline' },
  { id: 'trendy', label: 'Trendy', icon: 'flame-outline' },
];

export default function StylePreferencesPage() {
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState([]);

  const handleSelectStyle = (styleId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyles((prevSelected) =>
      prevSelected.includes(styleId)
        ? prevSelected.filter((id) => id !== styleId)
        : [...prevSelected, styleId]
    );
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Selected Styles:', selectedStyles);
    router.push('/onboarding/info-page1'); // Navigate to new info-page1
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
              <Text style={styles.customHeaderTitleText}>Step 2 of 7: Styles</Text>
              <OnboardingProgressBar currentStep={2} totalSteps={7} />
            </View>
          ),
        }}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>What styles do you like?</Text>
          <Text style={styles.subtitle}>Select one or more styles. This will help us tailor suggestions to your taste.</Text>

          <View style={styles.optionsContainer}>
            {STYLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedStyles.includes(option.id) && styles.selectedOptionButton,
                ]}
                onPress={() => handleSelectStyle(option.id)}
              >
                <Ionicons 
                  name={selectedStyles.includes(option.id) ? option.icon : `${option.icon}`}
                  size={22}
                  color={selectedStyles.includes(option.id) ? '#fff' : '#555'}
                  style={styles.optionIcon}
                />
                <Text 
                  style={[
                    styles.optionText,
                    selectedStyles.includes(option.id) && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
                <View style={styles.checkbox}>
                  {selectedStyles.includes(option.id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
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
  optionsContainer: {
  },
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