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
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
// Import data from the new apparelData.js file
import { predefinedOutfits, getOutfitDetailsForNavigation, allOutfitItems } from '../data/apparelData';
import PlusIconImage from '../../assets/PlusIcon2.png'; // Keep this as it's UI specific
import { useGlobalContext } from '../context/GlobalProvider'; // Added import
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage
// import HangerIconImage from '../../assets/HangerIcon.png'; // This seems unused, removing unless specified

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Remove individual image imports as they are now handled in apparelData.js
// import HoodieImage from '../../assets/outfits/hoodie1.png';
// import PantsImage from '../../assets/outfits/pants1.png';
// ... and so on for all other outfit item and mannequin images

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');
// Adjust card width to be smaller to show more of adjacent cards
const CARD_WIDTH = width * 0.7; 
// Define spacing between cards for better symmetry
const CARD_SPACING = 16;
// Define animation configuration values
const ANIMATION_SPEED = 200;
const INACTIVE_SCALE = 0.90; // Adjusted for a noticeable but not too drastic scale change

// Define selectable options for Occasion (STYLE_OPTIONS removed)
// const STYLE_OPTIONS = [...]; // Removed

const OCCASION_OPTIONS = [
  { id: 'casual_day', name: 'Casual Day', icon: 'sunny-outline' },
  { id: 'work', name: 'Work/Office', icon: 'briefcase-outline' },
  { id: 'evening_out', name: 'Evening Out', icon: 'moon-outline' },
  { id: 'special_event', name: 'Special Event', icon: 'gift-outline' },
  { id: 'vacation', name: 'Vacation', icon: 'airplane-outline' },
  { id: 'loungewear', name: 'Loungewear', icon: 'home-outline' },
  { id: 'weekend', name: 'Weekend', icon: 'calendar-outline' },
  { id: 'sport_activity', name: 'Sport Activity', icon: 'basketball-outline' },
];

// Helper function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array]; // Create a copy to avoid mutating the original
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// Helper function to build the cards array
const buildCardsArray = (outfitsToMap) => {
  return [
    {
      id: 'create',
      type: 'create',
      title: 'Create your outfit',
      keywords: ['create', 'new', 'custom', 'design']
    },
    ...outfitsToMap.map(outfit => ({
      id: outfit.id,
      type: 'outfit',
      items: [{ source: outfit.previewImage, height: 300 }],
      keywords: outfit.keywords || [],
      itemKeywords: outfit.items.reduce((acc, itemRef) => {
        const itemDetail = allOutfitItems.find(i => i.id === itemRef.itemId);
        if (itemDetail && itemDetail.keywords) {
          return acc.concat(itemDetail.keywords);
        }
        return acc;
      }, [])
    }))
  ];
};

export default function Home() {
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [prevActiveIndex, setPrevActiveIndex] = useState(0);
  const [showScrollToStart, setShowScrollToStart] = useState(false);
  const { user } = useGlobalContext(); // Get user from context
  const [createdOutfitIds, setCreatedOutfitIds] = useState(new Set());
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [originalCards, setOriginalCards] = useState([]); // To store the initial set of cards
  const [currentCards, setCurrentCards] = useState([]); // Cards to be displayed
  
  // State for occasion filters (selectedStyles removed)
  // const [selectedStyles, setSelectedStyles] = useState(new Set()); // Removed
  const [selectedOccasions, setSelectedOccasions] = useState(new Set());
  
  // State for General Search Settings
  const [selectedGender, setSelectedGender] = useState(null); // null, 'male', 'female', 'unisex'
  const [showOnlyGenerated, setShowOnlyGenerated] = useState(false);
  
  // Animation values for button appearance
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [buttonVisible, setButtonVisible] = useState(false);
  
  // Search modal state and animation values
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState('search'); // 'search', 'style', or 'occasion'
  const searchButtonRef = useRef(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const modalAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation values for each section's expansion (styleSectionHeight removed)
  const searchSectionHeight = useRef(new Animated.Value(expandedSection === 'search' ? 1 : 0)).current;
  // const styleSectionHeight = useRef(new Animated.Value(expandedSection === 'style' ? 1 : 0)).current; // Removed
  const occasionSectionHeight = useRef(new Animated.Value(expandedSection === 'occasion' ? 1 : 0)).current;
  const generalSectionHeight = useRef(new Animated.Value(expandedSection === 'general' ? 1 : 0)).current; // New animation value for general
  
  const flatListRef = React.useRef();
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listScale = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const [isShuffling, setIsShuffling] = useState(false);
  const rotationAnimationLoop = useRef(null);

  // Calculate the ShuffleIndicator opacity to be inverse of listOpacity
  const shuffleIndicatorOpacity = listOpacity.interpolate({
    inputRange: [0.1, 1], // From faded out list to fully visible list
    outputRange: [0.9, 0], // Indicator fully visible to fully transparent
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const loadCreatedOutfitIds = async () => {
      let ids = new Set();
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const parsedUser = JSON.parse(storedUserString);
          if (parsedUser && parsedUser.createdImages && parsedUser.createdImages.length > 0) {
            parsedUser.createdImages.forEach(img => ids.add(img.outfitId));
            console.log("Home: Loaded createdOutfitIds from AsyncStorage");
          }
        }
      } catch (e) {
        console.error("Home: Failed to load user from AsyncStorage for checkmarks:", e);
        // Optionally, could fallback to context user here if AsyncStorage fails
        // For now, if AsyncStorage fails, it might mean no checkmarks or checkmarks based on context user if implemented below
      }

      // Fallback or primary load from context if AsyncStorage didn't populate (or as an additional check)
      // This logic ensures that if AsyncStorage is empty/fails, context can still provide data.
      // And if both have data, AsyncStorage is preferred by the order of operations.
      if (ids.size === 0 && user && user.createdImages && user.createdImages.length > 0) {
         console.log("Home: Loading createdOutfitIds from GlobalContext as fallback or primary if AsyncStorage empty");
         user.createdImages.forEach(img => ids.add(img.outfitId));
      }
      
      setCreatedOutfitIds(ids);
    };

    loadCreatedOutfitIds();
  }, [user]); // Re-run if user context changes (e.g., login/logout)

  useEffect(() => {
    const shuffledOutfits = shuffleArray(predefinedOutfits); // Shuffle on initial load
    const initialCardsData = buildCardsArray(shuffledOutfits);
    setOriginalCards(initialCardsData);
    setCurrentCards(initialCardsData);
  }, []);

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

  // Open the search modal with animation
  const handleOpenSearchModal = () => {
    // Measure the search button's position
    if (searchButtonRef.current) {
      searchButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setButtonPosition({ x: pageX, y: pageY, width, height });
        
        // Show the modal
        setIsSearchModalVisible(true);
        
        // Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Start the animation with better easing
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 450, // Slightly longer duration for smoother effect
          easing: Easing.out(Easing.cubic), // More natural cubic easing
          useNativeDriver: true,
        }).start();
      });
    }
  };
  
  // Close the search modal with animation
  const handleCloseSearchModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 350,
      easing: Easing.in(Easing.cubic), // Matching cubic easing
      useNativeDriver: true,
    }).start(() => {
      setIsSearchModalVisible(false);
    });
  };

  // Toggle section expansion with animation
  const toggleSection = (section) => {
    if (expandedSection !== section) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Collapse current section with spring animation
      const collapseConfig = {
        toValue: 0,
        damping: 20,
        mass: 0.9,
        stiffness: 80,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: false,
      };
      if (expandedSection === 'search') {
        Animated.spring(searchSectionHeight, collapseConfig).start();
      } else if (expandedSection === 'occasion') { // Removed 'style' case
        Animated.spring(occasionSectionHeight, collapseConfig).start();
      } else if (expandedSection === 'general') { // New case for general
        Animated.spring(generalSectionHeight, collapseConfig).start();
      }
      
      // Expand new section after a short delay with spring animation
      const expandConfig = {
        toValue: 1,
        damping: 22,
        mass: 1,
        stiffness: 65,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        useNativeDriver: false,
      };
      setTimeout(() => {
        if (section === 'search') {
          Animated.spring(searchSectionHeight, expandConfig).start();
        } else if (section === 'occasion') { // Removed 'style' case
          Animated.spring(occasionSectionHeight, expandConfig).start();
        } else if (section === 'general') { // New case for general
          Animated.spring(generalSectionHeight, expandConfig).start();
        }
      }, 100);
      
      setExpandedSection(section);
    }
  };

  // Toggle functions for occasion (toggleStyle removed)
  // const toggleStyle = (styleId) => { ... }; // Removed

  const toggleOccasion = (occasionId) => {
    setSelectedOccasions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(occasionId)) {
        newSet.delete(occasionId);
      } else {
        newSet.add(occasionId);
      }
      return newSet;
    });
  };

  // Function to handle the search logic
  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    const occasionsSelected = selectedOccasions.size > 0;
    const genderSelected = selectedGender !== null;
    const onlyGeneratedSelected = showOnlyGenerated;

    if (!query && !occasionsSelected && !genderSelected && !onlyGeneratedSelected) {
      // If no search query and no filters, reset to original cards
      setCurrentCards(originalCards);
      setIsSearching(false);
      handleCloseSearchModal();
      return;
    }

    const filtered = originalCards.filter(card => {
      // Keyword search (text input)
      const keywordMatch = query ? (
        (card.title && card.title.toLowerCase().includes(query)) ||
        (card.keywords && card.keywords.some(k => k.toLowerCase().includes(query))) ||
        (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase().includes(query)))
      ) : true; // If no query, keyword match is true by default

      // Occasion filter
      const occasionMatch = occasionsSelected ? 
        Array.from(selectedOccasions).some(occasionId => 
          (card.keywords && card.keywords.some(k => k.toLowerCase().includes(occasionId.toLowerCase()))) ||
          (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase().includes(occasionId.toLowerCase())))
        ) 
        : true; // If no occasions selected, occasion match is true
      
      // Gender filter
      const genderMatch = genderSelected ?
        (card.keywords && card.keywords.some(k => k.toLowerCase() === selectedGender.toLowerCase())) ||
        (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase() === selectedGender.toLowerCase()))
        : true; // If no gender selected, gender match is true

      // Show only generated filter
      const generatedMatch = onlyGeneratedSelected ?
        createdOutfitIds.has(card.id) 
        : true; // If not selected, show all

      if (onlyGeneratedSelected && card.type === 'outfit') {
        console.log(`Filtering generated: card.id=${card.id}, createdOutfitIds:`, Array.from(createdOutfitIds), `onlyGeneratedSelected: ${onlyGeneratedSelected}, match: ${createdOutfitIds.has(card.id)}`);
      }
      
      // Create card handling: only filter by text query, ignore style/occasion for it unless explicitly keyworded for them
      if (card.type === 'create') {
        return query ? (
          (card.title && card.title.toLowerCase().includes(query)) ||
          (card.keywords && card.keywords.some(k => k.toLowerCase().includes(query)))
        ) : !(occasionsSelected || genderSelected || onlyGeneratedSelected); // If query is empty, show create card only if no filters are active
      }

      return keywordMatch && occasionMatch && genderMatch && generatedMatch; // Added genderMatch and generatedMatch
    });

    setCurrentCards(filtered);
    setIsSearching(true); // A search is active if query or filters are applied
    handleCloseSearchModal();
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  };

  // Function to clear the search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedOccasions(new Set());
    setSelectedGender(null); // Clear gender
    setShowOnlyGenerated(false); // Clear show only generated
    // Reset to originalCards which holds the current shuffled order before search
    setCurrentCards(originalCards); 
    setIsSearching(false);
    if (isSearchModalVisible) handleCloseSearchModal();
  };

  const handleReload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsShuffling(true);

    rotationValue.setValue(0);
    rotationAnimationLoop.current = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotationAnimationLoop.current.start();

    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 0.1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(listScale, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      })
    ]).start(() => {
      const shuffledOutfits = shuffleArray(predefinedOutfits);
      const newCardData = buildCardsArray(shuffledOutfits);

      setOriginalCards(newCardData);
      setCurrentCards(newCardData);

      setSearchQuery('');
      setSelectedOccasions(new Set());
      setIsSearching(false);

      setTimeout(() => {
        if (flatListRef.current) {
          if (newCardData.length > 1) {
            flatListRef.current.scrollToIndex({ index: 1, animated: false, viewPosition: 0.5 });
          } else {
            flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
          }
        }
        Animated.parallel([
          Animated.spring(listScale, {
            toValue: 1,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(listOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setIsShuffling(false);
          if (rotationAnimationLoop.current) {
            rotationAnimationLoop.current.stop();
          }
          // rotationValue.setValue(0); // No need to reset if it's hidden
        });
      }, 75);
    });
  };

  const renderCard = ({ item, index }) => {
    let cardContent;
    let cardClasses;
    let cardStyle = {}; 

    const inputRange = [
      (index - 1.5) * (CARD_WIDTH + CARD_SPACING), // Start animations a bit earlier
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1.5) * (CARD_WIDTH + CARD_SPACING), // End animations a bit later
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [INACTIVE_SCALE, 1, INACTIVE_SCALE],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7], // Non-active cards are less opaque
      extrapolate: 'clamp',
    });

    // Opacity for the BlurView, making it visible only for non-active cards
    const blurViewOpacity = scrollX.interpolate({
      inputRange: [
        (index - 1) * (CARD_WIDTH + CARD_SPACING), 
        index * (CARD_WIDTH + CARD_SPACING),       
        (index + 1) * (CARD_WIDTH + CARD_SPACING), 
      ],
      outputRange: [0.6, 0, 0.6], // Further reduced max opacity for enhanced subtlety
      extrapolate: 'clamp',
    });

    const isActive = index === activeCardIndex;

    const animatedStyle = {
      transform: [{ scale }],
      opacity,
    };

    if (item.type === 'create') {
      cardClasses = "h-[400px] rounded-2xl justify-center items-center overflow-hidden";
      cardStyle = {
        borderColor: '#A020F0',
        borderWidth: 1.5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
      };
      cardContent = (
        <>
          <LinearGradient
            colors={['#301A4A', '#200F3A']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{
            width: 120, height: 120, marginBottom: 24,
            shadowColor: '#A020F0', shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.75, shadowRadius: 15, elevation: 10,
          }}>
            <Image source={PlusIconImage} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
          <Text className="text-2xl font-bold text-gray-100 text-center px-6">{item.title}</Text>
          <Text className="text-sm text-gray-300 mt-2 text-center px-8">
            Tap to create your perfect outfit combination
          </Text>
        </>
      );
    } else if (item.type === 'outfit') {
      cardClasses = "h-[400px] rounded-2xl overflow-hidden";
      cardStyle = {
        shadowColor: isActive ? '#8A2BE2' : '#000000',
        shadowOffset: { width: 0, height: isActive ? 6 : 3 },
        shadowOpacity: isActive ? 0.25 : 0.15,
        shadowRadius: isActive ? 12 : 8,
        elevation: isActive ? 12 : 6,
        // No direct background color, BlurView will provide it
      };
      cardContent = (
        <View className="flex-1 justify-center items-center w-full">
          <View className="p-4 justify-center items-center">
            {/* This now directly uses the preview image from the mapped card item */}
            {item.items.map((itemData, imgIndex) => {
              const rotation = imgIndex % 2 === 0 ? '-1.5deg' : '1.5deg'; // Kept for consistency if needed
              return (
                <View key={`${item.id}-preview-${imgIndex}`} className="items-center mb-2">
                  <Image
                    source={itemData.source} // This is outfit.previewImage
                    className="rounded-lg"
                    style={{
                      width: CARD_WIDTH * 0.8,
                      height: itemData.height, // Using predefined height for preview
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 5,
                      transform: [{ rotate: rotation }],
                    }}
                    resizeMode="contain"
                  />
                  {/* No individual labels for preview images on the card */}
                </View>
              );
            })}
          </View>
          {/* Checkmark for created outfits using createdOutfitIds state */}
          {createdOutfitIds.has(item.id) && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#8A2BE2" />
            </View>
          )}
        </View>
      );
    } else {
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
          { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          className={cardClasses}
          style={cardStyle}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (item.type === 'outfit') {
              // Fetch detailed items for navigation using the new helper
              const detailedItemsForNav = getOutfitDetailsForNavigation(item.id);
              if (detailedItemsForNav) {
                router.push({
                  pathname: `/outfit/${item.id}`,
                  params: { items: JSON.stringify(detailedItemsForNav) },
                });
              } else {
                console.warn(`No details found for outfit ID: ${item.id}`);
                // Optionally, show an alert to the user
              }
            }   else if (item.type === 'create') {
    // Navigate to the outfit creation page
    router.push('/outfit/create');
  } else {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  }
          }}
        >
          {cardContent}
          {item.type === 'outfit' && (
            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: blurViewOpacity,
                borderRadius: 16, 
                overflow: 'hidden',
                borderWidth: 0.5, // Added a very subtle border
                borderColor: 'rgba(255, 255, 255, 0.1)', // Translucent white border
              }}
              pointerEvents="none"
            >
              <BlurView
                intensity={60} // Further reduced intensity for a lighter blur
                tint="dark" 
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1A0D2E]">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View 
        className="flex-row justify-between items-center px-6 py-3"
        style={{
          zIndex: 10, 
          backgroundColor: 'rgba(26, 13, 46, 0.95)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(192, 126, 255, 0.15)',
        }}
      >
        {/* Upgrade Button */}
        <TouchableOpacity 
          className="overflow-hidden rounded-full"
          style={{ 
            elevation: 3,
          }}
          onPress={() => console.log('Upgrade pressed')}
          activeOpacity={0.7}
        >
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: 'rgba(192, 126, 255, 0.5)',
            }}
          />
          <LinearGradient
            colors={['#5B21B6', '#2E1065']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-3 py-1.5 flex-row items-center"
          >
            <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Upgrade</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Centered Logo and Text */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: -1
        }}>
          <Text 
            className="text-2xl font-bold"
            style={{
              color: '#FFFFFF',
              textShadowColor: 'rgba(192, 126, 255, 0.3)',
              textShadowOffset: { width: 0, height: 1 }, 
              textShadowRadius: 4
            }}
          >
            OutfitAI
          </Text>
        </View>

        {/* Settings Button */}
        <TouchableOpacity 
          className="overflow-hidden rounded-full"
          style={{ 
            elevation: 3,
          }}
          onPress={() => router.push('/modal/settings')}
          activeOpacity={0.7}
        >
          <View className="p-2">
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Search input & Preferences Icon Row - Now a Search Button Row */}
      <View 
        className="flex-row items-center px-6 py-4" // Parent row for layout
        style={{
          zIndex: 10, 
        }}
      >
        {/* Search Button - Styled like the image, dark theme */}
        <TouchableOpacity 
          ref={searchButtonRef}
          className={`flex-1 rounded-full px-4 py-3.5 shadow-md ${isSearching ? 'bg-purple-700' : 'bg-[#201030]'}`}
          activeOpacity={0.8}
          onPress={handleOpenSearchModal}
          style={{
            // Shadow styles remain the same for the floating effect
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {/* Inner View to center the icon and text */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {!isSearching && (
              <Ionicons name="search" size={20} color={'#D0D0D0'} style={{ marginRight: 8 }} /> 
            )}
            <Text className={`text-base ${isSearching ? 'text-white font-semibold' : 'text-gray-100'}`}>
              {isSearching ? 'Search Active' : 'Start your search'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Create Your Outfit Button & Reload Button - animated appearance/disappearance */}
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
                  outputRange: [10, 0],
                })
              }
            ]
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Create Your Outfit Button */}
            <TouchableOpacity
              style={styles.actionButton}
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
              <Ionicons name="chevron-back" size={18} color="#E0E0E0" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>
                Create Your Outfit
              </Text>
            </TouchableOpacity>
            {/* Spacer View */}
            <View style={{ width: 12 }} />
            {/* Reload Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReload}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color="#E0E0E0" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      
      {/* FlatList Container - Add a gradient background here */}
      <View 
        className="absolute inset-0 justify-center items-center"
        style={{ top: 120, bottom: 0, left: 0, right: 0, zIndex: 1 }}
      >
        <LinearGradient
          colors={['#1A0D2E', '#3B1F78', '#1A0D2E']} // Dark, "fantastic" gradient
          style={StyleSheet.absoluteFill}
        />
        {isSearching && currentCards.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="sad-outline" size={48} color="#888" />
            <Text style={styles.noResultsText}>No outfits found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubText}>Try a different search term.</Text>
          </View>
        ) : (
          <AnimatedFlatList
            ref={flatListRef}
            data={currentCards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ opacity: listOpacity, transform: [{ scale: listScale }] }} // Apply opacity and scale
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
            snapToOffsets={currentCards.map((_, i) => 
              i * (CARD_WIDTH + CARD_SPACING)
            )}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        )}
      </View>

      {/* Shuffle Animation Indicator */}
      {isShuffling && (
          <Animated.View
            style={[
              styles.shuffleIndicatorContainer,
              {
                opacity: shuffleIndicatorOpacity,
                transform: [
                  {
                    rotate: rotationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Icon directly within the animated container */}
            <Ionicons name="sync-outline" size={56} color="#FFFFFF" />
          </Animated.View>
      )}
      
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
            router.push('/main/history'); 
          }}
          activeOpacity={0.7}
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#2C1B4A', // Slightly lighter, distinct dark purple
            shadowColor: '#100520',      // Thematic dark purple shadow
            shadowOffset: { width: 0, height: 3 }, // Increased offset
            shadowOpacity: 0.3,          // Increased opacity
            shadowRadius: 5,             // Increased radius for softer shadow
            elevation: 7,                // Adjusted elevation
            borderRadius: 12,
            paddingVertical: 16, 
            paddingHorizontal: 20,
            flexDirection: 'row', // Moved layout from LinearGradient
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="time-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            View Outfit History
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Modal with blur and floating glass effect */}
      <Modal
        transparent={true}
        visible={isSearchModalVisible}
        onRequestClose={handleCloseSearchModal}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={handleCloseSearchModal}>
          <Animated.View style={[ StyleSheet.absoluteFill, { opacity: modalAnimation } ]}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <View style={{ flex: 1 }}>
          {/* Search Panel - ensure styles are correct */}
          <Animated.View style={{
            marginTop: Platform.OS === 'ios' ? 70 : 50,
            marginHorizontal: 20, marginBottom: 15,
            transform: [
              { translateY: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [buttonPosition.y - 100, 0] }) },
              { scale: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
            ],
            opacity: modalAnimation,
          }}>
            <BlurView intensity={90} tint="dark" style={styles.searchPanelBlurView}>
              <TouchableOpacity style={[styles.sectionHeader, expandedSection === 'search' ? styles.expandedHeader : styles.collapsedHeader]} activeOpacity={0.8} onPress={() => toggleSection('search')}>
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="search" size={expandedSection === 'search' ? 24 : 20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeaderText, expandedSection === 'search' ? styles.expandedHeaderText : styles.collapsedHeaderText]}>Search</Text>
                </View>
                {expandedSection !== 'search' && <Text style={styles.sectionSubtext}>Find clothing items by keyword</Text>}
              </TouchableOpacity>
              <Animated.View style={{
                  maxHeight: searchSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  height: searchSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  opacity: searchSectionHeight,
                  overflow: 'hidden',
                  transform: [{ scale: searchSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
              }}>
                <View style={{ height: 330 }}>
                  {/* Fixed Search Input */}
                  <View style={{ padding: 20, paddingBottom: 0 }}>
                    <View style={styles.searchInputContainer}>
                      <Ionicons name="search" size={22} color="#A0A0A0" style={{ marginHorizontal: 12 }} />
                      <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search clothing items" 
                        placeholderTextColor="#A0A0A0" 
                        autoCapitalize="none"
                        value={searchQuery}
                        onChangeText={setSearchQuery} // Connect to searchQuery state
                      />
                    </View>
                  </View>

                  {/* Scrollable Content */}
                  <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
                    {/* Popular Searches */}
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionTitle}>Popular Searches</Text>
                      <View style={styles.searchTagsContainer}>
                        {['Summer Outfits', 'Casual Style', 'Formal Wear', 'Street Fashion', 'Minimalist', 'Vintage'].map((tag, index) => (
                          <TouchableOpacity key={index} style={styles.searchTag}>
                            <Text style={styles.searchTagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Recent Searches */}
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      <View style={styles.recentSearchesContainer}>
                        {['Blue Denim Jacket', 'White Sneakers', 'Black Dress', 'Leather Boots'].map((search, index) => (
                          <TouchableOpacity key={index} style={styles.recentSearchItem}>
                            <Ionicons name="time-outline" size={18} color="#A0A0A0" style={{ marginRight: 8 }} />
                            <Text style={styles.recentSearchText}>{search}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            </BlurView>
          </Animated.View>

          {/* Style Preferences Panel (REMOVED) */}
          {/* <Animated.View style={{...}}> ... </Animated.View> */}

          {/* Occasion Panel (Moved up, animation adjusted) */}
          <Animated.View style={{
            marginHorizontal: 20, marginBottom: 15,
            transform: [
              { translateY: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [buttonPosition.y, 0] }) }, // Adjusted from buttonPosition.y + 50
              { scale: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
            ],
            opacity: modalAnimation,
          }}>
            <BlurView intensity={90} tint="dark" style={styles.searchPanelBlurView}>
              <TouchableOpacity style={[styles.sectionHeader, expandedSection === 'occasion' ? styles.expandedHeader : styles.collapsedHeader]} activeOpacity={0.8} onPress={() => toggleSection('occasion')}>
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="calendar-outline" size={expandedSection === 'occasion' ? 24 : 20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeaderText, expandedSection === 'occasion' ? styles.expandedHeaderText : styles.collapsedHeaderText]}>Occasion</Text>
                  </View>
                {expandedSection !== 'occasion' && <Text style={styles.sectionSubtext}>Select the event or occasion</Text>}
              </TouchableOpacity>
              <Animated.View style={{
                  maxHeight: occasionSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  height: occasionSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  opacity: occasionSectionHeight,
                  overflow: 'hidden',
                  transform: [{ scale: occasionSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
              }}>
                <View style={{ padding: 20, height: 330 }}>
                  <ScrollView style={{ maxHeight: 310 }}>
                    {OCCASION_OPTIONS.map((option) => (
                      <TouchableOpacity 
                        key={option.id} 
                        style={[styles.optionContainer, selectedOccasions.has(option.id) && styles.optionSelected]} 
                        activeOpacity={0.8}
                        onPress={() => toggleOccasion(option.id)}
                      >
                        <View style={[styles.iconContainer, selectedOccasions.has(option.id) ? styles.iconContainerSelected : styles.iconContainerDefault]}>
                          <Ionicons name={option.icon} size={24} color={selectedOccasions.has(option.id) ? '#FFFFFF' : '#C07EFF'} />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text style={[styles.optionTitle, selectedOccasions.has(option.id) && styles.optionTextSelected]}>{option.name}</Text>
                          {/* Add subtitle if you have it in OCCASION_OPTIONS */}
                        </View>
                        {selectedOccasions.has(option.id) && (
                          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={styles.selectedCheckmark} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Animated.View>
            </BlurView>
          </Animated.View>
          
          {/* General Search Settings Panel (NEW) */}
          <Animated.View style={{
            marginHorizontal: 20, marginBottom: 15,
            transform: [
              // Ensure this animates after the occasion panel
              { translateY: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [buttonPosition.y + 100, 0] }) }, 
              { scale: modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
            ],
            opacity: modalAnimation,
          }}>
            <BlurView intensity={90} tint="dark" style={styles.searchPanelBlurView}>
              <TouchableOpacity 
                style={[styles.sectionHeader, expandedSection === 'general' ? styles.expandedHeader : styles.collapsedHeader]} 
                activeOpacity={0.8} 
                onPress={() => toggleSection('general')}
              >
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="options-outline" size={expandedSection === 'general' ? 24 : 20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionHeaderText, expandedSection === 'general' ? styles.expandedHeaderText : styles.collapsedHeaderText]}>General Settings</Text>
                </View>
                {expandedSection !== 'general' && <Text style={styles.sectionSubtext}>Filter by gender or generated status</Text>}
              </TouchableOpacity>
              <Animated.View style={{
                  maxHeight: generalSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  height: generalSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  opacity: generalSectionHeight,
                  overflow: 'hidden',
                  transform: [{ scale: generalSectionHeight.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
              }}>
                <View style={{ padding: 20, height: 330 }}>
                  <ScrollView style={{ maxHeight: 310 }}>
                    {/* Gender Selection */}
                    <Text style={styles.sectionTitle}>Gender</Text>
                    <View style={styles.genderOptionsContainer}>
                      {[{id: 'male', name: 'Male', icon: 'male-outline'}, {id: 'female', name: 'Female', icon: 'female-outline'}, {id: 'unisex', name: 'Unisex', icon: 'male-female-outline'}].map((gender) => (
                        <TouchableOpacity
                          key={gender.id}
                          style={[styles.genderOption, selectedGender === gender.id && styles.genderOptionSelected]}
                          onPress={() => setSelectedGender(selectedGender === gender.id ? null : gender.id)}
                        >
                          <Ionicons name={gender.icon} size={20} color={selectedGender === gender.id ? '#FFFFFF' : '#C07EFF'} style={{ marginRight: 8 }} />
                          <Text style={[styles.genderOptionText, selectedGender === gender.id && styles.genderOptionTextSelected]}>{gender.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Show Only Generated Outfits Toggle */}
                    <View style={styles.toggleOptionContainer}>
                      <View style={styles.toggleTextContainer}>
                        <Ionicons name="image-outline" size={22} color="#C07EFF" style={{ marginRight: 10 }}/>
                        <Text style={styles.optionTitle}>Show Generated Outfits Only</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.switchBase, showOnlyGenerated && styles.switchBaseActive]}
                        onPress={() => setShowOnlyGenerated(!showOnlyGenerated)}
                        activeOpacity={0.8}
                      >
                        <Animated.View style={[styles.switchToggle, showOnlyGenerated && styles.switchToggleActive]} />
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            </BlurView>
          </Animated.View>
          
          {/* Footer Actions - ensure styles are correct */}
          <Animated.View style={[
            styles.footerActionsContainer,
            {
              transform: [
                {
                  translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }
              ],
              opacity: modalAnimation
            }
          ]}>
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.6}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchModalButton} activeOpacity={0.8} onPress={handleSearch}>
              <Ionicons name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.searchModalButtonText}>Search</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  
  expandedHeader: {
    paddingVertical: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
  },
  
  collapsedHeader: {
    backgroundColor: 'rgba(30, 20, 50, 0.7)', // Increased opacity
  },
  
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sectionHeaderText: {
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  expandedHeaderText: {
    fontSize: 24,
  },
  
  collapsedHeaderText: {
    fontSize: 18,
  },
  
  sectionSubtext: {
    color: '#C9C9C9',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchButtonText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C1B4A',
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.2)',
    borderRadius: 8,
    height: 56,
  },
  searchInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(44, 27, 74, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.15)',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 46 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  optionSelected: {
    backgroundColor: '#7B2CBF', // Purple background for selected
    borderColor: '#C07EFF',
  },
  optionTextSelected: {
    color: '#FFFFFF', // White text for selected
  },
  iconContainerDefault: {
    backgroundColor: 'rgba(192, 126, 255, 0.15)',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slightly different background for selected icon
  },
  selectedCheckmark: {
    marginLeft: 'auto', // Pushes checkmark to the right
    paddingLeft: 10, // Some space before the checkmark
  },
  searchPanelBlurView: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(192, 126, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
    marginBottom: 15,
  },
  footerActionsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  searchModalButton: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  searchModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  
  searchTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  
  searchTag: {
    backgroundColor: 'rgba(192, 126, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.3)',
  },
  
  searchTagText: {
    color: '#C07EFF',
    fontSize: 13,
    fontWeight: '500',
  },
  
  recentSearchesContainer: {
    marginTop: 8,
  },
  
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  recentSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  
  colorSection: {
    marginBottom: 24,
  },
  
  colorSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 15, // Adjusted top position
    left: '50%', // Center horizontally
    transform: [{ translateX: -16 }], // For 24px icon, moved 4px left of center: -(24/2) - 4 = -16
    backgroundColor: 'transparent',
    // Glow effect
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
    // No padding or border radius needed if the container itself isn't visible
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#C0C0C0',
    textAlign: 'center',
  },
  noResultsSubText: {
    marginTop: 6,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  actionButton: { // New shared style for Create Outfit and Reload buttons
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#C07EFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4, 
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 20, 70, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.5)',
  },
  actionButtonText: { // Style for the text within the action buttons
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  shuffleIndicatorContainer: {
    position: 'absolute',
    top: height * 0.42, // Position remains the same
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center', // Ensure icon is centered if container has implicit size
    zIndex: 9999,
    // No explicit width/height, it will size to the icon + any shadow padding
    // Subtle shadow for the icon itself
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22, 
    shadowRadius: 2.22,
    elevation: 3, // Minimal elevation for Android
  },
  // Styles for Gender Selection
  genderOptionsContainer: {
    flexDirection: 'column', // Stack items vertically
    marginBottom: 24,
    marginTop: 8,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Increased padding
    paddingHorizontal: 16, // Increased padding
    borderRadius: 10, // Slightly less rounded for a more 'button' feel
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.3)',
    backgroundColor: 'rgba(192, 126, 255, 0.1)',
    marginBottom: 10, // Add space between stacked options
  },
  genderOptionSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#C07EFF',
    shadowColor: '#C07EFF', // Add a glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  genderOptionText: {
    color: '#E0E0E0', // Lighter text for unselected
    fontSize: 15, // Slightly larger
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600', // Bolder text for selected
  },

  // Styles for Toggle Switch
  toggleOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(44, 27, 74, 0.65)', // Slightly more opaque background
    borderRadius: 10,
    paddingHorizontal: 16, // Consistent horizontal padding
    paddingVertical: 18, // Increased vertical padding for better touch area
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.25)', // Slightly more visible border
  },
  toggleTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },
  switchBase: {
    width: 52, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Darker off state
    justifyContent: 'center',
    paddingHorizontal: 2, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', // Subtle border for the base
  },
  switchBaseActive: {
    backgroundColor: '#7B2CBF', 
    borderColor: '#A020F0', // Border color for active state
  },
  switchToggle: {
    width: 26, 
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0E0E0', // Lighter toggle for off state
    alignSelf: 'flex-start', 
    shadowColor: '#000', // Add shadow to the toggle
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  switchToggleActive: {
    alignSelf: 'flex-end', 
    backgroundColor: '#FFFFFF', // Bright white toggle for on state
  },
});