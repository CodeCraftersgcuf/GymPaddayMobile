import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { TransactionFilter } from '@/components/more/transactions/types';
import { useTheme } from '@/contexts/themeContext';
import TransactionItem from '@/components/more/transactions/TransactionItem';
import FilterButton from '@/components/more/transactions/FilterButton';
import SummaryCard from '@/components/more/transactions/SummaryCard';
import Header from '@/components/more/withdraw/Header';

import { useQuery } from '@tanstack/react-query';
import { getUserTransaction } from '@/utils/queries/transactions';
import * as SecureStore from 'expo-secure-store';

export default function TransactionsScreen() {
  const { dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['userTransactions'],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      return await getUserTransaction(token);
    },
    enabled: !!token,
  });

  // Convert API response to local transaction format
  const allTransactions = useMemo(() => {
    if (!Array.isArray(apiData)) return [];

    return apiData.map((item: any) => ({
      id: item.id.toString(), // Ensure unique string keys
      type: item.type === 'topup' ? 'deposit' : 'withdrawal',
      amount: parseFloat(item.amount),
      date: new Date(item.created_at).toLocaleDateString('en-GB'),
      timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [apiData]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return allTransactions;
    return allTransactions.filter((t) =>
      activeFilter === 'deposits' ? t.type === 'deposit' : t.type === 'withdrawal'
    );
  }, [activeFilter, allTransactions]);

  const totals = useMemo(() => {
    const deposits = allTransactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = allTransactions
      .filter((t) => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    return { deposits, withdrawals };
  }, [allTransactions]);

  return (
    <SafeAreaView style={[styles.container, dark ? styles.containerDark : styles.containerLight]}>
      <Header title="Transactions" showBackButton={true} onBackPress={() => { }} />

      <SummaryCard
        leftLabel="Total Deposits"
        leftAmount={`N${totals.deposits.toLocaleString()}`}
        rightLabel="Total Withdrawals"
        rightAmount={`N${totals.withdrawals.toLocaleString()}`}
        lastUpdated="Last updated just now"
      />

      <View style={[styles.filterContainer, { backgroundColor: dark ? '#181818' : '#F3F4F6' }]}>
        <FilterButton title="All" isActive={activeFilter === 'all'} onPress={() => setActiveFilter('all')} />
        <FilterButton title="Deposits" isActive={activeFilter === 'deposits'} onPress={() => setActiveFilter('deposits')} />
        <FilterButton title="Withdrawals" isActive={activeFilter === 'withdrawals'} onPress={() => setActiveFilter('withdrawals')} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10, color: dark ? 'white' : 'black' }}>Loading transactions...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 16, color: dark ? 'white' : 'black' }}>No transactions found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          keyExtractor={(item) => item.id}
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
    paddingBottom: 20,
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
