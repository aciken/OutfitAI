import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Preferences() {
  const router = useRouter();
  
  // Initial preference settings
  const [preferences, setPreferences] = useState({
    casualOutfits: true,
    formalOutfits: true,
    sportswear: true,
    winterOutfits: true,
    summerOutfits: true,
    showShoes: true,
    showAccessories: true,
  });

  // Toggle function for switches
  const toggleSwitch = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Preference category with label and switch
  const PreferenceItem = ({ label, value, onToggle }) => (
    <View style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        trackColor={{ false: "#e0e0e0", true: "#A020F0" }}
        thumbColor={value ? "#8A2BE2" : "#f4f3f4"}
        ios_backgroundColor="#e0e0e0"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  // Save preferences and return to previous screen
  const savePreferences = () => {
    // In a real app, you would save these to storage or API
    console.log('Saving preferences:', preferences);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#8A2BE2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit Preferences</Text>
        <View style={{ width: 24 }} /> {/* Empty space for balance */}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Outfit Types</Text>
          <View style={styles.sectionContent}>
            <PreferenceItem 
              label="Casual Outfits" 
              value={preferences.casualOutfits} 
              onToggle={() => toggleSwitch('casualOutfits')} 
            />
            <PreferenceItem 
              label="Formal Outfits" 
              value={preferences.formalOutfits} 
              onToggle={() => toggleSwitch('formalOutfits')} 
            />
            <PreferenceItem 
              label="Sportswear" 
              value={preferences.sportswear} 
              onToggle={() => toggleSwitch('sportswear')} 
            />
            <PreferenceItem 
              label="Winter Outfits" 
              value={preferences.winterOutfits} 
              onToggle={() => toggleSwitch('winterOutfits')} 
            />
            <PreferenceItem 
              label="Summer Outfits" 
              value={preferences.summerOutfits} 
              onToggle={() => toggleSwitch('summerOutfits')} 
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Outfit Parts</Text>
          <View style={styles.sectionContent}>
            <PreferenceItem 
              label="Show Shoes" 
              value={preferences.showShoes} 
              onToggle={() => toggleSwitch('showShoes')} 
            />
            <PreferenceItem 
              label="Show Accessories" 
              value={preferences.showAccessories} 
              onToggle={() => toggleSwitch('showAccessories')} 
            />
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={savePreferences}
          style={styles.saveButtonWrapper}
        >
          <LinearGradient
            colors={['#8A2BE2', '#A020F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 