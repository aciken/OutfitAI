import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios';
import { Platform } from 'react-native'
import Purchases from 'react-native-purchases';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOutfitItem, setSelectedOutfitItem] = useState(null);
    const [isPro, setIsPro] = useState(false);





    const login = async (email, password) => {
        try {
            const response = await axios.post('https://7cc2-109-245-193-150.ngrok-free.app/signin', { email, password });
            if(response.status === 200) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                setIsAuthenticated(true);   
                setUser(response.data.user);
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError(error.response.data.message);
        }
    }; 

    useEffect(() => {
        const setupPurchases = async () => {
          try {
            if(Platform.OS === 'ios') {
              await Purchases.configure({ apiKey: 'appl_BBKtIOshyacowLQiHPNHOQNtcYF'});
            } else {
              await Purchases.configure({ apiKey: 'appl_BBKtIOshyacowLQiHPNHOQNtcYF' });
            }
    
            // Log in the user to RevenueCat
            const storedUserString = await AsyncStorage.getItem('user');
            if (storedUserString) {
              const storedUser = JSON.parse(storedUserString);
              if (storedUser?._id) {
                await Purchases.logIn(storedUser._id);
                console.log('Logged in to RevenueCat with ID:', storedUser._id);
              }
            }
    
            const offerings = await Purchases.getOfferings();
            
            // Check if user is premium
            const customerInfo = await Purchases.getCustomerInfo();
            const currentRevenueCatId = await Purchases.getAppUserID();
            const isPro = customerInfo.entitlements.all.Pro?.isActive;
            
            console.log('User is premium:', isPro);
            console.log('Current RevenueCat ID:', currentRevenueCatId);
            console.log('User ID:', JSON.parse(storedUserString)?._id);
    
            // Only consider the user as premium if both conditions are met:
            // 1. They have an active Pro entitlement
            // 2. Their RevenueCat ID matches their user ID
            if(!isPro || currentRevenueCatId !== JSON.parse(storedUserString)?._id) {
              // Force logout from RevenueCat before showing paywall
              await Purchases.logOut();
              // Log back in with correct ID
              if (JSON.parse(storedUserString)?._id) {
                await Purchases.logIn(JSON.parse(storedUserString)?._id);
              }
              router.push('utils/Paywall');
            } 
    
            if (offerings.current) {
              console.log('Current Offering:', {
                identifier: offerings.current.identifier,
                packages: offerings.current.availablePackages.map(pkg => ({
                  identifier: pkg.identifier,
                  product: {
                    title: pkg.product.title,
                    price: pkg.product.price,
                    priceString: pkg.product.priceString,
                    description: pkg.product.description
                  }
                }))
              });
            } else {
              console.log('No current offering available');
            }
          } catch (error) {
            console.error('RevenueCat Error:', error);
          }
        };
    
        setupPurchases();
      }, []);



      
    


    const logout = async () => {
        await AsyncStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };  

    const addSelectedOutfitItem = (item) => {
        setSelectedOutfitItem(item);
    };

    const clearSelectedOutfitItem = () => {
        setSelectedOutfitItem(null);
    };
    
    return (
        <GlobalContext.Provider value={{ 
            user, 
            isAuthenticated, 
            error, 
            setError, 
            setIsAuthenticated, 
            setUser, 
            login, 
            logout, 
            selectedOutfitItem,
            addSelectedOutfitItem,
            clearSelectedOutfitItem,
            isPro,
            setIsPro
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
    
    
    
    
    