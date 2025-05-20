import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function CreateOptions() {
  const router = useRouter();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOptionSelect = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (option === 'upload') {
      router.push('/create/upload');
    } else if (option === 'existing') {
      router.push('/create/existing');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Outfit</Text>
        <View style={styles.spacer} />
      </View>
      
      <View style={styles.optionsContainer}>
        <Text style={styles.titleText}>Let's Get Started</Text>
        <Text style={styles.subtitleText}>Choose how you'd like to build your next look.</Text>
        
        <TouchableOpacity 
          style={styles.optionCard}
          activeOpacity={0.8}
          onPress={() => handleOptionSelect('upload')}
        >
          <LinearGradient
            colors={['#3A00A0', '#6E1DB2']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientBackground}
          />
          <View style={styles.cardIconContainer}>
            <Ionicons name="cloud-upload-outline" size={48} color="#E0E0E0" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.optionTitle}>Upload New Images</Text>
            <Text style={styles.optionDescription}>
              Snap photos or select images from your gallery.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={26} color="rgba(224,224,224,0.6)" style={styles.arrowIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionCard}
          activeOpacity={0.8}
          onPress={() => handleOptionSelect('existing')}
        >
          <LinearGradient
            colors={['#6E1DB2', '#3A00A0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientBackground}
          />
          <View style={styles.cardIconContainer}>
            <Ionicons name="albums-outline" size={48} color="#E0E0E0" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.optionTitle}>Use Existing Items</Text>
            <Text style={styles.optionDescription}>
              Select from your previously saved clothing items.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={26} color="rgba(224,224,224,0.6)" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F051A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 30,
    paddingBottom: 15,
    backgroundColor: '#0F051A',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F0F0F0',
  },
  spacer: {
    width: 44,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 10,
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 16,
    color: '#909090',
    marginBottom: 30,
    textAlign: 'left',
    lineHeight: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 120,
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A0E2C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 18, 
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(224, 224, 224, 0.75)',
    lineHeight: 20,
  },
  arrowIcon: {
    marginLeft: 10,
  },
}); 