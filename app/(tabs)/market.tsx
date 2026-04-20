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
import { useFocusEffect } from '@react-navigation/native';
import { categories } from '@/constants/marketData';
import { AntDesign, Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';
import { formatNaira } from '@/utils/formatters';

//Code Related to the integration
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBusinessStatus, getMarketplaceListingById, getMarketplaceListings } from '@/utils/queries/marketplace';
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
  location?: string;
}

export default function MarketplaceScreen() {
  const themeContext = useTheme();
  const isDark = themeContext?.dark ?? false;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  // Default to 'all' so all listings show by default
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const queryClient = useQueryClient();

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
    { id: 'abia', name: 'Abia' },
    { id: 'adamawa', name: 'Adamawa' },
    { id: 'agege', name: 'Agege, Lagos' },
    { id: 'ajah', name: 'Ajah, Lagos' },
    { id: 'akwa-ibom', name: 'Akwa Ibom' },
    { id: 'alimosho', name: 'Alimosho, Lagos' },
    { id: 'anambra', name: 'Anambra' },
    { id: 'asaba', name: 'Asaba, Delta' },
    { id: 'bauchi', name: 'Bauchi' },
    { id: 'bayelsa', name: 'Bayelsa' },
    { id: 'benin-city', name: 'Benin City, Edo' },
    { id: 'benue', name: 'Benue' },
    { id: 'borno', name: 'Borno' },
    { id: 'calabar', name: 'Calabar, Cross River' },
    { id: 'cross-river', name: 'Cross River' },
    { id: 'delta', name: 'Delta' },
    { id: 'ebonyi', name: 'Ebonyi' },
    { id: 'edo', name: 'Edo' },
    { id: 'ekiti', name: 'Ekiti' },
    { id: 'enugu', name: 'Enugu' },
    { id: 'festac', name: 'Festac, Lagos' },
    { id: 'abuja', name: 'FCT Abuja' },
    { id: 'garki', name: 'Garki, Abuja' },
    { id: 'gbagada', name: 'Gbagada, Lagos' },
    { id: 'gombe', name: 'Gombe' },
    { id: 'gwarinpa', name: 'Gwarinpa, Abuja' },
    { id: 'ibadan', name: 'Ibadan, Oyo' },
    { id: 'ikeja', name: 'Ikeja, Lagos' },
    { id: 'ikorodu', name: 'Ikorodu, Lagos' },
    { id: 'ikoyi', name: 'Ikoyi, Lagos' },
    { id: 'imo', name: 'Imo' },
    { id: 'jigawa', name: 'Jigawa' },
    { id: 'kaduna', name: 'Kaduna' },
    { id: 'kano', name: 'Kano' },
    { id: 'katsina', name: 'Katsina' },
    { id: 'kebbi', name: 'Kebbi' },
    { id: 'kogi', name: 'Kogi' },
    { id: 'kwara', name: 'Kwara' },
    { id: 'lagos', name: 'Lagos' },
    { id: 'lagos-island', name: 'Lagos Island, Lagos' },
    { id: 'lekki', name: 'Lekki, Lagos' },
    { id: 'maitama', name: 'Maitama, Abuja' },
    { id: 'maryland', name: 'Maryland, Lagos' },
    { id: 'mushin', name: 'Mushin, Lagos' },
    { id: 'nasarawa', name: 'Nasarawa' },
    { id: 'niger', name: 'Niger' },
    { id: 'ogun', name: 'Ogun' },
    { id: 'ondo', name: 'Ondo' },
    { id: 'oshodi', name: 'Oshodi, Lagos' },
    { id: 'osun', name: 'Osun' },
    { id: 'owerri', name: 'Owerri, Imo' },
    { id: 'oyo', name: 'Oyo' },
    { id: 'plateau', name: 'Plateau' },
    { id: 'port-harcourt', name: 'Port Harcourt, Rivers' },
    { id: 'rivers', name: 'Rivers' },
    { id: 'sokoto', name: 'Sokoto' },
    { id: 'surulere', name: 'Surulere, Lagos' },
    { id: 'taraba', name: 'Taraba' },
    { id: 'victoria-island', name: 'Victoria Island, Lagos' },
    { id: 'warri', name: 'Warri, Delta' },
    { id: 'wuse', name: 'Wuse, Abuja' },
    { id: 'yaba', name: 'Yaba, Lagos' },
    { id: 'yobe', name: 'Yobe' },
    { id: 'zamfara', name: 'Zamfara' },
  ];

  const filteredLocations = nigeriaLocations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    cardBackground: isDark ? '#181818' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#CCCCCC' : '#666666',
    headerBackground: '#940304',
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
  const { data:businessData } = useQuery({
    queryKey: ['get-business-status'],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      return await getBusinessStatus(token);
    },
    enabled: !!token,
  });
  console.log("Business Data", businessData)

  // Add refresh state (optional, but not strictly needed with isFetching)
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        refetch();
      }
    }, [token, refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // --- Map API data to local listing structure ---

  // Map local category id to API category name for filtering
  const categoryIdToApiName: Record<string, string> = {
    gym: 'gymEquipment',
    supplement: 'supplement',
    wears: 'wears',
    others: 'others',
  };

  // const BASE_STORAGE_URL = 'http://192.168.175.151:8000/storage/';
  const BASE_STORAGE_URL = 'https://gympaddy.skillverse.com.pk/storage/';


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
        price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
        category: categoryName,
        image: imageUrl,
        isTopAd: !!item.isTopAd,
        sellerAvatar: sellerAvatar,
        seller: sellerName,
        timeAgo: timeAgo,
        is_featured: item.is_featured,
        location: item.location || item.user?.location || ''
      };
    })
    : [];
  // console.log("apiListings",apiListings)

  // --- Filtering ---
  const filteredListings = apiListings.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (() => {
        const want = categoryIdToApiName[selectedCategory];
        const label = categories.find((c) => c.id === selectedCategory)?.title || '';
        const needle = (label.split(/\s+/)[0] || want || '').toLowerCase();
        const raw = String(item.category || '').toLowerCase();
        if (want && raw.includes(want.toLowerCase())) return true;
        if (needle.length >= 2 && raw.includes(needle)) return true;
        if (selectedCategory === 'gym') return /gym|equipment|weight|dumbbell|cardio/i.test(raw);
        if (selectedCategory === 'supplement') return /supplement|vitamin|protein/i.test(raw);
        if (selectedCategory === 'wears') return /wear|shirt|shoe|cloth|apparel|shorts/i.test(raw);
        if (selectedCategory === 'others') return /other|misc|accessory/i.test(raw);
        return false;
      })();

    const matchesLocation =
      selectedLocation === 'all' ||
      (() => {
        const loc = String(item.location || '').toLowerCase();
        const selected = nigeriaLocations.find((l) => l.id === selectedLocation);
        const name = selected?.name?.toLowerCase() || '';
        if (!name) return false;
        const parts = name.split(/[,\s]+/).filter((p) => p.length > 2);
        return parts.some((p) => loc.includes(p)) || loc.includes(selectedLocation.replace(/-/g, ' '));
      })();

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const topListings = filteredListings.filter((item) => item.is_featured);
  const allListings = filteredListings;
  // console.log("topListings", filteredListings)
  const handleItemPress = (item: any) => {
    router.push({
      pathname: '/marketView',
      params: { id: item.toString() }, // always pass params as strings
    });

    // router.push("/marketProfile");
  };
  const handleMarketProfile = () => {
    router.push("/marketProfile");
  }
React.useEffect(() => {
  if (token && Array.isArray(data?.data)) {
    data.data.forEach((item: any) => {
      console.log('Prefetching listing:', item.id);
      queryClient.prefetchQuery({
        queryKey: ['marketplace-listing', item.id, token],
        queryFn: async () => {
          return getMarketplaceListingById(Number(item.id), token);
        },
      });
    });
  }
}, [data, token]);

  // Image helper: show a small loader only on the very first load for this
  // image. Subsequent re-renders (e.g. while filtering/searching) will NOT
  // re-show the spinner, so the UI feels stable on iOS.
  function ImageWithLoading({ source, style, ...props }) {
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, style]}
          onLoadStart={() => {
            if (!hasLoadedOnce) setLoading(true);
          }}
          onLoadEnd={() => {
            setLoading(false);
            setHasLoadedOnce(true);
          }}
          {...props}
        />
        {loading && !hasLoadedOnce && (
          <ActivityIndicator
            size="small"
            color="#940304"
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
          ₦{Intl.NumberFormat('en-NG').format(Math.floor(item.price || 0))}
        </Text>

        {/* <TouchableOpacity onPress={() => router.push('/marketView')} style={styles.sellerInfo}> */}
        <TouchableOpacity style={styles.sellerInfo}>

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
      </View >
    </TouchableOpacity >
  );

  // --- Loading state ---
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#940304" />
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
            colors={['#940304']}
            tintColor="#940304"
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
                  selectedCategory === item.id && { borderColor: '#940304', borderWidth: 2 },
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
        onBackdropPress={() => { setShowLocationSheet(false); setLocationSearchQuery(''); }}
        onSwipeComplete={() => { setShowLocationSheet(false); setLocationSearchQuery(''); }}
        swipeDirection="down"
        style={styles.modal}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => { setShowLocationSheet(false); setLocationSearchQuery(''); }}>
              <AntDesign name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchContainer}>
            <Feather name="search" size={18} color="#999" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search location..."
              placeholderTextColor="#999"
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
              autoCorrect={false}
            />
            {locationSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                <AntDesign name="closecircle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: '100%' }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLocations.map(loc => (
              <TouchableOpacity key={loc.id} onPress={() => {
                setSelectedLocation(loc.id);
                setShowLocationSheet(false);
                setLocationSearchQuery('');
              }}>
                <Text style={[
                  styles.bottomSheetItem,
                  selectedLocation === loc.id && { color: '#940304', fontWeight: '600' }
                ]}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
            {filteredLocations.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#999', paddingVertical: 20 }}>No locations found</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        isVisible={showCategorySheet}
        onBackdropPress={() => { setShowCategorySheet(false); setCategorySearchQuery(''); }}
        onSwipeComplete={() => { setShowCategorySheet(false); setCategorySearchQuery(''); }}
        swipeDirection="down"
        style={styles.modal}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => { setShowCategorySheet(false); setCategorySearchQuery(''); }}>
              <AntDesign name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchContainer}>
            <Feather name="search" size={18} color="#999" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search category..."
              placeholderTextColor="#999"
              value={categorySearchQuery}
              onChangeText={setCategorySearchQuery}
              autoCorrect={false}
            />
            {categorySearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                <AntDesign name="closecircle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: '100%' }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {categories
              .filter(cat => cat.title.toLowerCase().includes(categorySearchQuery.toLowerCase()))
              .map(cat => (
                <TouchableOpacity key={cat.id} onPress={() => {
                  setSelectedCategory(cat.id);
                  setShowCategorySheet(false);
                  setCategorySearchQuery('');
                }}>
                  <Text style={[
                    styles.bottomSheetItem,
                    selectedCategory === cat.id && { color: '#940304', fontWeight: '600' }
                  ]}>{cat.title}</Text>
                </TouchableOpacity>
              ))}
            {categories.filter(cat => cat.title.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
              <Text style={{ textAlign: 'center', color: '#999', paddingVertical: 20 }}>No categories found</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {
        businessData?.data?.isApproved && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/addListing')}>
            <AntDesign name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }
      {/* <TouchableOpacity style={styles.fab} onPress={() => router.push('/addListing')}>
        <AntDesign name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity> */}
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
    fontSize: 30,
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
    fontSize: 9,
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
    backgroundColor: '#940304',
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
    color: '#940304',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8, // Fixed: Should be half of width/height for perfect circle
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
    backgroundColor: '#940304',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%', // increased height for better scrolling
  },
  bottomSheetItem: {
    paddingVertical: 14,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
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