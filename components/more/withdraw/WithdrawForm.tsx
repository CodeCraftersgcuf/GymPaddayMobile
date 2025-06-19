import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WithdrawData } from '@/app/withdraw';
import { useTheme } from '@/contexts/themeContext';

interface WithdrawFormProps {
  onSubmit: (data: WithdrawData) => void;
  initialData: WithdrawData;
}

export default function WithdrawForm({ onSubmit, initialData }: WithdrawFormProps) {
  const [formData, setFormData] = useState<WithdrawData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const {dark} = useTheme();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 10) {
      newErrors.accountNumber = 'Account number must be at least 10 digits';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof WithdrawData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const exchangeRate = 500; // N500 per 1GP
  const calculatedGP = formData.amount ? (Number(formData.amount) / exchangeRate).toFixed(2) : '0';

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError,{backgroundColor:dark ?'#181818' :'white',color:dark? 'white' :'black',borderColor:dark?'black':'white'}]}
            placeholder="Amount"
            placeholderTextColor="#999"
            value={formData.amount}
            onChangeText={(text) => updateField('amount', text)}
            keyboardType="numeric"
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.bankName && styles.inputError,{backgroundColor:dark ?'#181818' :'white',color:dark? 'white' :'black',borderColor:dark?'black':'white'}]}
            placeholder="Bank Name"
            placeholderTextColor="#999"
            value={formData.bankName}
            onChangeText={(text) => updateField('bankName', text)}
          />
          {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.accountNumber && styles.inputError,{backgroundColor:dark ?'#181818' :'white',color:dark? 'white' :'black',borderColor:dark?'black':'white'}]}
            placeholder="Account number"
            placeholderTextColor="#999"
            value={formData.accountNumber}
            onChangeText={(text) => updateField('accountNumber', text)}
            keyboardType="numeric"
          />
          {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.accountName && styles.inputError,{backgroundColor:dark ?'#181818' :'white',color:dark? 'white' :'black',borderColor:dark?'black':'white'}]}
            placeholder="Account Name"
            placeholderTextColor="#999"
            value={formData.accountName}
            onChangeText={(text) => updateField('accountName', text)}
          />
          {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => updateField('saveDetails', !formData.saveDetails)}
        >
          <View style={[styles.checkbox, formData.saveDetails && styles.checkboxChecked]}>
            {formData.saveDetails && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Save account details</Text>
        </TouchableOpacity>

        <View style={styles.exchangeRateContainer}>
          <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
          <Text style={styles.exchangeRateValue}>
            N{formData.amount || '0'} / {calculatedGP}GP
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.proceedButton} onPress={handleSubmit}>
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
  form: {
    flex: 1,
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
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF0000',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF0000',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '500',
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