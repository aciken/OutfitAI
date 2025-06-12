import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import ImageIcon from '../../assets/ImageIcon.png';
import HangerIconGlow from '../../assets/HangerIconGlow.png';

export default function CreateOptions() {
  const router = useRouter();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOptionSelect = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (option === 'upload') {
      router.replace('/create/upload');
    } else if (option === 'existing') {
      router.replace('/create/existing');
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
      
      <View style={styles.optionsGridContainer}>
        <TouchableOpacity 
          style={styles.optionCard}
          activeOpacity={0.85}
          onPress={() => handleOptionSelect('upload')}
        >
          <LinearGradient
            colors={['#301A4A', '#200F3A']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardImageContainer}> 
            <Image source={ImageIcon} style={styles.cardImage} resizeMode="contain" />
          </View>
          <Text style={styles.optionTitle}>Upload Images</Text>
          <Text style={styles.optionDescription}>
            Use photos of your garments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionCard}
          activeOpacity={0.85}
          onPress={() => handleOptionSelect('existing')}
        >
          <LinearGradient
            colors={['#301A4A', '#200F3A']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardImageContainer}>
            <Image source={HangerIconGlow} style={styles.cardImage} resizeMode="contain" />
          </View>
          <Text style={styles.optionTitle}>Use Existing</Text>
          <Text style={styles.optionDescription}>
            Build from saved items
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0D2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 30,
    paddingBottom: 15,
    backgroundColor: '#1A0D2E',
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
  optionsGridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  optionCard: {
    width: '45%',
    aspectRatio: 0.8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    borderColor: '#A020F0',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    padding: 10,
  },
  cardImageContainer: {
    width: '70%',
    aspectRatio: 1,
    marginBottom: 15,
    shadowColor: '#A020F0', 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, 
    shadowRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
    textAlign: 'center',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 13,
    color: '#B0B0B0',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
}); 