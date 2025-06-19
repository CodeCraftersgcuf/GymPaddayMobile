import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusTabs } from '@/components/more/ads/StatusTabs';
import { FilterDropdown } from '@/components/more/ads/FilterDropdown';
import { AdCard } from '@/components/more/ads//AdCard';
import { adsData } from '@/components/more/ads/adsData';
import { Ad, AdStatus, AdType } from '@/components/more/ads/ads';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';

interface AdsListScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const AdsListScreen: React.FC<AdsListScreenProps> = ({ navigation }) => {
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
  const [ads, setAds] = useState<Ad[]>(adsData);
  const route = useRouter();

  const filteredAds = ads.filter(ad => {
    const statusMatch = activeStatus === 'all' || ad.status === activeStatus;
    const typeMatch = selectedType === 'all' || 
      (selectedType === 'social' && ad.type === 'social') ||
      (selectedType === 'marketplace' && ad.type === 'marketplace');
    
    return statusMatch && typeMatch;
  });

  const handleEdit = (ad: Ad) => {
    console.log('Edit ad:', ad.id);
  };

  const handleToggleStatus = (ad: Ad) => {
    setAds(prevAds => 
      prevAds.map(prevAd => 
        prevAd.id === ad.id 
          ? { ...prevAd, status: prevAd.status === 'running' ? 'pending' : 'running' }
          : prevAd
      )
    );
  };

  const handleDelete = (ad: Ad) => {
    setAds(prevAds => prevAds.filter(prevAd => prevAd.id !== ad.id));
  };

  const handleViewDetails = (ad: Ad) => {
    // navigation.navigate('AdDetails', { ad });
     route.push({
        pathname: '/adsDetail',
        params: { id: ad.id},
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={()=>route.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ads Profile
          </Text>
        </View>
        
        {/* <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name={dark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity> */}
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
        />
      </View>
    </SafeAreaView>
  );
};
export default AdsListScreen;

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