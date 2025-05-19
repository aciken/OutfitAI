import { View, Text, TouchableOpacity, SafeAreaView, Animated, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalContext } from './context/GlobalProvider';
import { useRouter } from 'expo-router';

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get('window');

// Updated icons using Ionicons with light color for dark theme
const ChartIcon = () => (
  <Ionicons name="analytics-outline" size={22} color="#C07EFF" />
);

const AnalyticsIcon = () => (
  <Ionicons name="bar-chart-outline" size={22} color="#C07EFF" />
);

const PersonalizedIcon = () => (
  <Ionicons name="sparkles-outline" size={22} color="#C07EFF" />
);

export default function WelcomePage() {
  const router = useRouter();
  const {setUser, setIsAuthenticated, isAuthenticated} = useGlobalContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // State to track if we have a photo to display
  const [hasPhoto, setHasPhoto] = useState(false);
  // You can replace this with your actual photo URL or require statement
  const photoSource = null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        // User exists, route to home
        router.replace('/main/home');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1A0D2E]">
      <StatusBar style="light" />
      
      <Animated.View 
        className="flex-1 px-6 justify-between"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Photo Section - Will be empty if no photo */}
        <View className="items-center mt-12 mb-4">
          {hasPhoto ? (
            <Image
              source={photoSource}
              style={{
                width: width * 0.85,
                height: width * 1.2,
                borderRadius: 20,
              }}
              resizeMode="cover"
            />
          ) : (
            // Empty view when no photo is available
            <View style={{ width: width * 0.85, height: width * 0.5 }} />
          )}
        </View>

        {/* Bottom Section - Welcome Text and Buttons */}
        <View className="w-full items-center mb-10">
          <Text className="text-white text-4xl font-bold mb-3 text-center">
            OutfitAI
          </Text>
          
          <Text className="text-gray-300 text-center text-lg mb-10">
            Your personal style assistant. Create, organize, and explore your perfect outfits.
          </Text>
          
          <Link href="/onboarding/gender" asChild>
            <TouchableOpacity 
              className="w-full rounded-full mb-4 overflow-hidden"
              style={{
                shadowColor: "#C07EFF",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={['#8A2BE2', '#A020F0', '#9370DB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4"
              >
                <Text className="text-white text-center text-lg font-semibold">
                  Get Started
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
          
          <Link href="/modal/signin" asChild>
            <TouchableOpacity>
              <Text className="text-gray-300 text-center text-base">
                Already have an account? <Text className="text-[#C07EFF]">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, title, description }) => (
  <View className="flex-row items-start space-x-4">
    <View className="bg-[#2A1B3E] w-10 h-10 rounded-lg items-center justify-center">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-base font-medium text-white mb-1">{title}</Text>
      <Text className="text-gray-300 text-sm">{description}</Text>
    </View>
  </View>
);
