import React from 'react';
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
  const [topupAmount, setTopupAmount] = React.useState<string>('');

  const iapResult = useIAP();
  const purchaseProduct = iapResult?.purchaseProduct;
  const isIAPLoading = iapResult?.isLoading ?? false;
  const isAvailable = iapResult?.isAvailable ?? false;
  const iosIapInitializing = iapResult?.iosIapInitializing ?? false;
  const iosWalletProductReady = iapResult?.iosWalletProductReady ?? false;
  const iosWalletGpCredit = iapResult?.iosWalletGpCredit ?? 0;
  const iosLocalizedPrice = iapResult?.iosLocalizedPrice;
  const iosWalletTitle = iapResult?.iosWalletTitle;
  const iosWalletDescription = iapResult?.iosWalletDescription;
  const iosPriceCurrencyCode = iapResult?.iosPriceCurrencyCode;
  const iosWalletProductId = iapResult?.iosWalletProductId;

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    panelBackground: dark ? '#181818' : '#ffe5e5',
  };

  const handleTopup = async () => {
    if (Platform.OS === 'ios') {
      if (!isAvailable || !purchaseProduct) {
        Alert.alert('Error', 'In-App Purchases are not available. Please try again later.');
        return;
      }

      if (!iosWalletProductReady) {
        Alert.alert(
          'Error',
          'Could not load this product from the App Store. Try again shortly.'
        );
        return;
      }

      try {
        const success = await purchaseProduct();
        if (success) {
          onTopupSuccess(iosWalletGpCredit);
        }
      } catch (error) {
        console.error('Purchase error:', error);
        Alert.alert('Error', 'Failed to process purchase. Please try again.');
      }
      return;
    }

    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(topupAmount);
    Alert.alert('Success', `Topup of ${amount} GP Coins successful!`);
    onTopupSuccess(amount);
    setTopupAmount('');
  };

  const iosBuyDisabled =
    isIAPLoading || iosIapInitializing || !iosWalletProductReady || !purchaseProduct;

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

        {Platform.OS === 'ios' ? (
          <>
            <Text style={[styles.topupDescription, { color: themeStyles.textColorSecondary }]}>
              Purchase uses Apple In-App Purchase; price and pack are defined in App Store Connect for{' '}
              {iosWalletProductId ?? 'this product'}.
            </Text>
            {iosIapInitializing ? (
              <View style={styles.iosStoreLoading}>
                <ActivityIndicator color="#940304" />
                <Text style={[styles.storeMeta, { color: themeStyles.textColorSecondary, marginTop: 12 }]}>
                  Loading App Store…
                </Text>
              </View>
            ) : (
              <>
                {iosWalletTitle ? (
                  <Text style={[styles.iosProductTitle, { color: themeStyles.textColor }]}>{iosWalletTitle}</Text>
                ) : null}
                {iosLocalizedPrice ? (
                  <Text style={[styles.iosProductPrice, { color: themeStyles.textColor }]}>
                    {iosLocalizedPrice}
                    {iosPriceCurrencyCode ? ` · ${iosPriceCurrencyCode}` : ''}
                  </Text>
                ) : null}
                {iosWalletProductReady ? (
                  <Text style={[styles.storeMeta, { color: themeStyles.textColorSecondary }]}>
                    Credits <Text style={{ fontWeight: '700', color: themeStyles.textColor }}>{iosWalletGpCredit} GP</Text> after
                    purchase (from store price).
                  </Text>
                ) : (
                  <Text style={[styles.storeMeta, { color: '#c00' }]}>
                    Product not available from the store. Check App Store Connect.
                  </Text>
                )}
                {iosWalletDescription ? (
                  <Text
                    style={[styles.storeMeta, { color: themeStyles.textColorSecondary, marginTop: 8 }]}
                    numberOfLines={3}
                  >
                    {iosWalletDescription}
                  </Text>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.topupDescription, { color: themeStyles.textColorSecondary }]}>
              Topup your GP coin balance, note that 1 GP Coin is equivalent to 1 Naira
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
              value={topupAmount}
              onChangeText={setTopupAmount}
              keyboardType="numeric"
              editable={!isIAPLoading}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.topupButton, (Platform.OS === 'ios' ? iosBuyDisabled : isIAPLoading) && styles.topupButtonDisabled]}
          onPress={handleTopup}
          disabled={Platform.OS === 'ios' ? iosBuyDisabled : isIAPLoading}
        >
          {isIAPLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.topupButtonText}>
              {Platform.OS === 'ios' ? `Buy for ${iosLocalizedPrice ?? 'App Store'}` : 'Topup'}
            </Text>
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
    marginBottom: 24,
  },
  iosStoreLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  iosProductTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  iosProductPrice: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  storeMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
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
