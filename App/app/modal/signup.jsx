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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Client, Storage, ID } from 'react-native-appwrite';
import { useGoogleAuth } from '../utiils/googleAuth';


// Temporarily comment out AsyncStorage if not installed
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Temporarily comment out axios if not installed
// import axios from 'axios';

export default function Signup() {
  // Remove GlobalContext reference temporarily
  // const { setUser } = useGlobalContext();
    const { setError, setIsAuthenticated, setUser, isAuthenticated } = useGlobalContext();
    const { signInWithGoogle } = useGoogleAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  
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
    // Check if passwords match when either password field changes
    if (confirmPassword !== '') {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    if(isAuthenticated) {
      router.replace('/main/home');
    }
  }, [isAuthenticated]);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');


  // --- Validation Functions ---
  const isValidEmail = (emailToTest) => {

    // Basic email regex - adjust if needed for more strictness

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToTest);

    
  };

      // Get all onboarding params
      const allOnboardingData = useLocalSearchParams();

  useEffect(() => {
    // Get all onboarding params
    console.log("All Onboarding Data:", allOnboardingData); // Log all onboarding data

    // Don't show error if email is empty
    if (!email) {
      setEmailError('');
      return; 
    }
    // Show error if email is not empty AND invalid
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError(''); // Clear error if valid
    }
  }, [email]);

  const isValidPassword = (passwordToTest) => {
    // At least 8 characters, at least one number
    const passwordRegex = /^(?=.*\d).{8,}$/;
    return passwordRegex.test(passwordToTest);
  };

    useEffect(() => {
    // Don't show error if password is empty
    if (!password) {
      setPasswordError('');
      return;
    }
     // Show error if password is not empty AND invalid
    if (!isValidPassword(password)) {
      setPasswordError('Password must be 8+ chars & contain 1 number.'); // Shortened message
    } else {
      setPasswordError(''); // Clear error if valid
    }
  }, [password]);
  // --- End Validation Functions ---

  const handleSignUp = async () => {
    setError(null); // Clear previous errors

//     const client = new Client()
//     .setEndpoint('https://fra.cloud.appwrite.io/v1')
//     .setProject('682371f4001597e0b4a7');

// const storage = new Storage(client);

// const promise = storage.createFile(
//     '6823720b001cdc257539',
//     ID.unique(),
//     {
//         name: ID.unique() + '.jpg',
//         type: 'image/jpeg',
//         size: 1234567,
//         uri: allOnboardingData.userImageURI,
//     }
// );

// let fileId = '';

// promise.then(function (response) {
//     console.log(response);
//     fileId = response.$id; // Success
//     console.log(fileId);
// }, function (error) {
//     console.log(error); // Failure
// });



    // 1. Check if all fields are filled
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // 2. Check email format
    if (!isValidEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address.');
        return;
    }

    // 3. Check password requirements
    if (!isValidPassword(password)) {
        Alert.alert('Error', 'Password must be at least 8 characters long and contain at least one number.');
        return;
    }

    // 4. Check if passwords match
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    
    // --- If all validation passes, proceed with API call ---
    console.log("Validation passed, attempting sign up...");
    try {
 
      const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('682371f4001597e0b4a7');
  
  const storage = new Storage(client);
  
  const promise = storage.createFile(
      '6823720b001cdc257539',
      ID.unique(),
      {
          name: ID.unique() + '.jpg',
          type: 'image/jpeg',
          size: 1234567,
          uri: allOnboardingData.userImageURI,
      }
  );

  let fileId = '';
  
  promise.then(function (response) {
      console.log(response);
      fileId = response.$id; // Success
      axios.put('https://9f0c-109-245-207-216.ngrok-free.app/signup', { // Ensure URL is correct
        name: name.trim(), // Send trimmed name
        email: email.trim(), // Send trimmed email
        password,
        fileId,
      })
      .then(response => {
        if(response.status === 200) { // Check for user object
          AsyncStorage.setItem('user', JSON.stringify(response.data));
          setUser(response.data); 
          router.replace('/modal/verify');
        }
        console.log("API Response Status:", response.status);
        console.log("API Response Data:", JSON.stringify(response.data, null, 2));
      })
      .catch(error => {
        console.log(error);
      });
  }, function (error) {
      console.log(error); // Failure
  });
  


      // const response = await axios.put('https://18ec-109-245-193-150.ngrok-free.app/signup', { // Ensure URL is correct
      //   name: name.trim(), // Send trimmed name
      //   email: email.trim(), // Send trimmed email
      //   password,
      //   fileId,
      // });
      
      // console.log("API Response Status:", response.status);
      // console.log("API Response Data:", JSON.stringify(response.data, null, 2));

      // if(response.status === 200) { // Check for user object
      //     await AsyncStorage.setItem('user', JSON.stringify(response.data));
      //     setUser(response.data); 
      //     router.replace('/modal/verify');



      // } else {
      //     const message = response.data?.message || "Sign up failed. Invalid response from server.";
      //     setError(message);
      //     Alert.alert( message);
      // }
    } catch (error) {
        let message = "An unexpected error occurred during sign up.";
        if (error.response) {
          message = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          message = "No response from server.";
        } else {
          message = error.message || "Error setting up request.";
        }
        setError(message);
        Alert.alert("Sign Up Error", message); 
    }
  };


  const handleGoogleSignUp = async () => {
    try {
      const userData = await signInWithGoogle();  
      if (userData) {
        // You might want to send this data to your backend
        router.replace('/main/home');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Google');
    }
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
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ paddingVertical: 40 }}
          className="px-6"
        >
          <Animated.View 
            className="mb-4"
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Header Text */}
            <Text className="text-white text-4xl font-bold mb-2 text-center">
              Create Account
            </Text>
            <Text className="text-gray-300 text-base mb-8 text-center">
              Join us to save and manage your outfits
            </Text>

            {/* Form Fields */}
            <View className="mb-5">
              <Text className="text-gray-300 mb-2 ml-1">Your Name</Text>
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-1">
              <Text className="text-gray-300 mb-2 ml-1">Email Address</Text>
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">{emailError}</Text>
              ) : null}
            </View>

            <View className="mb-1">
              <Text className="text-gray-300 mb-2 ml-1">Password</Text>
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {passwordError ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">{passwordError}</Text>
              ) : null}
            </View>

            <View className="mb-6">
              <Text className="text-gray-300 mb-2 ml-1">Confirm Password</Text>
              <TextInput
                className="bg-[#2A1B3E] text-white py-3 px-5 rounded-full text-base border border-[rgba(192,126,255,0.15)]"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {!passwordsMatch && confirmPassword !== '' ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">Passwords don't match</Text>
              ) : null}
            </View>

            {/* Sign Up Button with Purple Gradient */}
            <TouchableOpacity 
              className="rounded-full mb-8 overflow-hidden"
              onPress={handleSignUp}
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
                <Text className="text-white text-center text-base font-semibold">
                  Create Account
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
              onPress={handleGoogleSignUp}
            >
              <Ionicons name="logo-google" size={18} color="#C07EFF" style={{ marginRight: 8 }} />
              <Text className="text-white text-center text-base">
                Continue with Google
              </Text>
            </TouchableOpacity>
            
            {/* Already have an account */}
            <TouchableOpacity 
              className="mb-4"
              onPress={() => { router.back(); router.push('/modal/signin') }}
            >
              <Text className="text-gray-300 text-center">
                Already have an account? <Text className="text-[#C07EFF]">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
