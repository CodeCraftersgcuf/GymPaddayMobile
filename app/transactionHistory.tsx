import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { TransactionFilter } from '@/components/more/transactions/types';
import { mockTransactions } from '@/components/more/transactions/Data';
import { useTheme } from '@/contexts/themeContext';
import TransactionItem from '@/components/more/transactions/TransactionItem';
import FilterButton from '@/components/more/transactions/FilterButton';
import SummaryCard from '@/components/more/transactions/SummaryCard';
import Header from '@/components/more/withdraw/Header';

export default function TransactionsScreen() {
    const { dark } = useTheme();
    const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');

    const filteredTransactions = useMemo(() => {
        if (activeFilter === 'all') return mockTransactions;
        return mockTransactions.filter(transaction => {
            if (activeFilter === 'deposits') return transaction.type === 'deposit';
            if (activeFilter === 'withdrawals') return transaction.type === 'withdrawal';
            return true;
        });
    }, [activeFilter]);

    const totals = useMemo(() => {
        const deposits = mockTransactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0);

        const withdrawals = mockTransactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);

        return { deposits, withdrawals };
    }, []);

    return (
        <SafeAreaView style={[
            styles.container,
            dark ? styles.containerDark : styles.containerLight
        ]}>
            <Header
                title={'Transactions'}
                showBackButton={true}
                onBackPress={()=>{}}
            />
            <SummaryCard
                leftLabel="Total Deposits"
                leftAmount={`N${totals.deposits.toLocaleString()}`}
                rightLabel="Total Withdrawals"
                rightAmount={`N${totals.withdrawals.toLocaleString()}`}
                lastUpdated="Last updated 20 sec ago"
            />

            <View style={[styles.filterContainer, { backgroundColor: dark ? '#181818' : '#F3F4F6' }]}>
                <FilterButton
                    title="All"
                    isActive={activeFilter === 'all'}
                    onPress={() => setActiveFilter('all')}
                />
                <FilterButton
                    title="Deposits"
                    isActive={activeFilter === 'deposits'}
                    onPress={() => setActiveFilter('deposits')}
                />
                <FilterButton
                    title="Withdrawals"
                    isActive={activeFilter === 'withdrawals'}
                    onPress={() => setActiveFilter('withdrawals')}
                />
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={({ item }) => <TransactionItem transaction={item} />}
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
        paddingBottom: 20,
        // paddingTop: 30
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