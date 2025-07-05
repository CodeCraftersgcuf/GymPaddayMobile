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
  ActivityIndicator,
  RefreshControl,
 
} from 'react-native';
import Modal from 'react-native-modal'; // ✅ Correct

import { useRouter } from 'expo-router';
import { categories } from '@/constants/marketData';
import { AntDesign, Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';

//Code Related to the integration
import { useQuery } from '@tanstack/react-query';
import { getMarketplaceListings } from '@/utils/queries/marketplace';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";



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
  const isDark = dark;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  // Default to 'all' so all listings show by default
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const dummyImage = "https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg";
  const [profileImage, setProfileImage] = useState<string | null>(dummyImage);
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(dummyImage);
          }
        } else {
          setProfileImage(dummyImage);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(dummyImage);
      }
    })();
  }, []);
  const nigeriaLocations = [
    { id: 'all', name: 'All' },
    { id: 'lagos', name: 'Lagos' },
    { id: 'abuja', name: 'Abuja' },
    { id: 'kaduna', name: 'Kaduna' },
    { id: 'portharcourt', name: 'Port Harcourt' },
    { id: 'ibadan', name: 'Ibadan' },
  ];

  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    cardBackground: isDark ? '#181818' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#CCCCCC' : '#666666',
    headerBackground: '#FF0000',
    searchBackground: "#BD0000",
    borderColor: isDark ? '#333333' : '#E5E5E5',
  };

  // --- Fetch listings from API ---
  const [token, setToken] = useState<string | null>(null);
  React.useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      return await getMarketplaceListings(token);
    },
    enabled: !!token,
  });
  console.log("listing data", data)

  // Add refresh state (optional, but not strictly needed with isFetching)
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // --- Map API data to local listing structure ---
  const API_BASE_URL = 'http://127.0.0.1:8000/storage/';

  // Map local category id to API category name for filtering
  const categoryIdToApiName: Record<string, string> = {
    gym: 'gymEquipment',
    supplement: 'supplement',
    wears: 'wears',
    others: 'others',
  };

  // const BASE_STORAGE_URL = 'http://192.168.175.151:8000/storage/';
  const BASE_STORAGE_URL = 'https://gympaddy.hmstech.xyz/storage/';


  const apiListings = Array.isArray(data?.data)
    ? data.data.map((item: any) => {
      // Handle product image
      let imageUrl = dummyImage;
      if (Array.isArray(item.media_urls) && item.media_urls.length > 0) {
        const firstUrl = item.media_urls[0];
        imageUrl = firstUrl.startsWith('http')
          ? firstUrl
          : BASE_STORAGE_URL + firstUrl;
      }

      // Handle seller avatar
      let sellerAvatar = dummyImage;
      if (item.user?.profile_picture_url) {
        sellerAvatar = item.user.profile_picture_url.startsWith('http')
          ? item.user.profile_picture_url
          : BASE_STORAGE_URL + item.user.profile_picture_url.replace(/^\/?storage\//, '');
      }

      const categoryName = item.category?.name || '';
      const sellerName = item.user?.name || 'User';
      // Use created_at for timeAgo
      const timeAgo = item.created_at ? getTimeAgo(item.created_at) : 'Just now';

      return {
        id: String(item.id),
        title: item.title,
        price: item.price,
        category: categoryName,
        image: imageUrl,
        isTopAd: !!item.isTopAd,
        sellerAvatar: sellerAvatar,
        seller: sellerName,
        timeAgo: timeAgo,
        is_featured: item.is_featured
      };
    })
    : [];
  // console.log("apiListings",apiListings)

  // --- Filtering ---
  const filteredListings = apiListings.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === categoryIdToApiName[selectedCategory];

    const matchesLocation =
      selectedLocation === 'all' || (item.user?.location?.toLowerCase() === selectedLocation);

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const topListings = filteredListings.filter((item) => item.is_featured);
  const allListings = filteredListings;
  console.log("topListings", filteredListings)
  const handleItemPress = (item: any) => {
    router.push({
      pathname: '/marketView',
      params: { id: item.toString() }, // always pass params as strings
    });

    // router.push("/marketProfile");
  };
  const handleMarketProfile =()=>{
    router.push("/marketProfile");
  }

  // Add this helper component for image loading indicator
  function ImageWithLoading({ source, style, ...props }) {
    const [loading, setLoading] = useState(true);
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, style]}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          {...props}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color="#FF0000"
            style={{ position: 'absolute' }}
          />
        )}
      </View>
    );
  }

  const renderListingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.listingCard, { backgroundColor: theme.cardBackground }]}
      onPress={() => handleItemPress(item.id)}
    >
      <ImageWithLoading source={{ uri: item.image }} style={styles.listingImage} />
      {item.isTopAd && (
        <View style={styles.topAdBadge}>
          <Text style={styles.topAdText}>Top Ad</Text>
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>
          ₦{Intl.NumberFormat('en-NG').format(Math.floor(item.price))}
        </Text>

        <TouchableOpacity onPress={() => router.push('/marketView')} style={styles.sellerInfo}>
          <ImageWithLoading
            source={{ uri: item.sellerAvatar || dummyImage }}
            style={styles.sellerAvatar}
          />
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', gap: 12 }}>
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

  // --- Loading state ---
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF0000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_400Regular', }]}>Marketplace</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => handleMarketProfile()} style={styles.notificationButton}>
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notification')}>
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
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.searchBackground }]}
            onPress={() => setShowLocationSheet(true)}
          >
            <Text style={styles.filterText}>
              {nigeriaLocations.find((l) => l.id === selectedLocation)?.name || 'Location'}
            </Text>
            <Entypo name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>



          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.searchBackground }]}
            onPress={() => setShowCategorySheet(true)}
          >
            <Text style={styles.filterText}>
              {categories.find((c) => c.id === selectedCategory)?.title || 'Category'}
            </Text>
            <Entypo name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>

        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || refreshing}
            onRefresh={onRefresh}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
      >
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
            ))}
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
          {allListings.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                No listings right now
              </Text>
            </View>
          ) : (
            <FlatList
              data={allListings}
              renderItem={renderListingItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListings}
            />
          )}
        </View>
      </ScrollView>
    <Modal
  isVisible={showLocationSheet}
  onBackdropPress={() => setShowLocationSheet(false)}
  onSwipeComplete={() => setShowLocationSheet(false)}
  swipeDirection="down"
  style={styles.modal}
>
  <View style={styles.bottomSheetContent}>
    {nigeriaLocations.map(loc => (
      <TouchableOpacity key={loc.id} onPress={() => {
        setSelectedLocation(loc.id);
        setShowLocationSheet(false);
      }}>
        <Text style={styles.bottomSheetItem}>{loc.name}</Text>
      </TouchableOpacity>
    ))}
  </View>
</Modal>

<Modal
  isVisible={showCategorySheet}
  onBackdropPress={() => setShowCategorySheet(false)}
  onSwipeComplete={() => setShowCategorySheet(false)}
  swipeDirection="down"
  style={styles.modal}
>
  <View style={styles.bottomSheetContent}>
    {categories.map(cat => (
      <TouchableOpacity key={cat.id} onPress={() => {
        setSelectedCategory(cat.id);
        setShowCategorySheet(false);
      }}>
        <Text style={styles.bottomSheetItem}>{cat.title}</Text>
      </TouchableOpacity>
    ))}
  </View>
</Modal>


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
   
    paddingBottom: 60,
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
    // fontStyle: 'italic',
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
    shadowColor: '#8B8585',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25, // 40 hex = 25% opacity
    shadowRadius: 15,
    elevation: 5, // for Android (you can tweak this)
    flex: 1,
    alignItems: 'center',
    // padding: 16,
    paddingVertical: 16,
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
    paddingBottom: 16,
    gap: 8,
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
    shadowColor: '#8B8585',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25, // equivalent of 40 in #8B858540
    shadowRadius: 5,
    elevation: 3, // for Android - tweak as needed
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 100,
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
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF0000',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 10,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 8,
    flex: 1,
  },
  timeAgo: {
    fontSize: 8,
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
 modal: {
  justifyContent: 'flex-end',
  margin: 0, // removes default margin
},
bottomSheetContent: {
  backgroundColor: 'white',
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: '50%', // optional: prevents full screen takeover
},
bottomSheetItem: {
  paddingVertical: 14,
  fontSize: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

});

// Helper to get "time ago" string
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}