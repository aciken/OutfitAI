import React from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const router = useRouter();

  // Placeholder data - replace with actual outfit history later
  const historyItems = [
    { id: '1', date: '2024-07-28', description: 'Casual Outfit - Hoodie, Jeans' },
    { id: '2', date: '2024-07-27', description: 'Formal Outfit - Dress, Heels' },
    { id: '3', date: '2024-07-26', description: 'Sportswear - Running gear' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="chevron-back" size={28} color="#6F42C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit History</Text>
        <View style={{ width: 28 }} /> {/* Spacer */}
      </View>

      {/* History List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {historyItems.length > 0 ? (
          historyItems.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyIconContainer}>
                <Ionicons name="shirt-outline" size={20} color="#6F42C1" />
              </View>
              <View style={styles.historyTextContainer}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No outfit history yet.</Text>
            <Text style={styles.emptySubText}>Start creating outfits to see them here!</Text>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0E7FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  historyDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#aaa',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
}); 