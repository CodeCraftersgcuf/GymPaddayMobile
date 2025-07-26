import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusTabs } from '@/components/more/ads/StatusTabs';
import { FilterDropdown } from '@/components/more/ads/FilterDropdown';
import { AdCard } from '@/components/more/ads/AdCard';
import { Ad, AdStatus, AdType } from '@/components/more/ads/ads';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { getAdCampaigns } from '@/utils/queries/adCampaigns';
import { useMutation } from '@tanstack/react-query';
import { toggleCampaignStatus } from '@/utils/mutations/toggle';
import { useQueryClient } from '@tanstack/react-query';
import { deleteAdCompaign } from '@/utils/mutations/boost';


interface AdsListScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export const AdsListScreen: React.FC<AdsListScreenProps> = ({ navigation }) => {
  const { dark } = useTheme();
  const colors = {
    background: dark ? '#181818' : '#fff',
    surface: dark ? '#232323' : '#f8f9fa',
    border: dark ? '#232323' : '#e0e0e0',
    text: dark ? '#fff' : '#181818',
    textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
    primary: '#FF3B30',
    success: '#4CD964',
  };
  const [activeStatus, setActiveStatus] = useState<AdStatus>('all');
  const [selectedType, setSelectedType] = useState<AdType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const route = useRouter();
  const queryClient = useQueryClient();

  // Fetch Ads from API
  const { data: adsApiData, isLoading, error } = useQuery({
    queryKey: ['ad-campaigns'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getAdCampaigns(token);
    },
  });
  function getRelativeTime(dateString: string): string {
    if (!dateString) return '--';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds} sec ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

    // For anything older, just show the date
    return past.toLocaleDateString();
  }

  // console.log("The data from API:", adsApiData);
  // Map API data to Ad[]
  const ads: Ad[] = Array.isArray(adsApiData)
    ? adsApiData.map((item) => {
      let status = item.status ?? '';
      // Map backend "active" to frontend "running"
      if (status === 'active') status = 'running';

      let imageUrl = '';
      if (item.type === 'boost_post' && Array.isArray(item.post?.media) && item.post.media.length > 0) {
        imageUrl = item.post.media[0].url; // Already a full URL
      } else if (item.type === 'boost_listing' && Array.isArray(item.listing?.media) && item.listing.media.length > 0) {
        const url = item.listing.media[0].url;
        imageUrl = url.startsWith('http')
          ? url
          : `https://gympaddy.hmstech.xyz/storage/${url}`;
      }

      return {
        id: String(item.id),
        title: item.title ?? '',
        price: item.budget ?? '',
        image: imageUrl,
        status, // <-- Use the mapped status here
        type: item.type === 'boost_post' ? 'social' : 'marketplace',
        timestamp: item.created_at ? getRelativeTime(item.created_at) : '--',

        reach: item.reach ?? 0,
        impressions: item.impressions ?? 0,
        costPerClick: item.costPerClick ?? '',
        amountSpent: item.amountSpent ?? '',
        dateCreated: item.created_at ? new Date(item.created_at).toLocaleString() : '--',
        endDate: item.endDate ? new Date(item.endDate).toLocaleString() : '--',
      };
    })
    : [];


  // Filter Ads
  const filteredAds = ads.filter(ad => {
    const statusMatch = activeStatus === 'all' || ad.status === activeStatus;
    const typeMatch =
      selectedType === 'all' ||
      (selectedType === 'social' && ad.type === 'social') ||
      (selectedType === 'marketplace' && ad.type === 'marketplace');
    return statusMatch && typeMatch;
  });

  const handleEdit = (ad: Ad) => {
    const isEditable = true;
    const boostType = ad.type === "marketplace" ? "listing" : "post";

    // Find the original API response object for more backend fields
    const originalItem =
      Array.isArray(adsApiData) &&
      adsApiData.find((item) => String(item.id) === ad.id);

    if (!originalItem) {
      alert("Ad not found in the source data.");
      return;
    }
    // console.log("Editing ad:", ad.id, "Original item:", originalItem);

    // Use a single editor screen for both types
    route.push({
      pathname: "/BoostPostScreen_audience",
      params: {
        isEditable,
        boostType,
        campaignId: ad.id,
        campaign: JSON.stringify(originalItem), // <-- Always send as string!
        listing: originalItem.listing ? JSON.stringify(originalItem.listing) : null,
        post: originalItem.post ? JSON.stringify(originalItem.post) : null,
      },
    });
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      token
    }: {
      id: number;
      action: 'pause' | 'resume';
      token: string;
    }) => {
      return await toggleCampaignStatus({ id, action, token });
    },
    onSuccess: (data) => {
      // console.log("Toggle status response:", data);
      // Optionally show a toast/snackbar here
      // Refetch the ad campaigns to update UI
      queryClient.invalidateQueries(['ad-campaigns']);
    },
    onError: (error: any) => {
      // Optionally show a toast/snackbar here
      alert(error?.message || 'Failed to toggle status');
    }
  });

  const handleToggleStatus = async (ad: Ad) => {
    try {
      // 1. Get auth token
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        alert("No auth token found");
        return;
      }

      // 2. Decide what action to send based on current status
      // You can add more logic if you want for paused/resumed states
      let action: 'pause' | 'resume' = 'pause';
      if (ad.status === 'pending' || ad.status === 'running' || ad.status === 'active') {
        action = 'pause'; // Will pause
      } else if (ad.status === 'paused' || ad.status === 'closed') {
        action = 'resume'; // Will resume (if your backend supports it)
      }

      // 3. Trigger the mutation
      toggleStatusMutation.mutate({ id: Number(ad.id), action, token });
    } catch (e) {
      alert('Unexpected error: ' + e?.toString());
    }
  };

  // Add mutation for deleting ad campaign
  const { mutate: deleteAd, isLoading: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return await deleteAdCompaign({ id, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ad-campaigns']);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete ad campaign.');
      console.error('Delete ad campaign error:', error);
    }
  });

  const handleDelete = (ad: Ad) => {
    Alert.alert(
      'Delete Ad Campaign',
      'Are you sure you want to delete this ad campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAd(Number(ad.id))
        }
      ]
    );
  };

  const handleViewDetails = (ad: Ad) => {
    // console.log('View details for ad:', ad.id);
    route.push({

      pathname: '/adsDetail',
      params: { id: ad.id },
    });
  };

  const renderAd = ({ item }: { item: Ad }) => (
    <AdCard
      ad={item}
      onEdit={handleEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDelete}
      onViewDetails={handleViewDetails}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        No ads found for the selected filters
      </Text>
    </View>
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries(['ad-campaigns']);
    setRefreshing(false);
  };

  // Loading and Error states
  if (isLoading) {
    return (
      <SafeAreaView style={[
        styles.container,
        {
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 16 }}>Loading ads...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[
        styles.container,
        {
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
        <Text style={{ color: 'red' }}>Failed to load ads.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => route.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ads Profile
          </Text>
        </View>
      </View>

      {/* Status Tabs */}
      <StatusTabs
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
      />

      {/* Filter and Content */}
      <View style={styles.content}>
        {/* Filter Dropdown */}
        <View style={styles.filterContainer}>
          <FilterDropdown
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
        </View>

        {/* Ads List */}
        <FlatList
          data={filteredAds}
          renderItem={renderAd}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Pull to refresh"
              titleColor={colors.text}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterContainer: {
    alignItems: 'flex-end',
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    gap: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default AdsListScreen;
