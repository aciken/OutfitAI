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
  Dimensions
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
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

  // Category Switch Component
  const PreferenceSwitch = ({ icon, label, value, onToggle }) => (
    <TouchableOpacity 
      style={styles.preferenceSwitchContainer}
      activeOpacity={0.7}
      onPress={() => onToggle()}
    >
      <View style={[styles.iconContainer, value ? styles.activeIconContainer : {}]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={value ? '#fff' : '#666'} 
        />
      </View>
      <Text style={[styles.switchLabel, value ? styles.activeSwitchLabel : {}]}>{label}</Text>
      <Switch
        trackColor={{ false: "#e0e0e0", true: "rgba(111, 66, 193, 0.3)" }}
        thumbColor={value ? "#6F42C1" : "#f4f3f4"}
        ios_backgroundColor="#e0e0e0"
        onValueChange={onToggle}
        value={value}
        style={styles.switch}
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
              />
              <PreferenceSwitch 
                icon="tie" 
                label="Formal" 
                value={preferences.formalOutfits} 
                onToggle={() => toggleSwitch('formalOutfits')} 
              />
              <PreferenceSwitch 
                icon="run" 
                label="Sports" 
                value={preferences.sportswear} 
                onToggle={() => toggleSwitch('sportswear')} 
              />
              <PreferenceSwitch 
                icon="snowflake" 
                label="Winter" 
                value={preferences.winterOutfits} 
                onToggle={() => toggleSwitch('winterOutfits')} 
              />
              <PreferenceSwitch 
                icon="white-balance-sunny" 
                label="Summer" 
                value={preferences.summerOutfits} 
                onToggle={() => toggleSwitch('summerOutfits')} 
              />
              <PreferenceSwitch 
                icon="umbrella-beach" 
                label="Beach" 
                value={preferences.beachWear} 
                onToggle={() => toggleSwitch('beachWear')} 
              />
              <PreferenceSwitch 
                icon="party-popper" 
                label="Party" 
                value={preferences.partyWear} 
                onToggle={() => toggleSwitch('partyWear')} 
              />
              <PreferenceSwitch 
                icon="dumbbell" 
                label="Workout" 
                value={preferences.workoutGear} 
                onToggle={() => toggleSwitch('workoutGear')} 
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
              />
              <PreferenceSwitch 
                icon="home-roof" 
                label="Vintage" 
                value={preferences.vintage} 
                onToggle={() => toggleSwitch('vintage')} 
              />
              <PreferenceSwitch 
                icon="tennis-ball" 
                label="Streetwear" 
                value={preferences.streetwear} 
                onToggle={() => toggleSwitch('streetwear')} 
              />
              <PreferenceSwitch 
                icon="flower" 
                label="Bohemian" 
                value={preferences.bohemian} 
                onToggle={() => toggleSwitch('bohemian')} 
              />
              <PreferenceSwitch 
                icon="hanger" 
                label="Preppy" 
                value={preferences.preppy} 
                onToggle={() => toggleSwitch('preppy')} 
              />
            </View>
            
            <View style={styles.colorSection}>
              <Text style={styles.colorSectionTitle}>Color Preferences</Text>
              
              <PreferenceSwitch 
                icon="brightness-3" 
                label="Dark Colors" 
                value={preferences.preferDarkColors} 
                onToggle={() => toggleSwitch('preferDarkColors')} 
              />
              <PreferenceSwitch 
                icon="brightness-7" 
                label="Bright Colors" 
                value={preferences.preferBrightColors} 
                onToggle={() => toggleSwitch('preferBrightColors')} 
              />
              <PreferenceSwitch 
                icon="palette-outline" 
                label="Neutral Tones" 
                value={preferences.preferNeutralColors} 
                onToggle={() => toggleSwitch('preferNeutralColors')} 
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
              />
              <PreferenceSwitch 
                icon="necklace" 
                label="Accessories" 
                value={preferences.showAccessories} 
                onToggle={() => toggleSwitch('showAccessories')} 
              />
              <PreferenceSwitch 
                icon="jacket" 
                label="Jackets" 
                value={preferences.showJackets} 
                onToggle={() => toggleSwitch('showJackets')} 
              />
              <PreferenceSwitch 
                icon="hat-fedora" 
                label="Hats" 
                value={preferences.showHats} 
                onToggle={() => toggleSwitch('showHats')} 
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
              />
              <PreferenceSwitch 
                icon="calendar-clock" 
                label="Weekly Style Recap" 
                value={preferences.weeklyRecap} 
                onToggle={() => toggleSwitch('weeklyRecap')} 
              />
              <PreferenceSwitch 
                icon="database" 
                label="Improve with My Data" 
                value={preferences.dataCollection} 
                onToggle={() => toggleSwitch('dataCollection')} 
              />
              
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetToDefaults}
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
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="chevron-back" size={28} color="#6F42C1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Preferences</Text>
          <TouchableOpacity 
            onPress={savePreferences}
            style={styles.saveButton}
          >
            <Ionicons name="checkmark" size={28} color="#6F42C1" />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            <TabButton 
              title="Outfit Types" 
              iconName="shirt-outline" 
              isActive={activeTab === 'outfitTypes'} 
              onPress={() => setActiveTab('outfitTypes')} 
            />
            <TabButton 
              title="Style" 
              iconName="color-palette-outline" 
              isActive={activeTab === 'stylePreferences'} 
              onPress={() => setActiveTab('stylePreferences')} 
            />
            <TabButton 
              title="Components" 
              iconName="grid-outline" 
              isActive={activeTab === 'outfitParts'} 
              onPress={() => setActiveTab('outfitParts')} 
            />
            <TabButton 
              title="Settings" 
              iconName="settings-outline" 
              isActive={activeTab === 'settings'} 
              onPress={() => setActiveTab('settings')} 
            />
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {renderTabContent()}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  tabsContainer: {
    paddingVertical: 16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabButton: {
    backgroundColor: '#F0E7FE',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: '#6F42C1',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  tabContent: {
    marginHorizontal: 16,
  },
  tabContentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  tabContentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  preferenceSwitchContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIconContainer: {
    backgroundColor: '#6F42C1',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  activeSwitchLabel: {
    color: '#333',
  },
  switch: {
    alignSelf: 'flex-start',
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  colorSection: {
    marginTop: 20,
  },
  colorSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
}); 