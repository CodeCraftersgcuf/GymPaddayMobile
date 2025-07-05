import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { GiftFilter } from '@/components/more/transactions/types';
import { useTheme } from '@/contexts/themeContext';
import GiftItem from '@/components/more/transactions/GiftItem';
import FilterButton from '@/components/more/transactions/FilterButton';
import SummaryCard from '@/components/more/transactions/SummaryCard';
import Header from '@/components/more/withdraw/Header';

import { useQuery } from '@tanstack/react-query';
import { getUserGifts } from '@/utils/queries/gitfs';
import * as SecureStore from 'expo-secure-store';

export default function GiftsScreen() {
  const { dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<GiftFilter>('all');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  const { data: giftData = [], isLoading } = useQuery({
    queryKey: ['user-gifts'],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      return await getUserGifts(token);
    },
    enabled: !!token,
  });

  const filteredGifts = useMemo(() => {
    if (activeFilter === 'all') return giftData;
    return giftData.filter(gift => gift.type === activeFilter);
  }, [activeFilter, giftData]);

  const totals = useMemo(() => {
    const received = giftData
      .filter(g => g.type === 'received')
      .reduce((sum, g) => sum + parseFloat(g.amount), 0);

    const sent = giftData
      .filter(g => g.type === 'sent')
      .reduce((sum, g) => sum + parseFloat(g.amount), 0);

    return { received, sent };
  }, [giftData]);

  return (
    <SafeAreaView style={[
      styles.container,
      dark ? styles.containerDark : styles.containerLight
    ]}>
      <Header
        title={'Transactions'}
        showBackButton={true}
        onBackPress={() => { }}
      />
      <SummaryCard
        leftLabel="Total Received"
        leftAmount={`N${totals.received.toLocaleString()}`}
        rightLabel="Total Sent"
        rightAmount={`N${totals.sent.toLocaleString()}`}
        lastUpdated="Last updated just now"
      />

      <View style={[styles.filterContainer, { backgroundColor: dark ? '#181818' : '#F3F4F6' }]}>
        <FilterButton
          title="All"
          isActive={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
        />
        <FilterButton
          title="Received"
          isActive={activeFilter === 'received'}
          onPress={() => setActiveFilter('received')}
        />
        <FilterButton
          title="Sent"
          isActive={activeFilter === 'sent'}
          onPress={() => setActiveFilter('sent')}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, color: dark ? 'white' : 'black' }}>Loading gifts...</Text>
        </View>
      ) : filteredGifts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 16, color: dark ? 'white' : 'black' }}>No gifts found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGifts}
          renderItem={({ item }) => <GiftItem gift={item} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: 'black',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
