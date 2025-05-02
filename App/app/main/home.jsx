import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Text,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import outfit images
import HoodieImage from '../../assets/outfits/hoodie1.png';
import PantsImage from '../../assets/outfits/pants1.png';
import ShoesImage from '../../assets/outfits/shoes1.png';

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

export default function Home() {
  // Updated sample data for cards
  const [cards] = useState([
    { 
      id: 'create', 
      type: 'create', 
      title: 'Create your outfit' 
    },
    {
      id: 'outfit1', 
      type: 'outfit',
      items: ['hoodie1', 'pants1', 'shoes1']
    }
    // Removed other placeholder cards
  ]);

  const renderCard = ({ item }) => {
    // Conditional rendering based on card type
    let cardContent;
    if (item.type === 'create') {
      cardContent = (
        <View className="p-4 justify-center items-center h-full">
          <Ionicons name="add-circle-outline" size={60} color="#8A2BE2" />
          <Text className="text-xl font-semibold mt-4 text-gray-700 text-center">
            {item.title}
          </Text>
        </View>
      );
    } else if (item.type === 'outfit') {
      cardContent = (
        <View className="p-4 justify-around items-center h-full">
          {/* Display actual images */}
          <Image 
            source={HoodieImage} 
            style={{ width: CARD_WIDTH * 0.6, height: 100 }}
            resizeMode="contain" 
          />
          <Image 
            source={PantsImage} 
            style={{ width: CARD_WIDTH * 0.6, height: 100 }}
            resizeMode="contain" 
          />
          <Image 
            source={ShoesImage} 
            style={{ width: CARD_WIDTH * 0.6, height: 80 }}
            resizeMode="contain" 
          />
        </View>
      );
    } else {
      // Default placeholder if type is unknown
      cardContent = (
        <View className="p-4 justify-center items-center h-full">
            <Ionicons name="image-outline" size={50} color="#555" />
        </View>
      );
    }

    return (
      <View style={{ width: CARD_WIDTH, marginHorizontal: 10 }}>
        {/* Card TouchableOpacity with white background and shadow */}
        <TouchableOpacity
          className="h-[400px] rounded-2xl justify-center items-center bg-white"
          style={{ 
            // Shadow properties for iOS
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.25,
            shadowRadius: 5,  
            // Elevation for Android shadow
            elevation: 8, 
          }}
          activeOpacity={0.9}
          onPress={() => console.log(`Card ${item.id} pressed`)}
        >
          {/* Render the specific card content */}
          {cardContent}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
        <Text className="text-2xl font-bold text-gray-800">OutfitAI</Text>
        <TouchableOpacity 
          className="overflow-hidden rounded-full"
          onPress={() => console.log('Settings pressed')}
        >
          <LinearGradient
            colors={['#8A2BE2', '#A020F0', '#9370DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-2"
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Horizontal Card Scroll - Adjusted to remain vertically centered */}
      <View 
        className="absolute inset-0 justify-center items-center"
        style={{
          top: 70,  // Header height plus some padding
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center',
            paddingBottom: 30, // Add some padding to adjust vertical position
            flexGrow: 1,
            justifyContent: 'center'
          }}
          snapToInterval={CARD_WIDTH + 20}
          snapToAlignment="center"
          decelerationRate="fast"
        />
      </View>
    </SafeAreaView>
  );
}

