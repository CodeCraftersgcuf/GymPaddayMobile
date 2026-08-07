import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GP_RATE, MAX_WITHDRAWAL_NAIRA, MIN_WITHDRAWAL_NAIRA, WithdrawData } from '@/app/withdraw';
import { useTheme } from '@/contexts/themeContext';
import { WithdrawalBank } from '@/utils/queries/withdrawals';

interface WithdrawFormProps {
  onSubmit: (data: WithdrawData) => void;
  initialData: WithdrawData;
  balance: number;
  balanceLoading?: boolean;
  banks: WithdrawalBank[];
  banksLoading?: boolean;
  banksError?: string;
  onRetryBanks: () => void;
  isVerifying?: boolean;
  onVerifyAccount: (
    bankCode: string,
    accountNumber: string
  ) => Promise<{
    bank_code: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    verification_token: string;
  }>;
}

export default function WithdrawForm({
  onSubmit,
  initialData,
  balance,
  balanceLoading,
  banks,
  banksLoading,
  banksError,
  onRetryBanks,
  isVerifying,
  onVerifyAccount,
}: WithdrawFormProps) {
  const [formData, setFormData] = useState<WithdrawData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const {dark} = useTheme();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (Number(formData.amount) < MIN_WITHDRAWAL_NAIRA) {
      newErrors.amount = `Minimum withdrawal is N${MIN_WITHDRAWAL_NAIRA.toLocaleString()}`;
    } else if (Number(formData.amount) > MAX_WITHDRAWAL_NAIRA) {
      newErrors.amount = `Maximum withdrawal is N${MAX_WITHDRAWAL_NAIRA.toLocaleString()}`;
    } else if (Number(formData.amount) % 20 !== 0) {
      newErrors.amount = 'Amount must be in increments of N20';
    } else if (Number(formData.amount) / GP_RATE > balance) {
      newErrors.amount = `You only have ${balance.toFixed(2)}GP (N${(balance * GP_RATE).toLocaleString()})`;
    }

    if (!formData.bankCode) {
      newErrors.bankName = 'Select a bank';
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Enter a valid 10-digit account number';
    }

    if (!formData.verificationToken || !formData.accountName) {
      newErrors.accountName = 'Verify the bank account before continuing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof WithdrawData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'accountNumber' || field === 'bankCode') {
        next.accountName = '';
        next.verificationToken = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectBank = (bank: WithdrawalBank) => {
    setFormData(prev => ({
      ...prev,
      bankCode: bank.code,
      bankName: bank.name,
      accountName: '',
      verificationToken: '',
    }));
    setErrors(prev => ({ ...prev, bankName: '', accountName: '' }));
    setBankPickerOpen(false);
    setBankSearch('');
  };

  const verifyAccount = async () => {
    if (!formData.bankCode) {
      setErrors(prev => ({ ...prev, bankName: 'Select a bank' }));
      return;
    }
    if (!/^\d{10}$/.test(formData.accountNumber)) {
      setErrors(prev => ({ ...prev, accountNumber: 'Enter a valid 10-digit account number' }));
      return;
    }

    setErrors(prev => ({ ...prev, accountName: '' }));
    try {
      const verified = await onVerifyAccount(formData.bankCode, formData.accountNumber);
      setFormData(prev => ({
        ...prev,
        bankCode: verified.bank_code,
        bankName: verified.bank_name,
        accountNumber: verified.account_number,
        accountName: verified.account_name,
        verificationToken: verified.verification_token,
      }));
    } catch (error: any) {
      setFormData(prev => ({ ...prev, accountName: '', verificationToken: '' }));
      setErrors(prev => ({
        ...prev,
        accountName: error?.message || 'Could not verify this account',
      }));
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.trim().toLowerCase())
  );

  const calculatedGP = formData.amount ? (Number(formData.amount) / GP_RATE).toFixed(2) : '0';

  const inputTheme = {
    backgroundColor: dark ? '#181818' : '#FFFFFF',
    color: dark ? '#FFFFFF' : '#000000',
    borderColor: dark ? '#3A3A3A' : '#D9D9D9',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={[styles.balanceValue, { color: dark ? '#FFFFFF' : '#1a1a1a' }]}>
            {balanceLoading ? '—' : `${balance.toFixed(2)}GP (N${(balance * GP_RATE).toLocaleString()})`}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, inputTheme, errors.amount && styles.inputError]}
            placeholder="Amount (N)"
            placeholderTextColor="#999"
            value={formData.amount}
            onChangeText={(text) => updateField('amount', text.replace(/\D/g, ''))}
            keyboardType="numeric"
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.input, styles.bankInput, inputTheme, errors.bankName && styles.inputError]}
            onPress={() => setBankPickerOpen(true)}
            disabled={banksLoading}
          >
            <Text style={{ color: formData.bankName ? inputTheme.color : '#999', fontSize: 16 }}>
              {banksLoading ? 'Loading banks...' : formData.bankName || 'Select bank'}
            </Text>
            {banksLoading
              ? <ActivityIndicator size="small" color="#C61F3A" />
              : <Ionicons name="chevron-down" size={20} color="#999" />}
          </TouchableOpacity>
          {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
          {banksError && (
            <TouchableOpacity onPress={onRetryBanks}>
              <Text style={styles.errorText}>{banksError} Tap to retry.</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, inputTheme, errors.accountNumber && styles.inputError]}
            placeholder="Account number"
            placeholderTextColor="#999"
            value={formData.accountNumber}
            onChangeText={(text) => updateField('accountNumber', text.replace(/\D/g, '').slice(0, 10))}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton,
            (isVerifying || !formData.bankCode || formData.accountNumber.length !== 10) && styles.buttonDisabled,
          ]}
          onPress={verifyAccount}
          disabled={isVerifying || !formData.bankCode || formData.accountNumber.length !== 10}
        >
          {isVerifying ? (
            <ActivityIndicator color="#C61F3A" />
          ) : (
            <Text style={styles.verifyButtonText}>
              {formData.verificationToken ? 'Account Verified' : 'Verify Account'}
            </Text>
          )}
        </TouchableOpacity>
        {formData.accountName ? (
          <View style={styles.verifiedAccount}>
            <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            <View style={styles.verifiedAccountText}>
              <Text style={styles.verifiedLabel}>Verified account</Text>
              <Text style={styles.verifiedName}>{formData.accountName}</Text>
            </View>
          </View>
        ) : null}
        {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}

        <View style={styles.exchangeRateContainer}>
          <Text style={styles.exchangeRateLabel}>
            Exchange Rate (N{GP_RATE.toLocaleString()} = 1GP)
          </Text>
          <Text style={styles.exchangeRateValue}>
            N{Number(formData.amount || 0).toLocaleString()} / {calculatedGP}GP
          </Text>
        </View>

        <Text style={styles.noticeText}>
          Payouts are sent automatically through Flutterwave. Your GP is reserved while the bank
          transfer is processing and returned automatically if it fails.
        </Text>
      </ScrollView>

      <TouchableOpacity style={styles.proceedButton} onPress={handleSubmit}>
        <Text style={styles.proceedButtonText}>Proceed</Text>
      </TouchableOpacity>

      <Modal
        visible={bankPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBankPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bankSheet, { backgroundColor: dark ? '#181818' : '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: dark ? '#FFFFFF' : '#1a1a1a' }]}>
                Select bank
              </Text>
              <TouchableOpacity onPress={() => setBankPickerOpen(false)}>
                <Ionicons name="close" size={26} color={dark ? '#FFFFFF' : '#1a1a1a'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, inputTheme, styles.bankSearch]}
              placeholder="Search banks"
              placeholderTextColor="#999"
              value={bankSearch}
              onChangeText={setBankSearch}
              autoFocus
            />
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => `${item.id}-${item.code}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bankRow, { borderBottomColor: dark ? '#303030' : '#EEEEEE' }]}
                  onPress={() => selectBank(item)}
                >
                  <Text style={{ color: dark ? '#FFFFFF' : '#1a1a1a', fontSize: 16 }}>
                    {item.name}
                  </Text>
                  {formData.bankCode === item.code && (
                    <Ionicons name="checkmark" size={22} color="#C61F3A" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyBanks}>No banks found.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    color: '#1a1a1a',
  },
  bankInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: '#C61F3A',
  },
  errorText: {
    color: '#C61F3A',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  verifyButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#C61F3A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#C61F3A',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifiedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  verifiedAccountText: {
    marginLeft: 10,
    flex: 1,
  },
  verifiedLabel: {
    color: '#15803D',
    fontSize: 12,
  },
  verifiedName: {
    color: '#14532D',
    fontSize: 16,
    fontWeight: '600',
  },
  exchangeRateContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  exchangeRateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exchangeRateValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#888',
    marginTop: 12,
  },
  proceedButton: {
    backgroundColor: '#C61F3A',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bankSheet: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  bankSearch: {
    marginBottom: 12,
  },
  bankRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  emptyBanks: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 32,
  },
});