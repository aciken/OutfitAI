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

// Reusable component for section headers
const SectionHeader = ({ title }) => (
  <Text className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-2 px-1">
    {title}
  </Text>
);

// Reusable component for settings options
const SettingOption = ({ icon, text, onPress }) => (
  <TouchableOpacity 
    className="flex-row items-center bg-gray-900 p-4 rounded-lg"
    onPress={onPress || (() => console.log(`${text} pressed`))}
  >
    <Ionicons name={icon} size={22} color="#a5b4fc" />
    <Text className="text-base text-gray-200 ml-4 flex-1">{text}</Text> 
    <Ionicons name="chevron-forward-outline" size={20} color="#6b7280" />
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
    <SafeAreaView className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-5 pb-4 border-b border-gray-800">
        <Text className="text-xl font-bold text-white">Settings</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-circle" size={28} color="#6b7280" /> 
        </TouchableOpacity>
      </View>

      {/* Content with Sections */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        
        <SectionHeader title="Account" />
        <View className="space-y-2">
          <SettingOption icon="person-circle-outline" text="Edit Profile" />
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

        {/* Logout Button - Added Spacing and Styling */}
        <TouchableOpacity 
          className="bg-red-900/50 border border-red-700/60 p-4 rounded-lg flex-row items-center justify-center mt-10"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#fca5a5" /> 
          <Text className="text-base text-red-400 ml-3 font-semibold">Logout</Text>
        </TouchableOpacity>

        {/* Version Info Footer */}
        <Text className="text-center text-gray-600 mt-8 text-xs">
           Version 1.0.0 (Build 1)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
} 