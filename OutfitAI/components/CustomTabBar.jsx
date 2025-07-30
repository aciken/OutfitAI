import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const HORIZONTAL_MARGIN = 20;
const PILL_HEIGHT = 40; // Slightly reduced height
const PILL_WIDTH = 60; // Slightly reduced width

// Define TabButton component outside to optimize re-renders
const TabButton = ({ tab, onPress, isActive }) => {
  // --- Revised Color Scheme ---
  const activeColor = '#f9fafb'; // Back to Off-white / light gray (gray-50)
  const inactiveColor = '#4b5563'; // Dark gray (gray-600)
  // --- End Color Scheme ---

  const color = isActive ? activeColor : inactiveColor;
  const iconName = tab.icon;

  // --- Subtle Scale Animation for Icon ---
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
          // Scale only the active icon slightly
        { scale: withTiming(isActive ? 1.1 : 1, { duration: 200 }) }, 
      ],
       opacity: withTiming(isActive ? 1 : 0.6, { duration: 200 }),
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
        {/* Apply animation to the icon itself */}
        <Animated.View style={iconAnimatedStyle}> 
            <Ionicons name={iconName} size={25} color={color} />
        </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar = () => {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const activeTab = segments[segments.length - 1];

  const tabs = React.useMemo(() => [
    { name: 'home', icon: 'home'},
    { name: 'profile', icon: 'person'},
  ], []);

  const activeIndex = React.useMemo(() => {
    const index = tabs.findIndex(tab => tab.name === activeTab);
    return index >= 0 ? index : 0;
  }, [activeTab, tabs]);

  const translateX = useSharedValue(0);

  // --- Animate translateX with Spring ---
  useEffect(() => {
    const tabBarContentWidth = screenWidth - (HORIZONTAL_MARGIN * 2);
    const segmentWidth = tabBarContentWidth / tabs.length;
    const targetX = activeIndex * segmentWidth + (segmentWidth / 2) - (PILL_WIDTH / 2);

    // Use withSpring for bouncy effect
    translateX.value = withSpring(targetX, {
      damping: 15, // Controls bounce (lower = more bounce)
      stiffness: 120, // Controls speed/energy
      mass: 1, // Controls inertia
    });
    // --- End Spring Animation ---

  }, [activeIndex, tabs.length, translateX]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom + 15 }
      ]}
    >
      {/* Animated Background Pill using LinearGradient */}
      <Animated.View style={[styles.activeBackgroundContainer, backgroundAnimatedStyle]}>
          <LinearGradient
            colors={['#374151', '#1f2937']} // Active pill gradient remains gray-700 to gray-800
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.activeBackgroundGradient}
        />
      </Animated.View>

      {/* Tab Buttons */}
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.name}
          tab={tab}
          onPress={() => {
            if (tab.name === 'home') {
              router.push('/main/home');
            } else if (tab.name === 'profile') {
              router.push('/main/history');
            }
          }}
          isActive={activeIndex === index}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
    backgroundColor: '#09090b', // Very dark gray (Tailwind zinc-950) - almost black
    borderRadius: 30,
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderWidth: 1, // Add a 1px border
    borderColor: 'rgba(55, 65, 81, 0.4)', // Subtle dark border (gray-700 @ 40% opacity)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // Slightly increased offset for darker bg
    shadowOpacity: 0.4, // Slightly increased opacity
    shadowRadius: 18, // Slightly increased radius
    elevation: 14,   // Slightly increased elevation
  },
  activeBackgroundContainer: { // Container for the animated pill, handles size/shape/position
      position: 'absolute',
      width: PILL_WIDTH,
      height: PILL_HEIGHT,
      borderRadius: PILL_HEIGHT / 2,
      top: (TAB_BAR_HEIGHT - PILL_HEIGHT) / 2,
      left: 0,
      overflow: 'hidden', // Clip the gradient to the border radius
  },
  activeBackgroundGradient: { // Style for the gradient itself
      width: '100%',
      height: '100%',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1, // Icons above background
  },
});

export default CustomTabBar; 