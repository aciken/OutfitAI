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

export default function InfoPage1() {
  const router = useRouter();
  const existingParams = useLocalSearchParams();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Forwarding params from InfoPage1:', existingParams);
    router.push({
      pathname: '/onboarding/outfit-details1',
      params: existingParams, 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#1A0D2E', height: 80 },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15, padding: 5 }}>
              <Ionicons name="arrow-back" size={24} color="#C07EFF" />
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
            <Ionicons name="bulb-outline" size={80} color="#C07EFF" style={styles.infoIcon} />
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
    backgroundColor: '#1A0D2E',
  },
  customHeaderTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerProgressBarContainer: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2A1B3E',
    width: width * 0.6,
  },
  headerProgressStep: {
    flex: 1,
    height: '100%',
    borderRadius: 2.5,
    marginRight: 1,
  },
  activeHeaderProgressStep: {
    backgroundColor: '#C07EFF',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    color: '#C0C0C0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24, // Good line height for readability
  },
  highlightText: {
    fontSize: 17,
    color: '#C07EFF',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10, // Space above highlight text
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192,126,255,0.1)',
    backgroundColor: '#1A0D2E',
  },
  nextButtonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: "#C07EFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
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