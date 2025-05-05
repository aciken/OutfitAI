import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Reusable component for section headers
const SectionHeader = ({ title }) => (
  <Text className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-2 px-1">
    {title}
  </Text>
);

// Reusable component for settings options
const SettingOption = ({ icon, text, onPress }) => (
  <TouchableOpacity 
    className="flex-row items-center bg-white p-4 rounded-lg my-1"
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
    }}
    onPress={onPress || (() => console.log(`${text} pressed`))}
  >
    <View style={{ 
      width: 32, 
      height: 32, 
      borderRadius: 16, 
      backgroundColor: 'rgba(138, 43, 226, 0.1)', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginRight: 12
    }}>
      <Ionicons name={icon} size={18} color="#8A2BE2" />
    </View>
    <Text className="text-base text-gray-800 flex-1">{text}</Text> 
    <Ionicons name="chevron-forward-outline" size={18} color="#8A2BE2" />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { setIsAuthenticated, setUser } = useGlobalContext();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Logging out...");
              setIsAuthenticated(false);
              setUser(null);
              
              await AsyncStorage.removeItem('user');
              console.log("User removed from AsyncStorage.");

              router.replace('/'); 
              console.log("Navigated to index.");

            } catch (e) {
              console.error("Logout failed:", e);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-5 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">Settings</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            borderRadius: 18,
            backgroundColor: 'rgba(138, 43, 226, 0.1)',
            padding: 8,
          }}
        >
          <Ionicons name="close" size={20} color="#8A2BE2" /> 
        </TouchableOpacity>
      </View>

      {/* Content with Sections */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        <SectionHeader title="Account" />
        <View className="space-y-2">
          <SettingOption icon="person-outline" text="Edit Profile" />
          <SettingOption icon="key-outline" text="Change Password" />
        </View>

        <SectionHeader title="Preferences" />
        <View className="space-y-2">
          <SettingOption icon="notifications-outline" text="Notifications" />
          <SettingOption icon="color-palette-outline" text="Appearance" />
          <SettingOption icon="lock-closed-outline" text="Privacy & Security" />
        </View>

        <SectionHeader title="Support" />
        <View className="space-y-2">
          <SettingOption icon="help-circle-outline" text="Help Center" />
          <SettingOption icon="document-text-outline" text="Terms of Service" />
          <SettingOption icon="shield-checkmark-outline" text="Privacy Policy" />
          <SettingOption icon="information-circle-outline" text="About" />
        </View>

        {/* Logout Button - Updated Styling */}
        <TouchableOpacity 
          className="p-4 rounded-lg flex-row items-center justify-center mt-10"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" /> 
          <Text className="text-base text-red-500 ml-3 font-semibold">Logout</Text>
        </TouchableOpacity>

        {/* Version Info Footer */}
        <Text className="text-center text-gray-400 mt-8 text-xs">
           Version 1.0.0 (Build 1)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 