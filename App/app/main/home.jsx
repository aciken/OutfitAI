import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Easing,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Import outfit images
import HoodieImage from '../../assets/outfits/hoodie1.png';
import PantsImage from '../../assets/outfits/pants1.png';
import ShoesImage from '../../assets/outfits/shoes1.png';
// Import new images
import DressImage from '../../assets/outfits/dress1.png';
import HealsImage from '../../assets/outfits/heals1.png';
// Import new images for outfit 3
import Jeans2Image from '../../assets/outfits/jeans2.png'; 
import Shirt2Image from '../../assets/outfits/shirt2.png';
import Shoes2Image from '../../assets/outfits/shoes2.png';
// Placeholder import for the mannequin image for outfit 3 - PLEASE REPLACE with your actual image
import MannequinOutfit3Image from '../../assets/outfits/outfit3.png'; 
// Placeholder import for the mannequin image for outfit 1 - PLEASE REPLACE with your actual image
import MannequinOutfit1Image from '../../assets/outfits/outfit1.png';
// Placeholder import for the mannequin image for outfit 2 - PLEASE REPLACE with your actual image
import MannequinOutfit2Image from '../../assets/outfits/outfit2.png';

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
  const [showScrollToStart, setShowScrollToStart] = useState(false);
  
  // Animation values for button appearance
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [buttonVisible, setButtonVisible] = useState(false);
  
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
      // Display a single mannequin image on the card
      items: [
        { source: MannequinOutfit1Image, height: 300 }
      ],
      // Store original items for the detail view
      detailedItems: [
        { source: HoodieImage, height: 100, label: 'Cozy Hoodie' }, 
        { source: PantsImage, height: 100, label: 'Casual Pants' }, 
        { source: ShoesImage, height: 80, label: 'Sneakers' }
      ]
    },
    {
      id: 'outfit2',
      type: 'outfit',
      // Display a single mannequin image on the card
      items: [
        { source: MannequinOutfit2Image, height: 300 }
      ],
      // Store original items for the detail view
      detailedItems: [
        { source: DressImage, height: 200, label: 'Summer Dress' },
        { source: HealsImage, height: 150, label: 'Stylish Heels' }
      ]
    },
    {
      id: 'outfit3', // New outfit ID
      type: 'outfit',
      // Display a single mannequin image on the card
      items: [
        { source: MannequinOutfit3Image, height: 300 } // Increased height again
      ],
      // Store original items for the detail view
      detailedItems: [
        { source: Shirt2Image, height: 100, label: 'Graphic Tee' },
        { source: Jeans2Image, height: 100, label: 'Denim Jeans' },
        { source: Shoes2Image, height: 80, label: 'High Tops' }
      ]
    }
  ]);

  // Add filtered cards based on search
  const filteredCards = cards.filter(card => {
    const query = searchQuery.toLowerCase();
    if (query === '') return true;

    if (card.type === 'create') {
      return card.title.toLowerCase().includes(query);
    }
    
    if (card.type === 'outfit') {
      // Define keywords for each outfit card
      const outfitKeywords = {
        'outfit1': ['hoodie', 'pants', 'shoes', 'cozy', 'casual', 'sneakers'],
        'outfit2': ['dress', 'heals', 'summer', 'stylish'],
        'outfit3': ['shirt', 'tee', 'jeans', 'denim', 'shoes', 'tops'] // Added keywords for outfit3
      };

      // Check if the query matches any keyword for this specific outfit
      if (outfitKeywords[card.id]?.some(keyword => query.includes(keyword))) {
        return true; // Show this card if the query matches its keywords
      }
      
      // Check if the query matches keywords for OTHER outfits
      // If it does, hide the current card
      const allOtherKeywords = Object.entries(outfitKeywords)
        .filter(([id]) => id !== card.id)
        .flatMap(([, keywords]) => keywords);
        
      if (allOtherKeywords.some(keyword => query.includes(keyword))) {
        return false; // Hide this card if the query matches another outfit's keywords
      }
      
      // If the query doesn't match any outfit keywords specifically, 
      // but is not empty, and doesn't match the create card title, 
      // we might default to showing all outfit cards or none.
      // Let's default to showing the card if the query doesn't explicitly match another outfit.
      // This allows searching for general terms without hiding everything.
      // Consider revising this default behavior if needed.
      return true;
    }
    
    return false; // Should not happen with current card types
  });

  // Reference to the FlatList to programmatically control it
  const flatListRef = React.useRef();

  // Add scroll offset for more granular animation control
  const scrollX = React.useRef(new Animated.Value(0)).current;
  
  // Create viewability config for detecting centered cards
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 25,
    minimumViewTime: 0,
    waitForInteraction: true,
  });
  
  // Track which card is in center view AND if first card is visible
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveCardIndex(newIndex);

      // Check if the first card (index 0) is among the viewable items
      const isFirstCardVisible = viewableItems.some(item => item.index === 0);
      setShowScrollToStart(!isFirstCardVisible);

    } else {
      // If no items are viewable, assume we are scrolled away from start
      // (This might need adjustment based on edge cases)
      if (activeCardIndex !== 0) { // Only show if we know we aren't at index 0
         setShowScrollToStart(true);
      }
    }
  }, [activeCardIndex]);

  // Handle card becoming active and trigger haptics exactly once per change
  React.useEffect(() => {
    // Only trigger haptic feedback on real changes, not initial render
    if (prevActiveIndex !== activeCardIndex) {
      // Always trigger haptic feedback on card change, regardless of direction
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPrevActiveIndex(activeCardIndex);
    }
  }, [activeCardIndex, prevActiveIndex]);

  // For logging when the button should be rendered
  useEffect(() => {
    console.log("Component rendered, activeCardIndex:", activeCardIndex);
  }, [activeCardIndex]);

  // Animate button appearance/disappearance when activeCardIndex changes
  useEffect(() => {
    if (activeCardIndex !== 0) {
      // Make sure button is in DOM before animating
      setButtonVisible(true);
      // If not on first card, fade in the button
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
    } else {
      // If on first card, fade out the button
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 250, // Slightly faster fade out
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }).start(() => {
        // After animation completes, remove from DOM
        setButtonVisible(false);
      });
    }
  }, [activeCardIndex, buttonOpacity]);

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
    
    // Calculate blur intensity based on distance from center
    const blurIntensity = scrollX.interpolate({
      inputRange,
      outputRange: [25, 0, 25], // Stronger blur when not centered, clear when centered
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
        borderWidth: 1.5, // Increased border width for active card
        borderColor: 'rgba(138, 43, 226, 0.25)', // Increased opacity for active border
      };
    } else {
      cardStyle = {
        ...cardStyle,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1, 
        borderColor: 'rgba(0, 0, 0, 0.06)', // Decreased opacity for inactive border
      };
    }

    if (item.type === 'create') {
      cardClasses = "h-[400px] rounded-2xl justify-center items-center bg-gray-50 border border-dashed border-gray-300 overflow-hidden";
      cardContent = (
        <>
          {/* Gradient Background for Create Card */}
          <LinearGradient
            colors={['rgba(250, 250, 250, 0.8)', 'rgba(245, 245, 245, 0.6)']}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Custom styled plus icon */}
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
      cardClasses = "h-[400px] rounded-2xl bg-white overflow-hidden";
      cardContent = (
        // Container for gradient + items
        <View className="flex-1 justify-center items-center w-full">
          {/* Subtle Background Gradient */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(245, 240, 255, 0.5)', 'rgba(230, 220, 250, 0.3)']} // Light purple tones
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        
          {/* Item Container */}
          <View className="p-4 justify-center items-center">
            {item.items.map((itemData, imgIndex) => {
              const rotation = imgIndex % 2 === 0 ? '-1.5deg' : '1.5deg';
              
              return (
                // Wrap image and text
                <View key={`${item.id}-item-${imgIndex}`} className="items-center mb-2">
                  <Image 
                    source={itemData.source}
                    className="rounded-lg" 
                    style={[
                      {
                        width: CARD_WIDTH * 0.6, // Slightly reduced width to make space for label
                        height: itemData.height,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        transform: [{ rotate: rotation }]
                      }
                    ]}
                    resizeMode="contain" 
                  />
                  {/* Item Label */}
                  <Text 
                    className="mt-1 text-xs font-medium text-gray-600"
                    style={{ transform: [{ rotate: rotation }] }} // Apply same rotation
                  >
                    {itemData.label}
                  </Text>
                </View>
              );
            })}
          </View>
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light haptic for all card taps

            if (item.type === 'outfit') {
              // Navigate to a new page for 'outfit' cards
              console.log(`Outfit Card ${item.id} (index ${index}) pressed, navigating.`);
              
              // Determine which items to pass to the detail screen
              // Prioritize detailedItems if available, otherwise use items
              let itemsToPass = item.detailedItems ? item.detailedItems : item.items;

              router.push({
                pathname: `/outfit/${item.id}`, // Dynamic route using outfit ID
                params: { 
                  items: JSON.stringify(itemsToPass),
                  // You can pass a general title for the outfit card if available, e.g.:
                  // title: item.title || `Outfit ${item.id}` 
                }
              });
            } else {
              // For 'create' card or any other types, scroll to it (maintains previous behavior)
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5 // Center the card
              });
              console.log(`Card ${item.id} (type: ${item.type}, index ${index}) pressed, scrolling.`);
            }
          }}
        >
          {cardContent}
          
          {/* Blur overlay that fades based on position */}
          <Animated.View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              borderRadius: 16, // Match card's rounded corners
              opacity: blurIntensity.interpolate({
                inputRange: [0, 15],
                outputRange: [0, 0.5], // Gradually becomes visible as blur increases
                extrapolate: 'clamp'
              })
            }}
            pointerEvents="none"
          >
            <BlurView 
              intensity={25}
              style={{ 
                width: '100%', 
                height: '100%',
              }}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View 
        className="flex-row justify-between items-center px-6 py-5 bg-white border-b border-gray-100" 
        style={{ zIndex: 10 }}
      >
        {/* Text size remains increased, now with a shadow */}
        <Text 
          className="text-3xl font-bold" 
          style={{
            color: '#8A2BE2', 
            textShadowColor: 'rgba(0, 0, 0, 0.25)', 
            textShadowOffset: { width: 1, height: 1 }, 
            textShadowRadius: 3
          }}
        >
          OutfitAI
        </Text>
        <View className="flex-row items-center space-x-3">
          {/* Settings Icon (Preferences Icon removed from here) */}
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
      </View>
      
      {/* Search input & Preferences Icon Row */}
      <View 
        className="flex-row items-center px-6 py-3 border-b border-gray-100 space-x-3 bg-white"
        style={{ zIndex: 10 }}
      >
        {/* Search Input Container (takes up remaining space) */}
        <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-base text-gray-800"
            placeholder="Search outfits..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginLeft: 8 }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {/* Preferences Icon (fixed width, clickable) */}
        <TouchableOpacity 
          onPress={() => router.push('/modal/preferences')} 
          activeOpacity={0.5}
          className="p-2"
        >
          <Ionicons name="options" size={24} color="#8A2BE2" />
        </TouchableOpacity>
      </View>
      
      {/* Create Your Outfit Button - animated appearance/disappearance */}
      {buttonVisible && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 220,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 9999,
            opacity: buttonOpacity,
            transform: [
              {
                translateY: buttonOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0], // Slide up/down effect combined with fade
                })
              }
            ]
          }}
        >
          <TouchableOpacity
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2, 
              shadowRadius: 2,
              elevation: 3,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: 'rgba(138, 43, 226, 0.3)',
            }}
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index: 0, 
                animated: true,
                viewPosition: 0.5
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#8A2BE2" style={{ marginRight: 6 }} /> 
            <Text style={{ color: '#8A2BE2', fontSize: 13, fontWeight: '600' }}> 
              Create Your Outfit
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* FlatList Container */}
      <View 
        className="absolute inset-0 justify-center items-center"
        style={{ top: 120, bottom: 0, left: 0, right: 0, zIndex: 1 }}
      >
        <AnimatedFlatList
          ref={flatListRef}
          data={filteredCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - CARD_WIDTH) / 2 - CARD_SPACING / 2,
            alignItems: 'center',
            paddingVertical: 30,
          }}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="center"
          decelerationRate={0.75}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
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
      
      {/* History button at bottom of screen */}
      <View 
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingHorizontal: 20,
          zIndex: 100, // Ensure this view is on top
        }}
      >
        <TouchableOpacity
          onPress={() => {
            console.log("History button pressed!"); // Add log for debugging
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/modal/history'); 
          }}
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
            <Ionicons name="time-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              View Outfit History
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}