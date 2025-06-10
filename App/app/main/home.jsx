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
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
// Import data from the new apparelData.js file (keeping as fallback)
// import { predefinedOutfits, getOutfitDetailsForNavigation, allOutfitItems } from '../data/apparelData';
import PlusIconImage from '../../assets/PlusIcon2.png'; // Keep this as it's UI specific
import { useGlobalContext } from '../context/GlobalProvider'; // Added import
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage
import { Client, Storage } from 'react-native-appwrite'; // Added Appwrite imports
import axios from 'axios'; // Added axios for API calls

// import HangerIconImage from '../../assets/HangerIcon.png'; // This seems unused, removing unless specified

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Appwrite configuration
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '682371f4001597e0b4a7';
const APPWRITE_OUTFIT_BUCKET_ID = '683ef7880025791e9d93'; // For outfit images

// Backend URL
const BACKEND_URL = 'https://18c9-109-245-204-138.ngrok-free.app';

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
  { id: 'business_formal', name: 'Business Formal', icon: 'business-outline' },
  { id: 'wedding_guest', name: 'Wedding Guest', icon: 'rose-outline' },
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



// Helper function to get Appwrite image URL for outfits
const getAppwriteOutfitImageUrl = (fileId) => {
  try {
    if (!fileId || fileId.trim() === '') {
      console.error('Error getting Appwrite image URL: fileId is missing or empty');
      return null;
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    const storage = new Storage(client);
    
    // Use getFilePreview instead of getFileDownload for better public access
    // Preview method is usually more permissive and works without authentication
    const result = storage.getFileDownload(
      APPWRITE_OUTFIT_BUCKET_ID, 
      fileId,
      400, // width
      400, // height
      'center', // gravity
      80, // quality
      0, // border width
      '', // border color
      0, // border radius
      1, // opacity
      0, // rotation
      '#FFFFFF', // background color
      'jpg' // output format
    );
    
    return result.href;
  } catch (error) {
    console.error('Error getting Appwrite outfit image URL:', error);
    return null;
  }
};

// Helper function to build the cards array
const buildCardsArray = (outfitsToMap, isMongoData = false) => {
  return [
    {
      id: 'create',
      type: 'create',
      title: 'Create your outfit',
      keywords: ['create', 'new', 'custom', 'design']
    },
    ...outfitsToMap.map(outfit => {
      if (isMongoData) {
        // Handle MongoDB outfits with Appwrite images
        
        const imageUrl = outfit.file ? getAppwriteOutfitImageUrl(outfit.file) : null;
        
        if (!imageUrl) {
          console.warn(`No valid image URL for MongoDB outfit: ${outfit.name || outfit.id}, fileId: ${outfit.file}`);
          return null;
        }
        
        return {
          id: outfit._id || outfit.id || outfit.name,
          type: 'outfit',
          items: [{ 
            source: { uri: imageUrl },
            height: 300 
          }],
          keywords: outfit.keywords || [],
          mongoData: outfit,
          itemKeywords: []
        };
      } else {
        // Handle predefined outfits from apparelData (fallback)
        
        return {
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
        };
      }
    }).filter(outfit => outfit !== null)
  ];
};

export default function Home() {
  const router = useRouter();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [prevActiveIndex, setPrevActiveIndex] = useState(0);
  const [showScrollToStart, setShowScrollToStart] = useState(false);
  const { user, isPro } = useGlobalContext(); // Get user from context
  const [createdOutfitIds, setCreatedOutfitIds] = useState(new Set());
  
  // State for MongoDB outfits
  const [mongoOutfits, setMongoOutfits] = useState([]);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);
  
  // State for AsyncStorage user data (separate from context user)
  const [asyncStorageUser, setAsyncStorageUser] = useState(null);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [originalCards, setOriginalCards] = useState([]); // To store the initial set of cards
  const [currentCards, setCurrentCards] = useState([]); // Cards to be displayed
  
  // State for occasion filters (selectedStyles removed)
  // const [selectedStyles, setSelectedStyles] = useState(new Set()); // Removed
  const [selectedOccasions, setSelectedOccasions] = useState(new Set());
  
  // State for General Search Settings
  const [selectedGender, setSelectedGender] = useState(null); // null, 'male', 'female' (unisex removed)
  const [generatedFilterStatus, setGeneratedFilterStatus] = useState('all'); // 'all', 'generated', 'not_generated'
  
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

  // useEffect(() => {
  //   if (isPro) {
  //     console.log('isPro:', isPro);
  //   } else {
  //     router.push('/utiils/Paywall')
  //   }
  // }, [isPro]);

  useEffect(() => {
    const loadCreatedOutfitIds = async () => {
      let ids = new Set();
      let asyncUser = null;
      
      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const parsedUser = JSON.parse(storedUserString);
          asyncUser = parsedUser; // Store the complete user data
          
          if (parsedUser && parsedUser.createdImages && parsedUser.createdImages.length > 0) {
            parsedUser.createdImages.forEach(img => ids.add(img.outfitId));
          }
        }
      } catch (e) {
      }

      // Fallback or primary load from context if AsyncStorage didn't populate
      if (ids.size === 0 && user && user.createdImages && user.createdImages.length > 0) {
         user.createdImages.forEach(img => ids.add(img.outfitId));
         // If AsyncStorage was empty, use context user as fallback
         if (!asyncUser) {
           asyncUser = user;
         }
      }
      

      
      setAsyncStorageUser(asyncUser); // Store the AsyncStorage user data
      setCreatedOutfitIds(ids);
    };

    loadCreatedOutfitIds();
  }, [user]); // Re-run if user context changes (e.g., login/logout)

  // Fetch outfits from MongoDB and log the results
  useEffect(() => {
    const fetchOutfitsFromMongoDB = async () => {
      try {
        setIsLoadingOutfits(true);
        console.log('Fetching outfits from MongoDB using axios...');
        const response = await axios.get(`${BACKEND_URL}/getAllOutfits`);
        console.log('✅ Successfully fetched outfits from MongoDB:');
        console.log('📦 Full response data:', response.data);
        console.log('📊 Number of outfits:', response.data.length);
        
        // Log each outfit individually for better readability
        response.data.forEach((outfit, index) => {
          console.log(`🎽 Outfit ${index + 1}:`, {
            name: outfit.name,
            file: outfit.file,
            keywords: outfit.keywords,
            items: outfit.items,
            _id: outfit._id
          });
        });
        
        // Store the fetched outfits
        setMongoOutfits(response.data);
        
      } catch (error) {
        console.error('❌ Error fetching outfits from MongoDB:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
        // Set empty array so it falls back to apparelData
        setMongoOutfits([]);
      } finally {
        setIsLoadingOutfits(false);
      }
    };
    
    fetchOutfitsFromMongoDB();
  }, []);

  // Update cards when outfits are loaded
  useEffect(() => {
    if (!isLoadingOutfits) {
      let outfitsToUse;
      let isMongoData = false;
      
      if (mongoOutfits.length > 0) {
        console.log('Using MongoDB outfits for cards');
        outfitsToUse = shuffleArray(mongoOutfits);
        isMongoData = true;
      } else {
        console.log('Using apparelData outfits as fallback');
        outfitsToUse = shuffleArray(predefinedOutfits);
        isMongoData = false;
      }
      
      const initialCardsData = buildCardsArray(outfitsToUse, isMongoData);
      setOriginalCards(initialCardsData);
      setCurrentCards(initialCardsData);
      
      console.log(`Built ${initialCardsData.length} cards (including create card)`);
    }
  }, [mongoOutfits, isLoadingOutfits]);

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

    if (!query && !occasionsSelected && !genderSelected && generatedFilterStatus === 'all') {
      // If no search query and no filters, reset to original cards
      setCurrentCards(originalCards);
      setIsSearching(false);
      handleCloseSearchModal();
      return;
    }

    // Map occasion IDs to relevant keywords for better matching
    const occasionKeywordMap = {
      'casual_day': ['casual', 'everyday', 'relaxed', 'comfort', 'loungewear', 'casual day'],
      'work': ['work', 'office', 'business', 'professional', 'business casual', 'formal'],
      'evening_out': ['evening', 'party', 'stylish', 'chic', 'evening out'],
      'special_event': ['event', 'formal', 'elegant', 'party', 'special event', 'wedding', 'business formal'],
      'vacation': ['vacation', 'summer', 'bohemian', 'light', 'casual'],
      'loungewear': ['loungewear', 'comfort', 'casual', 'relaxed', 'everyday'],
      'weekend': ['weekend', 'casual', 'relaxed', 'comfort'],
      'sport_activity': ['sport', 'sporty', 'athletic', 'workout', 'active', 'sport activity'],
      'business_formal': ['business formal', 'formal', 'business', 'suit', 'professional', 'work', 'office'],
      'wedding_guest': ['wedding guest', 'wedding', 'formal', 'elegant', 'event', 'special event']
    };

    const filtered = originalCards.filter(card => {
      // Keyword search (text input)
      const keywordMatch = query ? (
        (card.title && card.title.toLowerCase().includes(query)) ||
        (card.keywords && card.keywords.some(k => k.toLowerCase().includes(query))) ||
        (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase().includes(query)))
      ) : true; // If no query, keyword match is true by default

      // Occasion filter - improved logic with keyword mapping
      const occasionMatch = occasionsSelected ? 
        Array.from(selectedOccasions).some(occasionId => {
          const occasionKeywords = occasionKeywordMap[occasionId] || [occasionId];
          return occasionKeywords.some(occasionKeyword => 
            (card.keywords && card.keywords.some(k => k.toLowerCase().includes(occasionKeyword.toLowerCase()))) ||
            (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase().includes(occasionKeyword.toLowerCase())))
          );
        })
        : true; // If no occasions selected, occasion match is true
      
      // Gender filter - improved logic
      const genderMatch = genderSelected ?
        (card.keywords && card.keywords.some(k => k.toLowerCase() === selectedGender.toLowerCase())) ||
        (card.itemKeywords && card.itemKeywords.some(k => k.toLowerCase() === selectedGender.toLowerCase()))
        : true; // If no gender selected, gender match is true

      // Show only generated filter - updated logic
      let generatedOutfitMatch = true;
      if (card.type === 'outfit') { // Ensure this logic only applies to outfit cards
        if (generatedFilterStatus === 'generated') {
          // For MongoDB outfits, check if createdImages has an item with outfitId matching the outfit name
          // For predefined outfits, use the existing createdOutfitIds logic
          if (card.mongoData) {
            console.log(card.mongoData.name, asyncStorageUser?.createdImages)
            generatedOutfitMatch = asyncStorageUser?.createdImages?.some(img => img.outfitId === card.mongoData.name) || false;
          } else {
            generatedOutfitMatch = createdOutfitIds.has(card.id);
          }
        } else if (generatedFilterStatus === 'not_generated') {
          // For MongoDB outfits, check if createdImages does NOT have an item with outfitId matching the outfit name
          // For predefined outfits, use the existing createdOutfitIds logic
          if (card.mongoData) {
            generatedOutfitMatch = !(asyncStorageUser?.createdImages?.some(img => img.outfitId === card.mongoData.name) || false);
          } else {
            generatedOutfitMatch = !createdOutfitIds.has(card.id);
          }
        }
      }

      if (card.type === 'outfit' && (generatedFilterStatus === 'generated' || generatedFilterStatus === 'not_generated')) {
        console.log(`Filtering: card.id=${card.id}, status=${generatedFilterStatus}, createdOutfitIds:`, Array.from(createdOutfitIds), `match: ${generatedFilterStatus === 'generated' ? createdOutfitIds.has(card.id) : !createdOutfitIds.has(card.id)}`);
      }
      
      // Handle 'create' card separately first
      if (card.type === 'create') {
        if (query) {
          return (
            (card.title && card.title.toLowerCase().includes(query)) ||
            (card.keywords && card.keywords.some(k => k.toLowerCase().includes(query)))
          );
        } else {
          // Show create card if no text query AND no other filters are active (occasion, gender, or specific generated status)
          return !occasionsSelected && !genderSelected && generatedFilterStatus === 'all';
        }
      }
      
      return keywordMatch && occasionMatch && genderMatch && generatedOutfitMatch; // Added genderMatch and generatedMatch
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
    setGeneratedFilterStatus('all'); // Reset generated filter to 'all'
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
      // Use MongoDB outfits if available, otherwise use predefined outfits
      const outfitsToUse = mongoOutfits.length > 0 ? mongoOutfits : predefinedOutfits;
      const isMongoData = mongoOutfits.length > 0;
      const shuffledOutfits = shuffleArray(outfitsToUse);
      const newCardData = buildCardsArray(shuffledOutfits, isMongoData);

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
            {/* This now uses either MongoDB outfit images or predefined images */}
            {item.items.map((itemData, imgIndex) => {
              const rotation = imgIndex % 2 === 0 ? '-1.5deg' : '1.5deg'; // Kept for consistency if needed
              return (
                <View key={`${item.id}-preview-${imgIndex}`} className="items-center mb-2">
                  <Image
                    source={itemData.source} // This could be Appwrite URL or local image
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
                    onError={(error) => {
                      console.log('Image load error for outfit:', item.id, error);
                    }}
                  />
                  {/* No individual labels for preview images on the card */}
                </View>
              );
            })}
          </View>
          {/* Checkmark for created outfits using createdOutfitIds state */}
          {(() => {
            // Debug logging for checkmark logic
            if (item.mongoData) {

              
              if (asyncStorageUser?.createdImages) {

                
                const isMatched = asyncStorageUser.createdImages.some(img => img.outfitId === item.mongoData.name);
                return isMatched;
              }
              return false;
            } else {
              // For predefined outfits
              const isMatched = createdOutfitIds.has(item.id);
              return isMatched;
            }
          })() && (
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
              // Check if this is a MongoDB outfit or predefined outfit
              const mongoOutfit = item.mongoData;
              
              if (mongoOutfit) {
                // For MongoDB outfits, send the raw item IDs and let the detail page handle Appwrite URLs
                
                router.push({
                  pathname: `/outfit/${mongoOutfit.name}`,
                  params: { 
                    id: mongoOutfit.name,
                    items: JSON.stringify(mongoOutfit.items), // Send raw Appwrite file IDs
                    outfitName: mongoOutfit.name || 'Custom Outfit'
                  },
                });
              } else {
                // For predefined outfits, use existing logic
                const detailedItemsForNav = getOutfitDetailsForNavigation(item.id);
                if (detailedItemsForNav) {
                  router.push({
                    pathname: `/outfit/${item.id}`,
                    params: { items: JSON.stringify(detailedItemsForNav) },
                  });
                } else {
                  console.warn(`No details found for outfit ID: ${item.id}`);
                }
              }
            } else if (item.type === 'create') {
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

  // Add loading indicator
  if (isLoadingOutfits) {
    return (
      <SafeAreaView className="flex-1 bg-[#1A0D2E]">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#C07EFF" />
          <Text className="text-white text-lg mt-4">Loading outfits...</Text>
          <Text className="text-gray-300 text-sm mt-2 text-center px-8">
            Fetching your personalized outfits from the database
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          onPress={() => router.push('/utiils/Paywall')}
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
                        {['casual', 'formal', 'sporty', 'business', 'summer', 'elegant', 'streetwear', 'comfortable'].map((tag, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.searchTag}
                            onPress={() => {
                              setSearchQuery(tag);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                          >
                            <Text style={styles.searchTagText}>{tag}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Recent Searches */}
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                      <Text style={styles.sectionTitle}>Item Categories</Text>
                      <View style={styles.recentSearchesContainer}>
                        {['hoodie', 'dress', 'jeans', 'sneakers', 'suit', 'heels', 'polo', 'shorts'].map((search, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.recentSearchItem}
                            onPress={() => {
                              setSearchQuery(search);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                          >
                            <Ionicons name="search-outline" size={18} color="#A0A0A0" style={{ marginRight: 8 }} />
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
                      {([
                        { id: null, name: 'All Genders', icon: 'people-outline' }, // null id for 'All'
                        { id: 'male', name: 'Male', icon: 'male-outline' }, 
                        { id: 'female', name: 'Female', icon: 'female-outline' }
                      ]).map((gender) => (
                        <TouchableOpacity
                          key={gender.id === null ? 'all' : gender.id} // Handle null key
                          style={[styles.genderOption, selectedGender === gender.id && styles.genderOptionSelected]}
                          onPress={() => setSelectedGender(gender.id)}
                        >
                          <Ionicons name={gender.icon} size={20} color={selectedGender === gender.id ? '#FFFFFF' : '#E0E0E0'} style={{ marginRight: 8 }} />
                          <Text style={[styles.genderOptionText, selectedGender === gender.id && styles.genderOptionTextSelected]}>{gender.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Generated Outfits Filter */}
                    <Text style={styles.sectionTitle}>Filter Generated Outfits</Text>
                    <View style={styles.generatedFilterContainer}>
                      {([
                        { id: 'all', name: 'All Outfits' },
                        { id: 'generated', name: 'Generated Only' },
                        { id: 'not_generated', name: 'Not Generated Only' },
                      ]).map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.generatedFilterOption,
                            generatedFilterStatus === option.id && styles.generatedFilterOptionSelected,
                          ]}
                          onPress={() => setGeneratedFilterStatus(option.id)}
                        >
                          <Text 
                            style={[
                              styles.generatedFilterOptionText,
                              generatedFilterStatus === option.id && styles.generatedFilterOptionTextSelected
                            ]}
                          >
                            {option.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            </BlurView>
          </Animated.View>
          
          {/* Footer Actions - Three glassy bubbly buttons */}
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
            {/* Clear All Button - Left */}
            <TouchableOpacity 
              style={styles.glassyClearButton} 
              activeOpacity={0.7} 
              onPress={handleClearSearch}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.glassyClearButtonText}>Clear</Text>
              
              {/* Active Filters Count Bubble */}
              {(() => {
                const activeFiltersCount = 
                  (searchQuery.length > 0 ? 1 : 0) +
                  (selectedOccasions.size > 0 ? 1 : 0) +
                  (selectedGender !== null ? 1 : 0) +
                  (generatedFilterStatus !== 'all' ? 1 : 0);
                
                return activeFiltersCount > 0 ? (
                  <View style={styles.filterCountBubble}>
                    <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
                  </View>
                ) : null;
              })()}
            </TouchableOpacity>

            {/* Search Button - Center (Bigger and Purple) */}
            <TouchableOpacity 
              style={styles.glassySearchButton} 
              activeOpacity={0.8} 
              onPress={handleSearch}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.glassySearchButtonText}>Search</Text>
            </TouchableOpacity>

            {/* Close Button - Right */}
            <TouchableOpacity 
              style={styles.glassyCloseButton} 
              activeOpacity={0.7} 
              onPress={handleCloseSearchModal}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
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
  // True Frosted Glass Close Button (Right)
  glassyCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(25px)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // True Frosted Glass Search Button (Center - Purple)
  glassySearchButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.65)',
    backdropFilter: 'blur(30px)',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 42,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(138, 43, 226, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glassySearchButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // True Frosted Glass Clear Button (Left)
  glassyClearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(25px)',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  glassyClearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Filter Count Bubble
  filterCountBubble: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#8A2BE2',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
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
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600', // Bolder text for selected
  },

  // Styles for Toggle Switch (Now Generated Filter Options)
  generatedFilterContainer: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  generatedFilterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(44, 27, 74, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(192, 126, 255, 0.25)',
    marginBottom: 8, // Space between options
    alignItems: 'center', // Center text
  },
  generatedFilterOptionSelected: {
    backgroundColor: '#7B2CBF',
    borderColor: '#C07EFF',
    shadowColor: '#C07EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  generatedFilterOptionText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '500',
  },
  generatedFilterOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});