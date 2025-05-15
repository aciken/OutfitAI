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


// Temporarily comment out AsyncStorage if not installed
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Temporarily comment out axios if not installed
// import axios from 'axios';

export default function Signup() {
  // Remove GlobalContext reference temporarily
  // const { setUser } = useGlobalContext();
    const { setError, setIsAuthenticated, setUser, isAuthenticated } = useGlobalContext();

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
      axios.put('https://33f2-109-245-193-150.ngrok-free.app/signup', { // Ensure URL is correct
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
              Create Account
            </Text>
            <Text className="text-gray-600 text-xl mb-10 text-center">
              Start your journaling journey
            </Text>
            
            {/* Input Fields */}
            <View className="mb-3">
              <TextInput
                className="bg-gray-100 text-black py-3 px-5 rounded-full text-base"
                placeholder="Your Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            
            <View className="mb-3">
              <TextInput
                className={`bg-gray-100 text-black py-3 px-5 rounded-full text-base ${emailError ? 'border border-red-500' : 'border border-transparent'}`}
                placeholder="Your Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={(text) => setEmail(text.trim())} // Trim email input
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <View className="mt-1 ml-4">
                  <Text className="text-red-500 text-xs">{emailError}</Text>
                </View>
              ) : null}
            </View>
            
            <View className="mb-3">
              <TextInput
                className={`bg-gray-100 text-black py-3 px-5 rounded-full text-base ${passwordError ? 'border border-red-500' : 'border border-transparent'}`}
                placeholder="Create Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
                {passwordError ? (
                <View className="mt-1 ml-4">
                  <Text className="text-red-500 text-xs">{passwordError}</Text>
                </View>
              ) : null}
            </View>
            
            <View className="mb-2">
              <TextInput
                className={`bg-gray-100 text-black py-3 px-5 rounded-full text-base ${!passwordsMatch && confirmPassword ? 'border border-red-500' : ''}`} // Show border only if not matching AND confirm has input
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
            
            {/* Password match error */}
            {!passwordsMatch && confirmPassword ? ( // Show error only if not matching AND confirm has input
              <Text className="text-red-500 text-xs mt-1 mb-3 ml-4"> {/* Adjusted style */}
                Passwords don't match
              </Text>
            ) : <View style={{ height: 18, marginBottom: 3}} /> /* Keep space consistent */}
            
            {/* Terms and Privacy */}
            <Text className="text-gray-600 text-xs text-center mb-6"> {/* Adjusted style */}
              By signing up, you agree to our{' '}
              <Text className="text-purple-600 underline">Terms of Service</Text> and{' '}
              <Text className="text-purple-600 underline">Privacy Policy</Text>
            </Text>
            
            {/* Sign Up Button with Purple Gradient */}
            <TouchableOpacity 
              className="rounded-full mb-6 overflow-hidden"
              onPress={handleSignUp}
            >
              <LinearGradient
                colors={['#8A2BE2', '#A020F0', '#9370DB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3 px-5"
              >
                <Text className="text-white text-center text-base font-semibold">
                  Create Account
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
            
            {/* Already have an account */}
            <TouchableOpacity 
              className="mb-8"
              onPress={() => router.push('/modal/signin')} // Just push, don't go back first
            >
              <Text className="text-gray-600 text-center">
                Already have an account? <Text className="text-purple-600">Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
