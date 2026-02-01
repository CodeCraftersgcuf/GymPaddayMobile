import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useIAP } from '@/utils/hooks/useIAP';

interface TopupPanelProps {
  dark: boolean;
  balance: number;
  onTopupSuccess: (amount: number) => void;
}

const TopupPanel: React.FC<TopupPanelProps> = ({ dark, balance, onTopupSuccess }) => {
  const [topupAmount, setTopupAmount] = useState<string>('');
  
  // Safely get IAP hook values with fallbacks
  const iapResult = useIAP();
  const purchaseProduct = iapResult?.purchaseProduct;
  const isIAPLoading = iapResult?.isLoading ?? false;
  const MINIMUM_AMOUNT_IOS = iapResult?.MINIMUM_AMOUNT_IOS ?? 100;
  const isAvailable = iapResult?.isAvailable ?? false;

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    panelBackground: dark ? '#181818' : '#ffe5e5',
  };

  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(topupAmount);

    // For iOS, use Apple In-App Purchase
    if (Platform.OS === 'ios') {
      if (amount < MINIMUM_AMOUNT_IOS) {
        Alert.alert('Error', `Minimum deposit amount is ${MINIMUM_AMOUNT_IOS} Naira`);
        return;
      }

      if (!isAvailable || !purchaseProduct) {
        Alert.alert('Error', 'In-App Purchases are not available. Please try again later.');
        return;
      }

      try {
        const success = await purchaseProduct(amount);
        if (success) {
          // The IAP hook will call the topup API, but we still need to update the UI
          onTopupSuccess(amount);
          setTopupAmount('');
        }
      } catch (error) {
        console.error('Purchase error:', error);
        Alert.alert('Error', 'Failed to process purchase. Please try again.');
      }
    } else {
      // For Android or other platforms, use the existing flow
      Alert.alert('Success', `Topup of ${amount} GP Coins successful!`);
      onTopupSuccess(amount);
      setTopupAmount('');
    }
  };

  return (
    <View style={[styles.topupPanel, { backgroundColor: themeStyles.panelBackground }]}>
      <View style={styles.topupHeader}>
        <Text style={[styles.giftsTitle, { color: themeStyles.textColor }]}>Gifts</Text>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: themeStyles.textColorSecondary }]}>
            Balance :
          </Text>
          <Text style={[styles.balanceAmount, { color: themeStyles.textColor }]}>
            {balance.toLocaleString()}
          </Text>
          <Text style={styles.coinEmoji}>🪙</Text>
        </View>
      </View>

      <View style={styles.topupContent}>
        <Text style={[styles.topupTitle, { color: themeStyles.textColor }]}>
          Topup your balance
        </Text>
        
        <Text style={[styles.topupDescription, { color: themeStyles.textColorSecondary }]}>
          Topup your GP coin balance, note that 1 GP Coin is equivalent to 1 Naira
          {Platform.OS === 'ios' && (
            <Text style={{ fontWeight: 'bold' }}>{'\n'}Minimum deposit: {MINIMUM_AMOUNT_IOS} Naira</Text>
          )}
        </Text>

        <TextInput
          style={[styles.amountInput, { 
            backgroundColor: themeStyles.backgroundColor,
            color: themeStyles.textColor,
            borderColor: themeStyles.textColorSecondary 
          }]}
          placeholder={Platform.OS === 'ios' ? `Enter amount (min ${MINIMUM_AMOUNT_IOS} Naira)` : "Enter amount"}
          placeholderTextColor={themeStyles.textColorSecondary}
          value={topupAmount}
          onChangeText={setTopupAmount}
          keyboardType="numeric"
          editable={!isIAPLoading}
        />

        <TouchableOpacity 
          style={[styles.topupButton, isIAPLoading && styles.topupButtonDisabled]} 
          onPress={handleTopup}
          disabled={isIAPLoading}
        >
          {isIAPLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.topupButtonText}>Topup</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topupPanel: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  topupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  giftsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  coinEmoji: {
    fontSize: 16,
  },
  topupContent: {
    paddingHorizontal: 20,
    flex: 1,
  },
  topupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 40,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 40,
  },
  topupButton: {
    backgroundColor: '#940304',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  topupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topupButtonDisabled: {
    opacity: 0.6,
  },
});

export default TopupPanel;