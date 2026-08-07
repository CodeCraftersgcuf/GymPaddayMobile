import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

interface TopupPanelProps {
  dark: boolean;
  balance: number;
  onTopupSuccess: (amount: number) => void;
}

/** Live top-up — opens the shared Flutterwave wallet screen (same as Android). No Apple IAP. */
const TopupPanel: React.FC<TopupPanelProps> = ({ dark, balance, onTopupSuccess }) => {
  const themeStyles = {
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    panelBackground: dark ? '#181818' : '#ffe5e5',
  };

  const handleTopup = () => {
    onTopupSuccess(0); // close panel only — do not credit wallet here
    router.push('/topup');
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
          Topup your GP coin balance. 1 GP Coin is equivalent to 1 Naira. Uses the same payment
          flow as Android.
        </Text>

        <TouchableOpacity style={styles.topupButton} onPress={handleTopup}>
          <Text style={styles.topupButtonText}>Continue to Topup</Text>
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
    marginBottom: 24,
  },
  topupButton: {
    backgroundColor: '#C61F3A',
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
