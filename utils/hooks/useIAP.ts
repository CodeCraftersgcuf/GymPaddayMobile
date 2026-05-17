import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '../../apiConfig';

/** Fallback minimum when StoreKit has not returned a product yet (iOS only). */
const MINIMUM_AMOUNT_IOS = 100;

/** Expo / Play Billing: 1_000_000 micro-units = one unit of local currency (same mapping on iOS native module). */
export function gpCreditFromStoreMicros(priceAmountMicros: number): number {
  if (!Number.isFinite(priceAmountMicros) || priceAmountMicros <= 0) return 0;
  return Math.round(priceAmountMicros / 1_000_000);
}

export const useIAP = () => {
  const queryClient = useQueryClient();
  const [isAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [products] = useState<any[]>([]);

  const handlePurchaseSuccess = useCallback(
    async (amount: number) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          Alert.alert('Error', 'Authentication required');
          setIsLoading(false);
          return false;
        }

        const response = await fetch(API_ENDPOINTS.USER.WALLETS.TopUp, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          const errRes = await response.json();
          console.error('❌ Top-up API error:', errRes);
          throw new Error(errRes.message || 'Top-up API call failed');
        }

        const data = await response.json();
        console.log('✅ Top-up successful:', data);
        queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
        setIsLoading(false);
        return true;
      } catch (error: any) {
        console.error('Topup API error:', error);
        Alert.alert('Error', error?.message || 'Failed to update wallet. Please contact support.');
        setIsLoading(false);
        return false;
      }
    },
    [queryClient]
  );

  const purchaseProduct = async (amount?: number): Promise<boolean> => {
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    setIsLoading(true);
    return handlePurchaseSuccess(amount);
  };

  return {
    isAvailable,
    isLoading,
    products,
    purchaseProduct,
    MINIMUM_AMOUNT_IOS,
    iosWalletProductId: undefined,
    iosIapInitializing: false,
    iosWalletProductReady: true,
    iosWalletGpCredit: 0,
    iosLocalizedPrice: undefined,
    iosWalletTitle: undefined,
    iosWalletDescription: undefined,
    iosPriceCurrencyCode: undefined,
    refreshIosWalletProduct: async () => null,
  };
};
