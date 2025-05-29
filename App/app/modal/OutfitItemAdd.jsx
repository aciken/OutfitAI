import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Platform, FlatList, Alert, TextInput
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useGlobalContext } from '../context/GlobalProvider';

// This is a placeholder. In a real app, you might get this list dynamically
// or have a more sophisticated way of managing assets.
const outfitAssets = [
  { id: '1', name: 'Polo', source: require('../../assets/outfits/Polo.png') },
  { id: '2', name: 'Trousers', source: require('../../assets/outfits/trousers.png') },
  { id: '3', name: 'Shirt 2', source: require('../../assets/outfits/shirt2.png') },
  { id: '4', name: 'Shoes 1', source: require('../../assets/outfits/shoes1.png') },
  { id: '5', name: 'Shoes 2', source: require('../../assets/outfits/shoes2.png') },
  { id: '6', name: 'Shoes 3', source: require('../../assets/outfits/Shoes3.png') },
  { id: '7', name: 'Jeans 2', source: require('../../assets/outfits/jeans2.png') },
  { id: '8', name: 'Heals 1', source: require('../../assets/outfits/heals1.png') },
  { id: '9', name: 'Dress 1', source: require('../../assets/outfits/dress1.png') },
  { id: '10', name: 'Hoodie 1', source: require('../../assets/outfits/hoodie1.png') },
  { id: '11', name: 'Pants 1', source: require('../../assets/outfits/pants1.png') },
  // Add more items as needed, matching the files in your assets/outfits folder
];

export default function OutfitItemAdd() {
  const router = useRouter();
  const { addSelectedOutfitItem } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState(outfitAssets);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssets(outfitAssets);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = outfitAssets.filter(item => 
        item.name.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredAssets(filtered);
    }
  }, [searchQuery]);

  const handleSelectItem = (item) => {
    // Add item to global context and go back to previous page
    const selectedItem = {
      id: Date.now().toString(),
      source: item.source,
      label: item.name,
      isAsset: true
    };
    
    addSelectedOutfitItem(selectedItem);
    router.back();
  };

  const renderAsset = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectItem(item)}>
      <Image source={item.source} style={styles.itemImage} resizeMode="contain" />
      <Text style={styles.itemName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#1A0D2E" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#C07EFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose an Item</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#AEAEAE" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#AEAEAE"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode={Platform.OS === 'ios' ? 'always' : 'never'}
        />
      </View>

      {filteredAssets.length === 0 ? (
        <View style={styles.noItemsContainer}>
          <Ionicons name="sad-outline" size={60} color="#888" />
          <Text style={styles.noItemsText}>No items found matching "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAsset}
          keyExtractor={(item) => item.id}
          numColumns={2} // Adjust number of columns as needed
          contentContainerStyle={styles.listContentContainer}
          columnWrapperStyle={styles.row}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A0D2E' },
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#2C1B4A', // Slightly different header for modal page
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(192,126,255,0.2)',
  },
  backButton: { padding: 5, marginRight: 15 },
  headerTitle: {
    color: '#E0E0E0',
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44,27,74,0.9)', // Darker purple, similar to other inputs
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10, // Added margin bottom
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,126,255,0.4)', 
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48, // Increased height for better touch target
    color: '#E0E0E0',
    fontSize: 16,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10, // Add space between rows
  },
  itemContainer: {
    flex: 1,
    margin: 6, // Adjusted margin
    backgroundColor: '#362554', // Slightly darker item background
    borderRadius: 12, // More rounded corners
    padding: 12, // Adjusted padding
    alignItems: 'center',
    // aspectRatio: 1, // Removed to allow content to define height better
    minHeight: 160, // Ensure a minimum height for items
    maxWidth: Platform.OS === 'web' ? 'calc(50% - 12px)' : '48%', // Responsive width
    borderWidth: 1,
    borderColor: 'rgba(192,126,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  itemImage: {
    width: '90%', // Slightly larger image within the card
    height: 100, // Fixed height for consistency
    marginBottom: 10, // Increased margin
    borderRadius: 8, // More rounded image corners
  },
  itemName: {
    color: '#EAE0FF', // Brighter text
    fontSize: 14, // Slightly larger font
    fontWeight: '600', // Bolder
    textAlign: 'center',
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50, // Give some space from the search bar
  },
  noItemsText: {
    marginTop: 15,
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 