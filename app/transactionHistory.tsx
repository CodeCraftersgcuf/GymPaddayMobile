import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { TransactionFilter, type Transaction } from '@/components/more/transactions/types';
import { useTheme } from '@/contexts/themeContext';
import TransactionItem from '@/components/more/transactions/TransactionItem';
import FilterButton from '@/components/more/transactions/FilterButton';
import SummaryCard from '@/components/more/transactions/SummaryCard';
import Header from '@/components/more/withdraw/Header';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserTransaction } from '@/utils/queries/transactions';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

/** Laravel may return a bare array or a wrapped payload depending on middleware/version. */
function normalizeTransactionsResponse(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.transactions)) return o.transactions;
  }
  return [];
}

export default function TransactionsScreen() {
  const { dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userTransactions', token ?? ''],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      const raw = await getUserTransaction(token);
      return normalizeTransactionsResponse(raw);
    },
    enabled: !!token,
  });

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
      }
    }, [token, queryClient])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const allTransactions = useMemo(() => {
    if (!Array.isArray(apiData)) return [];

    return apiData.map((item: any): Transaction => ({
      id: String(item.id ?? ''),
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

  const errMessage =
    isError && error instanceof Error ? error.message : 'Could not load transactions. Pull to retry.';

  return (
    <SafeAreaView style={[styles.container, dark ? styles.containerDark : styles.containerLight]}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={dark ? 'white' : 'black'}
          />
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      >
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
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 16, color: dark ? 'white' : 'black', textAlign: 'center', paddingHorizontal: 24 }}>
            {errMessage}
          </Text>
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
    </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,

  },
  containerLight: {
    backgroundColor: '#FAFAFA',
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
