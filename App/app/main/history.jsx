import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
  Animated,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  PanResponder,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useGlobalContext } from '../context/GlobalProvider';
import { Client, Storage } from 'react-native-appwrite';
import { getPredefinedOutfitById } from '../data/apparelData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Import the test image
import TestImage from '../../assets/userImage/meImage.jpeg';

// Import outfit items
import Outfit1 from '../../assets/outfits/outfit1.png';
import Outfit2 from '../../assets/outfits/outfit2.png';
import Outfit3 from '../../assets/outfits/outfit3.png';
import Shirt2 from '../../assets/outfits/shirt2.png';
import Shoes2 from '../../assets/outfits/shoes2.png';
import Jeans2 from '../../assets/outfits/jeans2.png';
import Heals1 from '../../assets/outfits/heals1.png';
import Dress1 from '../../assets/outfits/dress1.png';
import Shoes1 from '../../assets/outfits/shoes1.png';
import Hoodie1 from '../../assets/outfits/hoodie1.png';
import Pants1 from '../../assets/outfits/pants1.png';

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_SPACING = 16;
const INACTIVE_SCALE = 0.90;

// Sorting options
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
];

// Available outfit items
const OUTFIT_ITEMS = [
  { id: 'outfit1', name: 'Outfit 1', image: Outfit1 },
  { id: 'outfit2', name: 'Outfit 2', image: Outfit2 },
  { id: 'outfit3', name: 'Outfit 3', image: Outfit3 },
  { id: 'shirt2', name: 'Shirt', image: Shirt2 },
  { id: 'shoes2', name: 'Shoes', image: Shoes2 },
  { id: 'jeans2', name: 'Jeans', image: Jeans2 },
  { id: 'heals1', name: 'Heels', image: Heals1 },
  { id: 'dress1', name: 'Dress', image: Dress1 },
  { id: 'shoes1', name: 'Shoes', image: Shoes1 },
  { id: 'hoodie1', name: 'Hoodie', image: Hoodie1 },
  { id: 'pants1', name: 'Pants', image: Pants1 },
];

// Helper function to get random outfit items
const getRandomOutfitItems = (count = 3) => {
  const shuffled = [...OUTFIT_ITEMS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function History() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [focusedImage, setFocusedImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = useRef();
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Animation values for the modal
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Animation values for settings modal
  const settingsTranslateY = useRef(new Animated.Value(height)).current;
  const settingsOpacity = useRef(new Animated.Value(0)).current;
  const settingsScale = useRef(new Animated.Value(0.9)).current;

  // Settings state
  const [settings, setSettings] = useState({
    showOutfitItems: true,
    showDate: true,
    showItemCount: true,
  });

  const [processedHistoryItems, setProcessedHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Create pan responder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
        modalScale.setValue(1 - Math.abs(gestureState.dy) / (height * 2));
        modalOpacity.setValue(1 - Math.abs(gestureState.dy) / (height * 2));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > height * 0.2) {
          // Dismiss if dragged more than 20% of screen height
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: gestureState.dy > 0 ? height : -height,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(modalScale, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(modalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setFocusedImage(null);
            translateY.setValue(0);
            modalScale.setValue(0);
            modalOpacity.setValue(0);
          });
        } else {
          // Return to center if not dragged enough
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
            }),
            Animated.spring(modalScale, {
              toValue: 1,
              useNativeDriver: true,
              damping: 20,
            }),
            Animated.spring(modalOpacity, {
              toValue: 1,
              useNativeDriver: true,
              damping: 20,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Create pan responder for settings modal
  const settingsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow dragging down
          settingsTranslateY.setValue(gestureState.dy);
          settingsScale.setValue(1 - (gestureState.dy / height) * 0.1);
          settingsOpacity.setValue(1 - (gestureState.dy / height) * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > height * 0.2) {
          // Dismiss if dragged more than 20% of screen height
          Animated.parallel([
            Animated.spring(settingsTranslateY, {
              toValue: height,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            }),
            Animated.spring(settingsScale, {
              toValue: 0.9,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            }),
            Animated.timing(settingsOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowSettings(false);
            settingsTranslateY.setValue(height);
            settingsScale.setValue(0.9);
            settingsOpacity.setValue(0);
          });
        } else {
          // Return to original position
          Animated.parallel([
            Animated.spring(settingsTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            }),
            Animated.spring(settingsScale, {
              toValue: 1,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            }),
            Animated.spring(settingsOpacity, {
              toValue: 1,
              useNativeDriver: true,
              damping: 20,
              stiffness: 90,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const fetchHistoryData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      let imagesToProcess = null;

      try {
        const storedUserString = await AsyncStorage.getItem('user');
        if (storedUserString) {
          const parsedUser = JSON.parse(storedUserString);
          if (parsedUser && parsedUser.createdImages && parsedUser.createdImages.length > 0) {
            imagesToProcess = parsedUser.createdImages;
            console.log("History: Loaded createdImages from AsyncStorage");
          }
        }
      } catch (e) {
        console.error("History: Failed to load user from AsyncStorage:", e);
        // Fallback to context user if AsyncStorage fails
      }

      // Fallback to user from context if not found in AsyncStorage or if AsyncStorage read failed
      if (!imagesToProcess && user && user.createdImages && user.createdImages.length > 0) {
        imagesToProcess = user.createdImages;
        console.log("History: Loaded createdImages from GlobalContext as fallback");
      }

      if (!imagesToProcess || imagesToProcess.length === 0) {
        setProcessedHistoryItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const client = new Client()
          .setEndpoint('https://fra.cloud.appwrite.io/v1')
          .setProject('682371f4001597e0b4a7');
        const storage = new Storage(client);
        const BUCKET_ID = '6823720b001cdc257539'; // Your Appwrite bucket ID

        // Sort by createdAt descending (newest first)
        const sortedCreatedImages = [...imagesToProcess].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        const itemsWithDetails = await Promise.all(
          sortedCreatedImages.map(async (createdImg) => {
            let appwriteImageUrl = null;
            try {
              const imageFile = storage.getFileView(BUCKET_ID, createdImg.imageId);
              appwriteImageUrl = imageFile.href; 
            } catch (e) {
              console.error(`Failed to get Appwrite URL for imageId ${createdImg.imageId}:`, e);
              // Keep appwriteImageUrl as null if fetching fails
            }

            const outfitDetails = getPredefinedOutfitById(createdImg.outfitId);
            
            return {
              id: createdImg.imageId, // Use imageId as unique key for the list
              appwriteImageUrl,
              createdAt: createdImg.createdAt,
              outfitId: createdImg.outfitId,
              detailedOutfitItems: outfitDetails ? outfitDetails.detailedItems : [],
            };
          })
        );
        setProcessedHistoryItems(itemsWithDetails);
      } catch (error) {
        console.error('Failed to fetch history data:', error);
        setErrorMessage('Could not load history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryData();
  }, [user]); // Re-run if user object changes

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 25,
    minimumViewTime: 0,
    waitForInteraction: true,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveCardIndex(newIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleImagePress = (item) => {
    setFocusedImage(item);
    // Start opening animation
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
      }),
      Animated.spring(modalOpacity, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
      }),
    ]).start();
  };

  const handleCloseModal = () => {
    // Start closing animation
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFocusedImage(null);
      translateY.setValue(0);
      modalScale.setValue(0);
      modalOpacity.setValue(0);
    });
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset animation values before opening
    settingsTranslateY.setValue(height);
    settingsScale.setValue(0.9);
    settingsOpacity.setValue(0);
    
    // Set modal to visible first
    setShowSettings(true);
    
    // Then start the opening animation
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(settingsTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.spring(settingsScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.spring(settingsOpacity, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
      ]).start();
    });
  };

  const handleCloseSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the closing with a smoother transition
    Animated.parallel([
      Animated.spring(settingsTranslateY, {
        toValue: height,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
      Animated.spring(settingsScale, {
        toValue: 0.9,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
      Animated.timing(settingsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSettings(false);
      // Reset animation values after animation completes
      settingsTranslateY.setValue(height);
      settingsScale.setValue(0.9);
      settingsOpacity.setValue(0);
    });
  };

  const toggleSetting = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderCard = ({ item, index }) => {
    const inputRange = [
      (index - 1.5) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1.5) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [INACTIVE_SCALE, 1, INACTIVE_SCALE],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const animatedStyle = {
      transform: [{ scale }],
      opacity,
    };

    let cardClasses = "h-[400px] rounded-2xl overflow-hidden bg-gray-800";
    let cardContent = (
      <View className="flex-1 justify-center items-center w-full">
        {item.appwriteImageUrl ? (
          <Image 
            source={{ uri: item.appwriteImageUrl }}
            style={styles.historyImage} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={60} color="#555" />
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}
        {settings.showDate && (
          <View style={styles.dateOverlay}>
            <Text style={styles.dateText}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
    );

    return (
      <Animated.View
        style={[
          { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          className={cardClasses}
          style={{
            shadowColor: '#8A2BE2',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 12,
          }}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleImagePress(item);
          }}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOutfitItem = ({ item }) => (
    <View style={styles.outfitItemContainer}>
      <Image source={item.source} style={styles.outfitItemImage} resizeMode="contain" />
      <Text style={styles.outfitItemName} numberOfLines={2}>{item.label || item.name}</Text>
    </View>
  );

  // Conditional rendering for loading, error, or empty states
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color="#C07EFF" />
        <Text style={styles.loadingText}>Loading History...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{errorMessage}</Text>
        {/* TODO: Add a retry button? */}
      </SafeAreaView>
    );
  }

  if (!processedHistoryItems || processedHistoryItems.length === 0) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <Ionicons name="archive-outline" size={48} color="#888" />
        <Text style={styles.emptyText}>No history yet.</Text>
        <Text style={styles.emptySubText}>Create some outfits to see them here!</Text>
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
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text 
          className="text-xl font-bold"
          style={{
            color: '#FFFFFF',
            textShadowColor: 'rgba(192, 126, 255, 0.3)',
            textShadowOffset: { width: 0, height: 1 }, 
            textShadowRadius: 4
          }}
        >
          Outfit History
        </Text>

        <View className="w-10" />
      </View>

      {/* Outfit Cards */}
      <View className="flex-1 justify-center items-center">
        <LinearGradient
          colors={['#1A0D2E', '#3B1F78', '#1A0D2E']}
          style={StyleSheet.absoluteFill}
        />
        <AnimatedFlatList
          ref={flatListRef}
          data={processedHistoryItems}
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
          snapToOffsets={processedHistoryItems.map((_, i) => 
            i * (CARD_WIDTH + CARD_SPACING)
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      </View>

      {/* Focused Image Modal */}
      <Modal
        visible={focusedImage !== null}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalOpacity,
            }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [
                    { translateY },
                    { scale: modalScale }
                  ],
                }
              ]}
              {...panResponder.panHandlers}
            >
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
              >
                {focusedImage && (
                  <>
                    <Image
                      source={{ uri: focusedImage.appwriteImageUrl }}
                      style={styles.focusedImage}
                      resizeMode="contain"
                    />
                    <View style={styles.outfitItemsContainer}>
                      <Text style={styles.outfitItemsTitle}>Outfit Items Used</Text>
                      <FlatList
                        data={focusedImage.detailedOutfitItems}
                        renderItem={renderOutfitItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.outfitItemsList}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </Modal>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          visible={showSettings}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseSettings}
        >
          <Animated.View 
            style={[
              styles.settingsOverlay,
              {
                opacity: settingsOpacity,
              }
            ]}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill}>
              <Animated.View 
                style={[
                  styles.settingsContent,
                  {
                    transform: [
                      { translateY: settingsTranslateY },
                      { scale: settingsScale }
                    ],
                  }
                ]}
                {...settingsPanResponder.panHandlers}
              >
                <ScrollView 
                  style={styles.settingsScrollView}
                  contentContainerStyle={styles.settingsScrollContent}
                >
                  <Text style={styles.settingsTitle}>Settings</Text>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Show Outfit Items</Text>
                    <Switch
                      value={settings.showOutfitItems}
                      onValueChange={(value) => toggleSetting('showOutfitItems')}
                    />
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Show Date</Text>
                    <Switch
                      value={settings.showDate}
                      onValueChange={(value) => toggleSetting('showDate')}
                    />
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Show Item Count</Text>
                    <Switch
                      value={settings.showItemCount}
                      onValueChange={(value) => toggleSetting('showItemCount')}
                    />
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeSettingsButton}
                  onPress={handleCloseSettings}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            </BlurView>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  focusedImage: {
    width: width * 0.9,
    height: height * 0.6,
    borderRadius: 20,
    marginTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  outfitItemsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  outfitItemsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  outfitItemsList: {
    paddingRight: 20,
  },
  outfitItemContainer: {
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    width: 100,
  },
  outfitItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  outfitItemName: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsScrollView: {
    flex: 1,
    width: '100%',
  },
  settingsScrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  closeSettingsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  historyImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#2C1B4A',
  },
  placeholderText: {
    marginTop: 8,
    color: '#888',
    fontSize: 14,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0D2E',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E0E0E0',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFD1D1',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#C0C0C0',
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
