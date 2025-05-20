import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Temporarily comment out AsyncStorage if not installed
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Temporarily comment out axios if not installed
// import axios from 'axios';

export default function Signin() {
  const { login, setError, setIsAuthenticated, setUser, isAuthenticated } = useGlobalContext();
  // Remove GlobalContext reference temporarily
  // const { setUser } = useGlobalContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if(isAuthenticated) {
      console.log("sending to home");
      router.replace('/main/home');
    }
  }, [isAuthenticated]);

  const handleSignIn = async () => {

    if(email === '' || password === '') {
      Alert.alert( "Please enter email and password");
      return;
    }


    console.log(email, password);
      axios.post('https://4759-109-245-193-150.ngrok-free.app/signin', { email, password })
      .then((response) => {
        if(response.status === 200) {
          setUser(response.data);
          if(response.data.verification != 1) {
            router.replace('/modal/verify');
          } else {
            setIsAuthenticated(true);  
            AsyncStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
          }



        }
      })
      .catch((error) => {
        console.log(error);
      })

  };

  return (
    <SafeAreaView className="flex-1 bg-[#1A0D2E]">
      <StatusBar barStyle="light-content" />
      
      {/* Close button */}
      <TouchableOpacity 
        className="absolute top-12 right-6 z-10" 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="#C07EFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View 
            className="px-6"
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Welcome Text */}
            <Text className="text-white text-4xl font-bold mb-2 text-center">
              Welcome back
            </Text>
            <Text className="text-gray-300 text-xl mb-10 text-center">
              Let's get you in to your journal
            </Text>
            
            {/* Input Fields */}
            <View className="mb-3">
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholder="Your Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-2">
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholder="Your Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            {/* Forgot Password */}
            <TouchableOpacity className="mb-8">
              <Text className="text-gray-300 text-center">
                Forgot password?
              </Text>
            </TouchableOpacity>
            
            {/* Sign In Button with Purple Gradient */}
            <TouchableOpacity 
              className="rounded-full mb-6 overflow-hidden"
              onPress={handleSignIn}
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
                className="py-3 px-5"
              >
                <Text className="text-white text-center text-base font-semibold">
                  Sign in
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-[rgba(192,126,255,0.15)]" />
              <Text className="text-gray-300 mx-4">or</Text>
              <View className="flex-1 h-[1px] bg-[rgba(192,126,255,0.15)]" />
            </View>
            
            {/* Continue with Google */}
            <TouchableOpacity 
              className="bg-[#2A1B3E] py-3 rounded-full mb-6 flex-row justify-center items-center border border-[rgba(192,126,255,0.15)]"
            >
              <Ionicons name="logo-google" size={18} color="#C07EFF" style={{ marginRight: 8 }} />
              <Text className="text-white text-center text-base">
                Continue with Google
              </Text>
            </TouchableOpacity>
            
            {/* Don't have an account */}
            <TouchableOpacity 
              className="mb-8"
              onPress={() =>{ router.back();router.push('/modal/signup')}}
            >
              <Text className="text-gray-300 text-center">
                Don't have an account? <Text className="text-[#C07EFF]">Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
