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
      axios.post('https://4796-109-245-193-150.ngrok-free.app/signin', { email, password })
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Close button */}
      <TouchableOpacity 
        className="absolute top-12 right-6 z-10" 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="#000" />
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
            <Text className="text-black text-4xl font-bold mb-2 text-center">
              Welcome back
            </Text>
            <Text className="text-gray-600 text-xl mb-10 text-center">
              Let's get you in to your journal
            </Text>
            
            {/* Input Fields */}
            <View className="mb-3">
              <TextInput
                className="bg-gray-100 text-black py-3 px-5 rounded-full text-base"
                placeholder="Your Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-2">
              <TextInput
                className="bg-gray-100 text-black py-3 px-5 rounded-full text-base"
                placeholder="Your Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            {/* Forgot Password */}
            <TouchableOpacity className="mb-8">
              <Text className="text-gray-600 text-center">
                Forgot password?
              </Text>
            </TouchableOpacity>
            
            {/* Sign In Button with Purple Gradient */}
            <TouchableOpacity 
              className="rounded-full mb-6 overflow-hidden"
              onPress={handleSignIn}
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
              <View className="flex-1 h-[1px] bg-gray-300" />
              <Text className="text-gray-600 mx-4">or</Text>
              <View className="flex-1 h-[1px] bg-gray-300" />
            </View>
            
            {/* Continue with Google */}
            <TouchableOpacity 
              className="bg-gray-200 py-3 rounded-full mb-6 flex-row justify-center items-center"
            >
              <Ionicons name="logo-google" size={18} color="#333" style={{ marginRight: 8 }} />
              <Text className="text-gray-800 text-center text-base">
                Continue with Google
              </Text>
            </TouchableOpacity>
            
            {/* Don't have an account */}
            <TouchableOpacity 
              className="mb-8"
              onPress={() =>{ router.back();router.push('/modal/signup')}}
            >
              <Text className="text-gray-600 text-center">
                Don't have an account? <Text className="text-purple-600">Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
