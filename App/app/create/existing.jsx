import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Import outfit images
import HoodieImage from '../../assets/outfits/hoodie1.png';
import PantsImage from '../../assets/outfits/pants1.png';
import ShoesImage from '../../assets/outfits/shoes1.png';
import DressImage from '../../assets/outfits/dress1.png';
import HealsImage from '../../assets/outfits/heals1.png';
import Jeans2Image from '../../assets/outfits/jeans2.png'; 
import Shirt2Image from '../../assets/outfits/shirt2.png';
import Shoes2Image from '../../assets/outfits/shoes2.png';
import PoloImage from '../../assets/outfits/Polo.png';
import TrousersImage from '../../assets/outfits/trousers.png';
import Shoes3Image from '../../assets/outfits/Shoes3.png';

export default function ExistingItems() {
  const router = useRouter();
  
  const clothingItems = [
    { id: '1', source: HoodieImage, label: 'Cozy Hoodie', category: 'Tops' },
    { id: '2', source: PantsImage, label: 'Casual Pants', category: 'Bottoms' },
    { id: '3', source: ShoesImage, label: 'Sneakers', category: 'Footwear' },
    { id: '4', source: DressImage, label: 'Summer Dress', category: 'Dresses' },
    { id: '5', source: HealsImage, label: 'Stylish Heels', category: 'Footwear' },
    { id: '6', source: Jeans2Image, label: 'Denim Jeans', category: 'Bottoms' },
    { id: '7', source: Shirt2Image, label: 'Graphic Tee', category: 'Tops' },
    { id: '8', source: Shoes2Image, label: 'High Tops', category: 'Footwear' },
    { id: '9', source: PoloImage, label: 'Classic Polo', category: 'Tops' },
    { id: '10', source: TrousersImage, label: 'Tailored Trousers', category: 'Bottoms' },
    { id: '11', source: Shoes3Image, label: 'Formal Shoes', category: 'Footwear' },
  ];

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log(`Selected ${item.label}`);
      }}
    >
      <Image source={item.source} style={styles.itemImage} resizeMode="contain" />
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create From Existing</Text>
        <View style={styles.spacer} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Items for Your Outfit</Text>
        
        <FlatList
          data={clothingItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
      
      {/* Bottom action button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            console.log('Create outfit pressed');
          }}
        >
          <Text style={styles.createButtonText}>Create Outfit</Text>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(192, 126, 255, 0.15)',
    backgroundColor: 'rgba(26, 13, 46, 0.95)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(192, 126, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 90, // Space for the bottom button
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#2C1B4A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  itemDetails: {
    alignItems: 'center',
    width: '100%',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  itemCategory: {
    fontSize: 12,
    color: '#C07EFF',
    marginTop: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 13, 46, 0.95)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 126, 255, 0.2)',
  },
  createButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 