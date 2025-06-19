import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ad } from '@/components/more/ads/ads';
import { useTheme } from '@/contexts/themeContext';
import { adsData } from '@/components/more/ads/adsData';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';


interface AdDetailsScreenProps {
  navigation: {
    goBack: () => void;
  };
}
 const AdDetailsScreen: React.FC<AdDetailsScreenProps> = ({
  navigation,
}) => {
  const route = useRoute();
  const GoBack = () => useRouter().back();
  const { id } = route.params;
  const ad = adsData.find((item) => item.id === id);
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
        return dark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.1)';
      case 'running':
        return dark ? 'rgba(76, 217, 100, 0.1)' : 'rgba(76, 217, 100, 0.1)';
      case 'closed':
        return dark ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.1)';
      default:
        return colors.surface;
    }
  };

  const metrics = [
    { label: 'Reach', value: ad?.reach?.toLocaleString() || '0' },
    { label: 'Impressions', value: ad?.impressions?.toLocaleString() || '0' },
    { label: 'Cost Per click', value: ad?.costPerClick || 'N0' },
    { label: 'Amount spent', value: ad?.amountSpent || 'N0' },
    { label: 'Date created', value: ad?.dateCreated || 'N/A' },
    { label: 'End Date', value: ad?.endDate || 'N/A' },
  ];

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
          <Image source={{ uri: ad?.image }} style={styles.image} />
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
            <View>
              <Text style={[styles.adTitle, { color: colors.text }]}>
                {ad?.title}
              </Text>
              <Text style={[styles.adPrice, { color: colors.primary }]}>
                {ad?.price}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.viewListingButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.viewListingText}>View Listing</Text>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
            {/* <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Edit
            </Text> */}
          </TouchableOpacity>

          {ad?.status !== 'closed' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
            >
              <Ionicons name="pause-outline" size={18} color={colors.text} />
              {/* <Text style={[styles.actionButtonText, { color: colors.text }]}>
                {ad?.status === 'running' ? 'Pause' : 'Resume'}
              </Text> */}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
            {/* <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Delete
            </Text> */}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryButton, { backgroundColor: colors.primary }]}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  adPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewListingButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
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