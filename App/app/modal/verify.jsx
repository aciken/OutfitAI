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
  Alert,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useGlobalContext } from '../context/GlobalProvider';

export default function VerifyAccount() {
  const { user, setUser, isAuthenticated, setIsAuthenticated } = useGlobalContext();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await axios.put('https://bd20-109-245-193-150.ngrok-free.app/verify', {
        email: user.email,
        verificationCode: verificationCode
      });
      if(response.status === 200) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        setIsAuthenticated(true);
        router.replace('/main/home');
      } else {
        Alert.alert('Failed to verify account. Please try again.');
      }
    } catch (error) {
      Alert.alert('Failed to verify account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Close button */}
      <TouchableOpacity 
        className="absolute top-12 right-6 z-10" 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        <Animated.View 
          className="px-6"
          style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-zinc-900 rounded-full items-center justify-center mb-4">
              <Ionicons name="mail-outline" size={32} color="#fff" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2 text-center">
              Verify Your Account
            </Text>
            <Text className="text-gray-400 text-center">
              We've sent a verification code to your email
            </Text>
          </View>

          {/* Code Input */}
          <View className="flex-row justify-between mb-8">
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                className="w-12 h-12 bg-zinc-900 text-white rounded-lg text-center text-xl font-semibold border border-zinc-800 focus:border-blue-500"
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
                contextMenuHidden
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            className={`bg-white py-4 rounded-full mb-6 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#000" />
                <Text className="text-black text-base font-semibold ml-2">
                  Verifying...
                </Text>
              </View>
            ) : (
              <Text className="text-black text-center text-base font-semibold">
                Verify Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <TouchableOpacity 
            className="mb-8"
            onPress={() => Alert.alert('Success', 'Verification code has been resent')}
          >
            <Text className="text-gray-400 text-center">
              Didn't receive the code?{' '}
              <Text className="text-blue-400 font-semibold">Resend</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}