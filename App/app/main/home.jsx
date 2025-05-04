import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Text,
  Image,
  TextInput,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Import outfit images
import HoodieImage from '../../assets/outfits/hoodie1.png';
import PantsImage from '../../assets/outfits/pants1.png';
import ShoesImage from '../../assets/outfits/shoes1.png';
// Import new images
import DressImage from '../../assets/outfits/dress1.png';
import HealsImage from '../../assets/outfits/heals1.png';

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');
// Adjust card width to be smaller to show more of adjacent cards
const CARD_WIDTH = width * 0.7; 
// Define spacing between cards for better symmetry
const CARD_SPACING = 16;
// Define animation configuration values
const ANIMATION_SPEED = 200;
const INACTIVE_SCALE = 0.92;

export default function Home() {
  const router = useRouter();
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  // Add state to track active card index
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  // Previous active index for tracking changes
  const [prevActiveIndex, setPrevActiveIndex] = useState(0);
  
  // Updated sample data structure for cards
  const [cards] = useState([
    { 
      id: 'create', 
      type: 'create', 
      title: 'Create your outfit' 
    },
    {
      id: 'outfit1', 
      type: 'outfit',
      // Items are now objects with source and desired height
      items: [
        { source: HoodieImage, height: 100 }, 
        { source: PantsImage, height: 100 }, 
        { source: ShoesImage, height: 80 }
      ] 
    },
    {
      id: 'outfit2',
      type: 'outfit',
      items: [
        { source: DressImage, height: 200 }, // Dress height adjusted
        { source: HealsImage, height: 150 }  // Heels height adjusted
      ]
    }
  ]);

  // Add filtered cards based on search
  const filteredCards = cards.filter(card => {
    if (searchQuery === '') return true;
    if (card.type === 'create') {
      return card.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // For outfit cards, we'll just show them during search
    return true;
  });

  // Reference to the FlatList to programmatically control it
  const flatListRef = React.useRef();

  // Add scroll offset for more granular animation control
  const scrollX = React.useRef(new Animated.Value(0)).current;
  
  // Create viewability config for detecting centered cards
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 25,
    minimumViewTime: 0
  });
  
  // Track which card is in center view
  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveCardIndex(newIndex);
    }
  });

  // Handle card becoming active and trigger haptics exactly once per change
  React.useEffect(() => {
    // Only trigger haptic feedback on real changes, not initial render
    if (prevActiveIndex !== activeCardIndex) {
      // Always trigger haptic feedback on card change, regardless of direction
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPrevActiveIndex(activeCardIndex);
    }
  }, [activeCardIndex, prevActiveIndex]);

  const renderCard = ({ item, index }) => {
    let cardContent;
    let cardClasses;
    let cardStyle = {}; // Default empty style object
    
    // Calculate the input range for this card
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING)
    ];
    
    // Use scroll position to determine scale and opacity
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [INACTIVE_SCALE, 1, INACTIVE_SCALE],
      extrapolate: 'clamp'
    });
    
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp'
    });
    
    // Determine if this card is the active/focused one
    const isActive = index === activeCardIndex;
    
    // Apply animation styles
    const animatedStyle = {
      transform: [{ scale }],
      opacity
    };
    
    // Base shared styles
    if (isActive) {
      cardStyle = {
        ...cardStyle,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 16,
        borderWidth: 1,
        borderColor: 'rgba(138, 43, 226, 0.15)',
      };
    } else {
      cardStyle = {
        ...cardStyle,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      };
    }

    if (item.type === 'create') {
      cardClasses = "h-[400px] rounded-2xl justify-center items-center bg-gray-50 border border-dashed border-gray-300";
      cardContent = (
        <>
          {/* Custom styled plus icon with gradient background */}
          <View className="mb-4 rounded-full overflow-hidden" style={{ width: 70, height: 70 }}>
            <LinearGradient
              colors={['#8A2BE2', '#A020F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full justify-center items-center"
            >
              <Ionicons name="add" size={40} color="#fff" />
            </LinearGradient>
          </View>
          
          {/* Improved text style */}
          <Text className="text-2xl font-bold text-gray-800 text-center px-6">
            {item.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center px-8">
            Tap to create your perfect outfit combination
          </Text>
        </>
      );
    } else if (item.type === 'outfit') {
      cardClasses = "h-[400px] rounded-2xl justify-center items-center bg-white";
      cardContent = (
        <View className="p-4 justify-center items-center h-full">
          {/* Map over item objects, using source and height */}
          {item.items.map((itemData, index) => (
            <Image 
              key={`${item.id}-img-${index}`}
              source={itemData.source}
              className="rounded-lg my-2"
              style={{ width: CARD_WIDTH * 0.6, height: itemData.height }} 
              resizeMode="contain" 
            />
          ))}
        </View>
      );
    } else {
      // Default/Fallback card style
      cardClasses = "h-[400px] rounded-2xl justify-center items-center bg-gray-200";
      cardContent = (
        <View className="p-4 justify-center items-center h-full">
            <Ionicons name="help-circle-outline" size={50} color="#555" />
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          { 
            width: CARD_WIDTH, 
            marginHorizontal: CARD_SPACING / 2,
          }, 
          animatedStyle
        ]}
      >
        <TouchableOpacity
          className={cardClasses} 
          style={cardStyle}       
          activeOpacity={0.8}
          onPress={() => {
            // Scroll to this card when tapped
            flatListRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5
            });
            console.log(`Card ${item.id} pressed`);
          }}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Removed shadow, reinstated border */}
      <View 
        className="flex-row justify-between items-center px-6 py-5 bg-white border-b border-gray-100" 
      >
        {/* Text size remains increased */}
        <Text className="text-3xl font-bold text-gray-800">OutfitAI</Text>
        <TouchableOpacity 
          className="overflow-hidden rounded-full shadow-sm" 
          style={{ elevation: 2 }}
          onPress={() => router.push('/modal/settings')}
          activeOpacity={0.5}
        >
          <LinearGradient
            colors={['#8A2BE2', '#A020F0', '#9370DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-2 rounded-full" 
          >
            <Ionicons name="settings" size={24} color="#fff" /> 
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Search input */}
      <View className="px-6 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-base text-gray-800"
            placeholder="Search outfits..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View 
        className="absolute inset-0 justify-center items-center"
        style={{ top: 120, bottom: 0, left: 0, right: 0 }}
      >
        <AnimatedFlatList
          ref={flatListRef}
          data={filteredCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - CARD_WIDTH) / 2 - CARD_SPACING / 2, // Center first and last items
            alignItems: 'center',
            paddingVertical: 30,
          }}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="center"
          decelerationRate={0.75}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          // Smooth scrolling tweaks
          pagingEnabled={false}
          disableIntervalMomentum={true}
          snapToOffsets={filteredCards.map((_, i) => 
            i * (CARD_WIDTH + CARD_SPACING)
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      </View>
      
      {/* Preferences button at bottom of screen */}
      <View 
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/modal/preferences')}
          activeOpacity={0.7}
          style={{
            width: '100%',
            maxWidth: 400,
            shadowColor: '#8A2BE2',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 5,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#8A2BE2', '#A020F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="options" size={24} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              Outfit Preferences
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}



