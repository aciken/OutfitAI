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


    useEffect(() => {
        const setupPurchases = async () => {
            try {
                if(Platform.OS === 'ios') {
                    await Purchases.configure({ apiKey: 'appl_BBKtIOshyacowLQiHPNHOQNtcYF'});
                } else {
                    await Purchases.configure({ apiKey: 'appl_BBKtIOshyacowLQiHPNHOQNtcYF' });
                }
                console.log('Purchases configured');
                const customerInfo = await Purchases.getCustomerInfo();
                console.log('Customer info:', customerInfo);
                setIsPro(customerInfo.entitlements.all.Pro?.isActive ?? false);
            } catch (error) {
                console.error('Error setting up purchases:', error);
            }
        };

        setupPurchases();
    }, []);


    useEffect(() => {
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                setIsAuthenticated(true);
                setUser(JSON.parse(token));
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        };
        checkAuth();


    }, []);

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
    
    const signup = async (name,email, password) => {


    };

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
            signup,
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
    
    
    
    
    
