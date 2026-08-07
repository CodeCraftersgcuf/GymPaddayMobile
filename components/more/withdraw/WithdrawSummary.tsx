import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { GP_RATE, WithdrawData } from '@/app/withdraw';
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

interface WithdrawSummaryProps {
  data: WithdrawData;
  onProceed: () => void;
  isLoading?: boolean;
}

export default function WithdrawSummary({ data, onProceed, isLoading = false }: WithdrawSummaryProps) {
    const {dark} = useTheme();
  const amount = Number(data.amount);
  const gpDeducted = amount / GP_RATE;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.totalAmount}>-{gpDeducted.toFixed(2)}GP</Text>
        
        <ThemedView style={[styles.detailsContainer,{borderColor: dark ? '#3A3A3A' : '#D9D9D9',overflow:'hidden'}]}>
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Bank Name</ThemeText>
            <Text style={styles.detailValue}>{data.bankName}</Text>
          </ThemedView>
          
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Account Name</ThemeText>
            <Text style={styles.detailValue}>{data.accountName}</Text>
          </ThemedView>
          
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Account No</ThemeText>
            <Text style={styles.detailValue}>{data.accountNumber}</Text>
          </ThemedView>
          
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Payout</ThemeText>
            <Text style={styles.detailValue}>N{amount.toLocaleString()}</Text>
          </ThemedView>
          
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Wallet Deduction</ThemeText>
            <Text style={styles.detailValue}>{gpDeducted.toFixed(2)}GP</Text>
          </ThemedView>
        </ThemedView>

        <Text style={styles.noticeText}>
          Your GP is reserved as soon as you submit. Flutterwave sends the NGN payout
          automatically, and you will be notified when the bank transfer completes.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.proceedButton, isLoading && styles.proceedButtonDisabled]}
        onPress={onProceed}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.proceedButtonText}>Submit Request</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#C61F3A',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    // borderColor: '#e5e5e5',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    // color: '#1a1a1a',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: '#C61F3A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonDisabled: {
    opacity: 0.6,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});