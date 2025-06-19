import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { GiftFilter } from '@/components/more/transactions/types';
import { mockGifts } from '@/components/more/transactions/Data';
import { useTheme } from '@/contexts/themeContext';
import GiftItem from '@/components/more/transactions/GiftItem';
import FilterButton from '@/components/more/transactions/FilterButton';
import SummaryCard from '@/components/more/transactions/SummaryCard';
import Header from '@/components/more/withdraw/Header';

export default function GiftsScreen() {
  const { dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<GiftFilter>('all');

  const filteredGifts = useMemo(() => {
    if (activeFilter === 'all') return mockGifts;
    return mockGifts.filter(gift => {
      if (activeFilter === 'received') return gift.type === 'received';
      if (activeFilter === 'sent') return gift.type === 'sent';
      return true;
    });
  }, [activeFilter]);

  const totals = useMemo(() => {
    const received = mockGifts
      .filter(g => g.type === 'received')
      .reduce((sum, g) => sum + g.amount, 0);

    const sent = mockGifts
      .filter(g => g.type === 'sent')
      .reduce((sum, g) => sum + g.amount, 0);

    return { received, sent };
  }, []);

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
        lastUpdated="Last updated 20 sec ago"
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

      <FlatList
        data={filteredGifts}
        renderItem={({ item }) => <GiftItem gift={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
});