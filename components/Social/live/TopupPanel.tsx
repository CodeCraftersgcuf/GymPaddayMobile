import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';

interface TopupPanelProps {
  dark: boolean;
  balance: number;
  onTopupSuccess: (amount: number) => void;
}

const TopupPanel: React.FC<TopupPanelProps> = ({ dark, balance, onTopupSuccess }) => {
  const [topupAmount, setTopupAmount] = useState<string>('');

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    panelBackground: dark ? '#181818' : '#ffe5e5',
  };

  const handleTopup = () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const amount = parseFloat(topupAmount);
    Alert.alert('Success', `Topup of ${amount} GP Coins successful!`);
    onTopupSuccess(amount);
    setTopupAmount('');
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
        </Text>

        <TextInput
          style={[styles.amountInput, { 
            backgroundColor: themeStyles.backgroundColor,
            color: themeStyles.textColor,
            borderColor: themeStyles.textColorSecondary 
          }]}
          placeholder="Enter amount"
          placeholderTextColor={themeStyles.textColorSecondary}
          value={topupAmount}
          onChangeText={setTopupAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.topupButton} onPress={handleTopup}>
          <Text style={styles.topupButtonText}>Topup</Text>
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
    backgroundColor: '#ff0000',
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
});

export default TopupPanel;