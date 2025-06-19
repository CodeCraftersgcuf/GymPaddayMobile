import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WithdrawData } from '@/app/withdraw';
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

interface WithdrawSummaryProps {
  data: WithdrawData;
  onProceed: () => void;
}

export default function WithdrawSummary({ data, onProceed }: WithdrawSummaryProps) {
    const {dark} = useTheme();
  const amount = Number(data.amount);
  const commission = 30; // N30 commission
  const totalDeduction = amount + commission;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.totalAmount}>-{totalDeduction.toLocaleString()}</Text>
        
        <ThemedView style={[styles.detailsContainer,{borderColor: dark ? '#000' : '#fff',overflow:'hidden'}]}>
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
            <ThemeText style={styles.detailLabel}>Amount</ThemeText>
            <Text style={styles.detailValue}>N{amount.toLocaleString()}</Text>
          </ThemedView>
          
          <ThemedView style={[styles.detailRow,{borderBottomColor:dark ? '#202020': '#f0f0f0' }]}>
            <ThemeText style={styles.detailLabel}>Commission</ThemeText>
            <Text style={styles.detailValue}>N{commission}</Text>
          </ThemedView>
        </ThemedView>
      </View>

      <TouchableOpacity style={styles.proceedButton} onPress={onProceed}>
        <Text style={styles.proceedButtonText}>Proceed</Text>
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
    color: '#FF0000',
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
  proceedButton: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});