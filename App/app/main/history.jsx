import React, { useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

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
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [focusedImage, setFocusedImage] = useState(null);
  const flatListRef = useRef();
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Animation values for the modal
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

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

  // Sample data for history items with outfit items
  const [historyItems] = useState([
    {
      id: '1',
      date: '2024-03-20',
      image: TestImage,
      outfitItems: getRandomOutfitItems(4),
    },
    {
      id: '2',
      date: '2024-03-19',
      image: TestImage,
      outfitItems: getRandomOutfitItems(3),
    },
    {
      id: '3',
      date: '2024-03-18',
      image: TestImage,
      outfitItems: getRandomOutfitItems(5),
    },
  ]);

  // Sort items based on selected option
  const sortedItems = [...historyItems].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else {
      return new Date(a.date) - new Date(b.date);
    }
  });

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

    return (
      <Animated.View
        style={[
          { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          className="h-[400px] rounded-2xl overflow-hidden"
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
          <Image
            source={item.image}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
              Generated on {item.date}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4 }}>
              {item.outfitItems.length} items used
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOutfitItem = ({ item }) => (
    <View style={styles.outfitItemContainer}>
      <Image
        source={item.image}
        style={styles.outfitItemImage}
        resizeMode="contain"
      />
      <Text style={styles.outfitItemName}>{item.name}</Text>
    </View>
  );

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

        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSortBy(sortBy === 'newest' ? 'oldest' : 'newest');
          }}
          className="p-2"
        >
          <Ionicons 
            name={sortBy === 'newest' ? 'arrow-down' : 'arrow-up'} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Outfit Cards */}
      <View className="flex-1 justify-center items-center">
        <LinearGradient
          colors={['#1A0D2E', '#3B1F78', '#1A0D2E']}
          style={StyleSheet.absoluteFill}
        />
        <AnimatedFlatList
          ref={flatListRef}
          data={sortedItems}
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
          snapToOffsets={sortedItems.map((_, i) => 
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
                      source={focusedImage.image}
                      style={styles.focusedImage}
                      resizeMode="contain"
                    />
                    <View style={styles.outfitItemsContainer}>
                      <Text style={styles.outfitItemsTitle}>Outfit Items Used</Text>
                      <FlatList
                        data={focusedImage.outfitItems}
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
});
