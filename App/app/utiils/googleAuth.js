import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import Purchases from 'react-native-purchases';
import {useState, useEffect} from 'react';


// Initialize WebBrowser for auth
WebBrowser.maybeCompleteAuthSession();

// Replace these with your client IDs
const WEB_CLIENT_ID = '968750704939-5cmi5jbo6ovgkhrcu8kjpsnt24ui6etg.apps.googleusercontent.com';
const IOS_CLIENT_ID = '968750704939-j03bl08isntslagkkqj6bks0q451vs1o.apps.googleusercontent.com'; // Add this after creating iOS client ID

    const [isPro, setIsPro] = useState(false);


useEffect(() => {
  const setupPurchases = async () => {
      try {
          if(Platform.OS === 'ios') {
              await Purchases.configure({ apiKey: 'appl_TjfDUbftKJDEbZZrxvTNHKhUQzc'});
          } else {
              await Purchases.configure({ apiKey: 'appl_TjfDUbftKJDEbZZrxvTNHKhUQzc' });
          }
          const customerInfo = await Purchases.getCustomerInfo();
          setIsPro(customerInfo.entitlements.all.Pro?.isActive ?? false);
      } catch (error) {
          console.error('Error setting up purchases:', error);
      }
  };
  setupPurchases();
}, []);

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    responseType: "code",
    usePKCE: true,
  });

  const getAccessToken = async (code) => {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: Platform.OS === 'ios' ? IOS_CLIENT_ID : WEB_CLIENT_ID,
          redirect_uri: request?.redirectUri || '',
          grant_type: 'authorization_code',
          code_verifier: request?.codeVerifier || '',
        }).toString(),
      });

      const tokenData = await tokenResponse.json();
      console.log('Token data:', tokenData);
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Sign In...');
      const result = await promptAsync();
      console.log('Auth Result:', result);
      
      if (result?.type === 'success' && result.params?.code) {
        try {
          // Exchange the code for an access token
          const accessToken = await getAccessToken(result.params.code);
          console.log('Access Token:', accessToken);
          
          // Get user info with the access token
          const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` }, 
          });
          const userData = await userInfoResponse.json();
          console.log('User data:', userData);

          // Send user data to your backend
          const response = await axios.put('https://106d-109-245-204-138.ngrok-free.app/google', {
            id: userData.id,
            email: userData.email,
            name: userData.name,
          });

          console.log('Backend response:', response.status);
          
          // Store user data locally
          await AsyncStorage.setItem('user', JSON.stringify(response.data));

          console.log(response.data.tasks)
          
          // Navigate to main screen
          router.back();
          router.push('/main/TimelineView');

          return userData;
        } catch (error) {
          console.error('Error processing Google sign in:', error);
          if (error.response) {
            // The request was made and the server responded with a status code
            console.error('Server response:', error.response.data);
          }
          throw error;
        }
      } else {
        console.log('Authentication failed:', result);
        return null;
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    signOut,
  };
}; 