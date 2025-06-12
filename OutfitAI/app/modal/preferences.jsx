import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  SafeAreaView,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function Preferences() {
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // State for master preference toggle - DEFAULT TO FALSE
  const [preferencesEnabledGlobally, setPreferencesEnabledGlobally] = useState(false);
  
  // Expanded preference settings
  const [preferences, setPreferences] = useState({
    // Outfit Types
    casualOutfits: true,
    formalOutfits: true,
    sportswear: true,
    winterOutfits: true,
    summerOutfits: true,
    beachWear: false,
    partyWear: false,
    workoutGear: false,
    
    // Style Preferences
    minimalist: false,
    vintage: false,
    streetwear: true,
    bohemian: false,
    preppy: false,
    
    // Outfit Parts
    showShoes: true,
    showAccessories: true,
    showJackets: true,
    showHats: false,
    
    // Color Preferences
    preferDarkColors: false,
    preferBrightColors: true,
    preferNeutralColors: false,
    
    // Other Settings
    notificationsEnabled: true,
    weeklyRecap: true,
    dataCollection: true,
  });

  const [activeTab, setActiveTab] = useState('outfitTypes');

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Toggle function for switches with haptic feedback
  const toggleSwitch = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Only allow toggle if preferences are globally enabled
    if (preferencesEnabledGlobally) {
      setPreferences(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  // Save preferences and return to previous screen
  const savePreferences = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      console.log('Preferences saved successfully');
      router.back();
    } catch (error) {
      console.error('Failed to save preferences', error);
    }
  };

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem('userPreferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      } catch (error) {
        console.error('Failed to load preferences', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Master toggle switch for enabling/disabling all preference selections
  const MasterToggle = () => (
    <View 
      style={[
        styles.masterToggleContainer,
        preferencesEnabledGlobally ? styles.masterToggleEnabled : styles.masterToggleDisabled
      ]}
    >
      <View style={styles.masterToggleTextContainer}>
        <Text 
          style={[
            styles.masterToggleLabel,
            preferencesEnabledGlobally ? styles.masterToggleLabelEnabled : styles.masterToggleLabelDisabled
          ]}
        >
          {preferencesEnabledGlobally ? 'Preference Selection Active' : 'Activate Preference Selection'}
        </Text>
        {!preferencesEnabledGlobally && (
          <Text style={styles.masterToggleHint}>
            Turn this on to choose your preferences.
          </Text>
        )}
      </View>
      <Switch
        trackColor={{ false: "#e0e0e0", true: "rgba(111, 66, 193, 0.4)" }}
        thumbColor={preferencesEnabledGlobally ? "#6F42C1" : "#f4f3f4"}
        ios_backgroundColor="#e0e0e0"
        onValueChange={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setPreferencesEnabledGlobally(prev => !prev);
        }}
        value={preferencesEnabledGlobally}
      />
    </View>
  );

  // Category Switch Component
  const PreferenceSwitch = ({ icon, label, value, onToggle, disabled }) => (
    <TouchableOpacity 
      style={styles.preferenceSwitchContainer}
      activeOpacity={0.7}
      onPress={() => !disabled && onToggle()} // Only toggle if not disabled
      disabled={disabled} // Disable touchable opacity as well
    >
      <View style={[styles.iconContainer, value && !disabled ? styles.activeIconContainer : {}, disabled ? styles.disabledIconContainer : {}]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={disabled ? '#bbb' : (value ? '#fff' : '#666')} 
        />
      </View>
      <Text style={[styles.switchLabel, value && !disabled ? styles.activeSwitchLabel : {}, disabled ? styles.disabledSwitchLabel : {}]}>{label}</Text>
      <Switch
        trackColor={{ false: "#e0e0e0", true: "rgba(111, 66, 193, 0.3)" }}
        thumbColor={disabled ? "#ccc" : (value ? "#6F42C1" : "#f4f3f4")}
        ios_backgroundColor="#e0e0e0"
        onValueChange={() => !disabled && onToggle()} // Only toggle if not disabled
        value={value}
        style={styles.switch}
        disabled={disabled} // Disable switch
      />
    </TouchableOpacity>
  );

  // Tab Button Component
  const TabButton = ({ title, iconName, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive ? styles.activeTabButton : {}]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Ionicons 
        name={iconName} 
        size={20} 
        color={isActive ? '#6F42C1' : '#777'} 
      />
      <Text style={[styles.tabButtonText, isActive ? styles.activeTabButtonText : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Reset to defaults
  const resetToDefaults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Default preferences
    const defaultPreferences = {
      casualOutfits: true,
      formalOutfits: true,
      sportswear: true,
      winterOutfits: true,
      summerOutfits: true,
      beachWear: false,
      partyWear: false,
      workoutGear: false,
      minimalist: false,
      vintage: false,
      streetwear: true,
      bohemian: false,
      preppy: false,
      showShoes: true,
      showAccessories: true,
      showJackets: true,
      showHats: false,
      preferDarkColors: false,
      preferBrightColors: true,
      preferNeutralColors: false,
      notificationsEnabled: true,
      weeklyRecap: true,
      dataCollection: true,
    };
    
    setPreferences(defaultPreferences);
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'outfitTypes':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Outfit Types</Text>
            <Text style={styles.tabContentDescription}>
              Select what kind of outfits you'd like to see in your recommendations
            </Text>
            
            <View style={styles.preferencesGrid}>
              <PreferenceSwitch 
                icon="tshirt-crew" 
                label="Casual" 
                value={preferences.casualOutfits} 
                onToggle={() => toggleSwitch('casualOutfits')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="tie" 
                label="Formal" 
                value={preferences.formalOutfits} 
                onToggle={() => toggleSwitch('formalOutfits')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="run" 
                label="Sports" 
                value={preferences.sportswear} 
                onToggle={() => toggleSwitch('sportswear')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="snowflake" 
                label="Winter" 
                value={preferences.winterOutfits} 
                onToggle={() => toggleSwitch('winterOutfits')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="white-balance-sunny" 
                label="Summer" 
                value={preferences.summerOutfits} 
                onToggle={() => toggleSwitch('summerOutfits')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="umbrella-beach" 
                label="Beach" 
                value={preferences.beachWear} 
                onToggle={() => toggleSwitch('beachWear')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="party-popper" 
                label="Party" 
                value={preferences.partyWear} 
                onToggle={() => toggleSwitch('partyWear')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="dumbbell" 
                label="Workout" 
                value={preferences.workoutGear} 
                onToggle={() => toggleSwitch('workoutGear')} 
                disabled={!preferencesEnabledGlobally}
              />
            </View>
          </View>
        );
      
      case 'stylePreferences':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Style Preferences</Text>
            <Text style={styles.tabContentDescription}>
              Define your personal style to get more tailored recommendations
            </Text>
            
            <View style={styles.preferencesGrid}>
              <PreferenceSwitch 
                icon="gesture-tap-box" 
                label="Minimalist" 
                value={preferences.minimalist} 
                onToggle={() => toggleSwitch('minimalist')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="home-roof" 
                label="Vintage" 
                value={preferences.vintage} 
                onToggle={() => toggleSwitch('vintage')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="tennis-ball" 
                label="Streetwear" 
                value={preferences.streetwear} 
                onToggle={() => toggleSwitch('streetwear')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="flower" 
                label="Bohemian" 
                value={preferences.bohemian} 
                onToggle={() => toggleSwitch('bohemian')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="hanger" 
                label="Preppy" 
                value={preferences.preppy} 
                onToggle={() => toggleSwitch('preppy')} 
                disabled={!preferencesEnabledGlobally}
              />
            </View>
            
            <View style={styles.colorSection}>
              <Text style={styles.colorSectionTitle}>Color Preferences</Text>
              
              <PreferenceSwitch 
                icon="brightness-3" 
                label="Dark Colors" 
                value={preferences.preferDarkColors} 
                onToggle={() => toggleSwitch('preferDarkColors')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="brightness-7" 
                label="Bright Colors" 
                value={preferences.preferBrightColors} 
                onToggle={() => toggleSwitch('preferBrightColors')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="palette-outline" 
                label="Neutral Tones" 
                value={preferences.preferNeutralColors} 
                onToggle={() => toggleSwitch('preferNeutralColors')} 
                disabled={!preferencesEnabledGlobally}
              />
            </View>
          </View>
        );
      
      case 'outfitParts':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Outfit Components</Text>
            <Text style={styles.tabContentDescription}>
              Customize which parts to include in your outfit recommendations
            </Text>
            
            <View style={styles.preferencesGrid}>
              <PreferenceSwitch 
                icon="shoe-heel" 
                label="Shoes" 
                value={preferences.showShoes} 
                onToggle={() => toggleSwitch('showShoes')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="necklace" 
                label="Accessories" 
                value={preferences.showAccessories} 
                onToggle={() => toggleSwitch('showAccessories')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="jacket" 
                label="Jackets" 
                value={preferences.showJackets} 
                onToggle={() => toggleSwitch('showJackets')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="hat-fedora" 
                label="Hats" 
                value={preferences.showHats} 
                onToggle={() => toggleSwitch('showHats')} 
                disabled={!preferencesEnabledGlobally}
              />
            </View>
          </View>
        );
      
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>General Settings</Text>
            <Text style={styles.tabContentDescription}>
              Manage your app settings and notifications
            </Text>
            
            <View style={styles.settingsSection}>
              <PreferenceSwitch 
                icon="bell-ring" 
                label="Enable Notifications" 
                value={preferences.notificationsEnabled} 
                onToggle={() => toggleSwitch('notificationsEnabled')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="calendar-clock" 
                label="Weekly Style Recap" 
                value={preferences.weeklyRecap} 
                onToggle={() => toggleSwitch('weeklyRecap')} 
                disabled={!preferencesEnabledGlobally}
              />
              <PreferenceSwitch 
                icon="database" 
                label="Improve with My Data" 
                value={preferences.dataCollection} 
                onToggle={() => toggleSwitch('dataCollection')} 
                disabled={!preferencesEnabledGlobally}
              />
              
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetToDefaults}
                disabled={!preferencesEnabledGlobally}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#666" />
                <Text style={styles.resetButtonText}>Reset to Default Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Preferences</Text>
          <TouchableOpacity onPress={savePreferences} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Master Enable Toggle */}
        <MasterToggle />
        
        {/* Tabs - These will be removed */}
        <View style={styles.tabsContainer}>
          <TabButton 
            title="Outfit Types" 
            iconName="shirt-outline"
            isActive={activeTab === 'outfitTypes'} 
            onPress={() => setActiveTab('outfitTypes')} 
          />
          <TabButton 
            title="Styles" 
            iconName="color-palette-outline"
            isActive={activeTab === 'stylePreferences'} 
            onPress={() => setActiveTab('stylePreferences')} 
          />
          <TabButton 
            title="Outfit Parts" 
            iconName="ellipsis-horizontal-circle-outline"
            isActive={activeTab === 'outfitParts'} 
            onPress={() => setActiveTab('outfitParts')} 
          />
          {/* Removed Color and Other Settings for brevity, will consolidate all */}
        </View>
        
        {/* Scrollable Content Area for Preferences */}
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()} 
          {/* This will be replaced by a direct rendering of all filtered preferences */}
        </ScrollView>

        {/* Floating Reset Button */}
        <TouchableOpacity 
          style={styles.floatingResetButton}
          onPress={resetToDefaults}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="backup-restore" size={24} color="#fff" />
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Light background for the whole screen
  },
  container: {
    flex: 1,
    backgroundColor: '#fff', // Main container background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC', // Softer border color
    backgroundColor: '#fff', // Header background
  },
  backButton: {
    padding: 5, // Easier to tap
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Darker title for better contrast
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#6F42C1', // Theme color for save
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  masterToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    transitionProperty: 'backgroundColor', // For smooth transition if supported by Animated
    transitionDuration: '0.3s',
  },
  masterToggleEnabled: {
    backgroundColor: '#F0EFFF', // Light purple when enabled
  },
  masterToggleDisabled: {
    backgroundColor: '#F9F9F9', // Default background when disabled
  },
  masterToggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  masterToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  masterToggleLabelEnabled: {
    color: '#6F42C1', // Theme color when enabled
  },
  masterToggleLabelDisabled: {
    color: '#555', // Darker gray when disabled
  },
  masterToggleHint: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Lighter search bar background
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Subtle border for search bar
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45, // Increased height for better touch target
    fontSize: 15,
    color: '#333',
  },
  tabsContainer: { // Will be removed
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    paddingHorizontal: 10, // Add some horizontal padding
  },
  tabButton: { // Will be removed or repurposed
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12, // Add padding for better touch area
    borderRadius: 8, // Rounded corners for tabs
  },
  activeTabButton: { // Will be removed
    backgroundColor: 'rgba(111, 66, 193, 0.1)', // Lighter active tab background
  },
  tabButtonText: { // Will be removed
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  activeTabButtonText: { // Will be removed
    color: '#6F42C1',
    fontWeight: '600',
  },
  scrollViewContent: {
    paddingBottom: 80, // Space for floating button
    paddingHorizontal: 20, // Horizontal padding for content
    paddingTop: 10, // Top padding for content
  },
  tabContent: { // Will be adapted for individual sections if kept, or items directly
    paddingVertical: 10,
  },
  tabContentTitle: { // For section titles if we group them
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  tabContentDescription: { // For section descriptions
    fontSize: 13,
    color: '#777',
    marginBottom: 15,
    lineHeight: 18,
  },
  preferenceSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#fff', // White background for each switch row
    borderRadius: 10, // Rounded corners for switch rows
    marginBottom: 10, // Spacing between rows
    paddingHorizontal: 15, // Padding inside each row
    // Shadow for a card-like effect
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0', // Default icon background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeIconContainer: {
    backgroundColor: '#6F42C1', // Theme color for active icon background
  },
  disabledIconContainer: {
    backgroundColor: '#e0e0e0',
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: '#555', // Slightly darker label color
    fontWeight: '500', // Medium weight for labels
  },
  activeSwitchLabel: {
    color: '#6F42C1', // Theme color for active label
    fontWeight: '600',
  },
  disabledSwitchLabel: {
    color: '#aaa',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }], // Slightly smaller switch
  },
  preferencesGrid: { // Can be used for sections or removed for a single list
    // Styles for grid if we keep a grid layout for some sections
  },
  floatingResetButton: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E74C3C', // Red color for reset
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Add new styles or modify existing ones as needed for the new layout
}); 