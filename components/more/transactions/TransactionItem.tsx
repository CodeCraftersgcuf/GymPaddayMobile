import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from './types';
import { useTheme } from '@/contexts/themeContext';

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { dark } = useTheme();
  const isDeposit = transaction.type === 'deposit';

  const formatAmount = (amount: number, isDeposit: boolean) => {
    const prefix = isDeposit ? '+' : '-';
    return `${prefix}${amount.toLocaleString()}`;
  };

  return (
    <View style={[
      styles.container,
      dark ? styles.containerDark : styles.containerLight,
      {
        borderLeftColor: isDeposit ? '#22C55E' : '#EF4444',
      }
    ]}>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          dark ? styles.titleDark : styles.titleLight
        ]}>
          {isDeposit ? 'Deposit' : 'Withdrawal'}
        </Text>
        <Text style={[
          styles.date,
          dark ? styles.dateDark : styles.dateLight
        ]}>
          {transaction.date} - {transaction.timestamp}
        </Text>
      </View>
      <Text style={[
        styles.amount,
        { color: isDeposit ? '#22C55E' : '#EF4444' }
      ]}>
        {formatAmount(transaction.amount, isDeposit)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#181818',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleLight: {
    color: '#111827',
  },
  titleDark: {
    color: '#F9FAFB',
  },
  date: {
    fontSize: 14,
  },
  dateLight: {
    color: '#6B7280',
  },
  dateDark: {
    color: '#9CA3AF',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});