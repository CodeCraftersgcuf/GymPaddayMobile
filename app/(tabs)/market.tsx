import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { categories, mockListings } from '@/constants/marketData';
import { AntDesign, Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';


interface ListingItem {
  id: string;
  title: string;
  price: string;
  seller: string;
  timeAgo: string;
  image: string;
  isTopAd?: boolean;
  category: string;
}

export default function MarketplaceScreen() {
  const { dark } = useTheme();
  const isDark = dark; // You can control this boolean
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('gym');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    cardBackground: isDark ? '#181818' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#CCCCCC' : '#666666',
    headerBackground: '#FF0000',
    searchBackground: "#BD0000",
    borderColor: isDark ? '#333333' : '#E5E5E5',
  };

  const filteredListings = mockListings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const topListings = filteredListings.filter((item) => item.isTopAd);
  const allListings = filteredListings;

  const handleItemPress = (item: ListingItem) => {
    router.push('/marketView');
  };

  const renderListingItem = ({ item }: { item: ListingItem }) => (
    <TouchableOpacity
      style={[styles.listingCard, { backgroundColor: theme.cardBackground }]}
      onPress={() => handleItemPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.listingImage} />
      {item.isTopAd && (
        <View style={styles.topAdBadge}>
          <Text style={styles.topAdText}>Top Ad</Text>
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>{item.price}</Text>
        <TouchableOpacity onPress={() => router.push('/marketProfile')} style={styles.sellerInfo}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' }}
            style={styles.sellerAvatar}
          />
          <View style={{ flexDirection: 'column' }}>
            <Text style={[styles.sellerName, { color: theme.textSecondary }]}>
              {item.seller}
            </Text>
            <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
              {item.timeAgo}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <View style={styles.headerRight}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: "#BD0000" }]}>
          <Feather name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.searchBackground }]}>
            <Text style={styles.filterText}>Location</Text>
            <Entypo name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.searchBackground }]}>
            <Text style={styles.filterText}>Categories</Text>
            <Entypo name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Categories */}
        <ThemedView darkColor='black' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
          <ThemedView darkColor='black' style={{ flexDirection: 'row', marginHorizontal: 20, gap: 5 }}>
            {categories.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.cardBackground },
                  selectedCategory === item.id && { borderColor: '#FF0000', borderWidth: 2 },
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.categoryText, { color: theme.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))
            }
          </ThemedView>
        </ThemedView>

        {/* Top Listings */}
        {topListings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Listings</Text>
            <FlatList
              data={topListings}
              renderItem={renderListingItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListings}
            />
          </View>
        )}

        {/* All Listings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>All Listings</Text>
          {/* {allListings.map((item) => ( */}
          <FlatList
            data={allListings}
            renderItem={renderListingItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListings}
          />
          {/* ))} */}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/addListing')}>
        <AntDesign name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginVertical: 10
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    paddingVertical: 10,
    borderRadius: 16,
    // minWidth: 100,
    // marginRight: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  horizontalListings: {
    paddingHorizontal: 20,
    gap: 16,
  },
  verticalListingItem: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    // width: 200,
    marginHorizontal: 3,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 120,
  },
  topAdBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topAdText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF0000',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 12,
    flex: 1,
  },
  timeAgo: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});