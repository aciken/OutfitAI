import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView
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

export default function InfoPage1() {
  const router = useRouter();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/outfit-details1');
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
              <Text style={styles.customHeaderTitleText}>Step 3 of 7: Discover</Text>
              <OnboardingProgressBar currentStep={3} totalSteps={7} />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.content}>
            <Ionicons name="bulb-outline" size={80} color="#8A2BE2" style={styles.infoIcon} />
            <Text style={styles.title}>Unlock Your Style Potential</Text>
            <Text style={styles.paragraph}>
              Welcome to OutfitAI! We're excited to help you discover new looks and make the most of your wardrobe. 
              The next few steps will help us understand your preferences.
            </Text>
            <Text style={styles.paragraph}>
              Based on your selections, we'll provide personalized outfit recommendations, help you organize your clothes, and even let you virtually try on new items soon!
            </Text>
            <Text style={styles.highlightText}>
              Let's get started on tailoring your fashion journey.
            </Text>
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
            <Text style={styles.nextButtonText}>Continue</Text>
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
  scrollContentContainer: {
    flexGrow: 1, // Ensures content can scroll if it exceeds screen height
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30, // Generous padding for info text
  },
  infoIcon: {
      marginBottom: 25,
  },
  title: {
    fontSize: 26, // Larger title for info page
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24, // Good line height for readability
  },
  highlightText: {
    fontSize: 17,
    color: '#8A2BE2',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10, // Space above highlight text
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