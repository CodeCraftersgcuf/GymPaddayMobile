import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  currency: string;
}

interface SendCoinsPanelProps {
  dark: boolean;
  balance: number;
  selectedGift: GiftItem;
  onSendSuccess: (amount: number) => void;
}

const SendCoinsPanel: React.FC<SendCoinsPanelProps> = ({ 
  dark, 
  balance, 
  selectedGift, 
  onSendSuccess 
}) => {
  const [coinAmount, setCoinAmount] = useState<string>('1');

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    panelBackground: dark ? '#181818' : '#ffe5e5',
  };

  const handleSendCoins = () => {
    if (!coinAmount || parseFloat(coinAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (parseFloat(coinAmount) > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    const amount = parseFloat(coinAmount);
    onSendSuccess(amount);
    setCoinAmount('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.sendPanel, { backgroundColor: themeStyles.panelBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.sendHeader}>
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

      <ScrollView
        style={styles.sendScroll}
        contentContainerStyle={styles.sendScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.giftPreview}>
          <Text style={styles.selectedGiftEmoji}>{selectedGift.emoji}</Text>
          <Text style={[styles.selectedGiftName, { color: themeStyles.textColor }]}>
            {selectedGift.name}
          </Text>
        </View>

        <Text style={[styles.sendTitle, { color: themeStyles.textColor }]}>
          Send GP Coins to this <Text style={[styles.streamerText, { color: themeStyles.textColorSecondary }]}>streamer</Text>
        </Text>

        <Text style={[styles.sendDescription, { color: themeStyles.textColorSecondary }]}>
          Enter coin quantity
        </Text>

        <TextInput
          style={[
            styles.amountInput,
            {
              backgroundColor: themeStyles.backgroundColor,
              color: themeStyles.textColor,
              borderColor: themeStyles.textColorSecondary,
            },
          ]}
          placeholder="Enter amount"
          placeholderTextColor={themeStyles.textColorSecondary}
          value={coinAmount}
          onChangeText={setCoinAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.sendButton} onPress={handleSendCoins}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sendPanel: {
    flex: 1,
    maxHeight: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  sendScroll: {
    flexGrow: 1,
  },
  sendScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sendHeader: {
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
  giftPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedGiftEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  selectedGiftName: {
    fontSize: 18,
    fontWeight: '600',
  },
  sendTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  streamerText: {
    fontWeight: 'normal',
  },
  sendDescription: {
    fontSize: 14,
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
  sendButton: {
    backgroundColor: '#940304',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SendCoinsPanel;