import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { useRoute } from '@react-navigation/native';
import { router, useRouter } from 'expo-router';

// Integration
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { getAdCampaignById } from '@/utils/queries/adCampaigns';
import { useAdCampaignActions } from '@/hooks/useAdCampaignActions';

// Helper: format date
function formatDate(d: string | null | undefined) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString();
}

const AdDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const { id } = route.params || {};
  const GoBack = () => useRouter().back();
  const { handleEdit, handleToggleStatus, handleDelete } = useAdCampaignActions([ad]);

  const { dark } = useTheme();
  const colors = {
    background: dark ? 'black' : '#fff',
    surface: dark ? '#232323' : '#f8f9fa',
    border: dark ? '#232323' : '#e0e0e0',
    text: dark ? '#fff' : '#181818',
    textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
    primary: '#FF3B30',
    success: '#4CD964',
  };

  // Fetch ad campaign
  const { data, isLoading, error } = useQuery({
    queryKey: ['ad-campaign', id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getAdCampaignById(Number(id), token);
    },
    enabled: !!id,
  });

  // Unwrap campaign object
  const ad = data?.campaign;

  // Use image from post.media[0].url or listing.media[0].url if exists, fallback to placeholder
  let imageUrl = 'https://placehold.co/600x400?text=No+Image';

  if (ad?.type === 'boost_post' && Array.isArray(ad?.post?.media) && ad.post.media.length > 0 && ad.post.media[0].url) {
    imageUrl = ad.post.media[0].url;
  } else if (ad?.type === 'boost_listing' && Array.isArray(ad?.listing?.media) && ad.listing.media.length > 0 && ad.listing.media[0].url) {
    const url = ad.listing.media[0].url;
    imageUrl = url.startsWith('http')
      ? url
      : `https://gympaddy.hmstech.xyz/storage/${url}`;
  }


  // Metrics, fallback to dummy if not available
  const metrics = [
    { label: 'Reach', value: ad?.reach?.toLocaleString?.() || '0' },
    { label: 'Impressions', value: ad?.impressions?.toLocaleString?.() || '0' },
    { label: 'Cost Per click', value: ad?.costPerClick ?? 'N0' },
    { label: 'Amount spent', value: ad?.amountSpent ?? 'N0' },
    { label: 'Date created', value: formatDate(ad?.created_at) },
    { label: 'End Date', value: formatDate(ad?.end_date) },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'running':
        return colors.success;
      case 'closed':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'rgba(255, 149, 0, 0.1)';
      case 'running':
        return 'rgba(76, 217, 100, 0.1)';
      case 'closed':
        return 'rgba(255, 59, 48, 0.1)';
      default:
        return colors.surface;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Loading ad details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !ad) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red' }}>Failed to load ad details.</Text>
        <TouchableOpacity onPress={GoBack} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => GoBack()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Ads Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>

        {/* Ad Info Card */}
        <View
          style={[
            styles.adInfoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }
          ]}
        >
          <View style={styles.adInfoContent}>
            <Text style={[styles.adTitle, { color: colors.text }]}>
              {ad?.title}
            </Text>
            <View style={styles.priceAndButtonRow}>
              <Text style={[styles.adPrice, { color: colors.primary }]}>
                {ad?.budget ? `₦${ad.budget}` : ''}
              </Text>
              <TouchableOpacity
                style={[styles.viewListingButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  let mediaArray: Array<{ uri: string; type: 'image' | 'video'; media_type: string }> = [];

                  if (Array.isArray(ad?.post?.media) && ad.post.media.length > 0) {
                    mediaArray = ad.post.media.map(m => ({
                      uri: m.url && typeof m.url === "string" ? m.url : imageUrl,
                      type: m.media_type === "video" ? "video" : "image",
                      media_type: m.media_type || 'image',
                    }));
                  } else {
                    // Fallback to the same image you show in the details card (imageUrl)
                    mediaArray = [{
                      uri: imageUrl,
                      type: "image",
                      media_type: "image",
                    }];
                  }

                  if (ad?.type === "boost_post") {
                    router.push({
                      pathname: "/MediaViewer",
                      params: {
                        id: ad?.post?.id,
                        mediaArray: JSON.stringify(mediaArray),
                        type: mediaArray[0]?.media_type === "video" ? "videos" : "posts",
                        index: 0,
                      }
                    });
                  } else if (ad?.type === "boost_listing") {
                    router.push({
                      pathname: "/marketView",
                      params: { id: ad?.listing?.id }
                    });
                  } else {
                    // Fallback to campaign id, but normally this should not run
                    router.push({
                      pathname: "/marketView",
                      params: { id: ad?.id }
                    });
                  }

                }}
              >
                <Text style={styles.viewListingText}>
                  {ad?.type === "boost_post" ? "View Post" : "View Listing"}
                </Text>
              </TouchableOpacity>


            </View>
          </View>

        </View>

        {/* Metrics */}
        <View
          style={[
            styles.metricsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }
          ]}
        >
          {metrics.map((metric, index) => (
            <View
              key={metric.label}
              style={[
                styles.metricRow,
                index < metrics.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                }
              ]}
            >
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {metric.label}
              </Text>
              <Text style={[styles.metricValue, { color: colors.textSecondary }]}>
                {metric.value}
              </Text>
            </View>
          ))}

          <View style={[styles.metricRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              Status
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(ad?.status) }
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(ad?.status) }
                ]}
              >
                {ad?.status === 'running' ? 'Active' : ad?.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Edit Button */}
          {/* <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => handleEdit({
              ...ad,
              id: String(ad.id),
              type: ad.type === "boost_post" ? "social" : "marketplace", // match Ad type in hook
            })}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </TouchableOpacity> */}

          {/* Pause/Resume Button */}
          {ad?.status !== 'closed' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => handleToggleStatus({
                ...ad,
                id: String(ad.id),
                status: ad.status,
              })}
            >
              <Ionicons
                name={ad?.status === 'running' || ad?.status === 'active' ? "pause-outline" : "play-outline"}
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => handleDelete({
              ...ad,
              id: String(ad.id),
            })}
          >
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Summary Button (unchanged, wire up if you want action) */}
          <TouchableOpacity
            style={[styles.summaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              let mediaArray: Array<{ uri: string; type: 'image' | 'video'; media_type: string }> = [];

              if (Array.isArray(ad?.post?.media) && ad.post.media.length > 0) {
                mediaArray = ad.post.media.map(m => ({
                  uri: m.url && typeof m.url === "string" ? m.url : imageUrl,
                  type: m.media_type === "video" ? "video" : "image",
                  media_type: m.media_type || 'image',
                }));
              } else {
                // Fallback to the same image you show in the details card (imageUrl)
                mediaArray = [{
                  uri: imageUrl,
                  type: "image",
                  media_type: "image",
                }];
              }

              if (ad?.type === "boost_post") {
                router.push({
                  pathname: "/MediaViewer",
                  params: {
                    id: ad?.post?.id,
                    mediaArray: JSON.stringify(mediaArray),
                    type: mediaArray[0]?.media_type === "video" ? "videos" : "posts",
                    index: 0,
                  }
                });
              } else if (ad?.type === "boost_listing") {
                router.push({
                  pathname: "/marketView",
                  params: { id: ad?.listing?.id }
                });
              } else {
                // Fallback to campaign id, but normally this should not run
                router.push({
                  pathname: "/marketView",
                  params: { id: ad?.id }
                });
              }
            }}
          >
            <Text style={styles.summaryButtonText}>Summary</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};
export default AdDetailsScreen;

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adInfoCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  adInfoContent: {
    width: '100%',
    padding: 8,
  },

  adTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  priceAndButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  adPrice: {
    fontSize: 20,
    fontWeight: '700',
  },

  viewListingButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16, // Add some space between price and button
  },

  viewListingText: {
    color: '#fff',
    fontWeight: '600',
  },

  metricsCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});