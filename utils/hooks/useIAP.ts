import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';

const MINIMUM_AMOUNT_IOS = 100;

let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('expo-in-app-purchases module not available:', error);
}

export function gpCreditFromStoreMicros(priceAmountMicros: number): number {
  if (!Number.isFinite(priceAmountMicros) || priceAmountMicros <= 0) return 0;
  return Math.round(priceAmountMicros / 1_000_000);
}

export const useIAP = () => {
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const purchaseListenerRef = useRef<any>(null);
  const pendingAmountRef = useRef<number | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios' && InAppPurchases) {
      initializeIAP();
    } else if (Platform.OS === 'ios' && !InAppPurchases) {
      setIsAvailable(false);
    }
    return () => {
      if (Platform.OS === 'ios' && isAvailable && InAppPurchases) {
        try {
          purchaseListenerRef.current?.remove();
          InAppPurchases.disconnectAsync();
        } catch (error) {
          console.error('Error cleaning up IAP:', error);
        }
      }
    };
  }, []);

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
          throw new Error(errRes.message || 'Top-up API call failed');
        }

        await response.json();
        queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
        setIsLoading(false);
        return true;
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to update wallet. Please contact support.');
        setIsLoading(false);
        return false;
      }
    },
    [queryClient],
  );

  const initializeIAP = async () => {
    if (!InAppPurchases) {
      setIsAvailable(false);
      return;
    }

    try {
      const available = await InAppPurchases.isAvailableAsync();
      setIsAvailable(available);

      if (available) {
        await InAppPurchases.connectAsync();
        purchaseListenerRef.current = InAppPurchases.setPurchaseListener(
          async ({ responseCode, errorCode }: any) => {
            if (responseCode === InAppPurchases.IAPResponseCode.OK) {
              const amount = pendingAmountRef.current;
              if (amount) {
                await handlePurchaseSuccess(amount);
                pendingAmountRef.current = null;
              }
            } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
              Alert.alert('Cancelled', 'Purchase was cancelled');
              setIsLoading(false);
              pendingAmountRef.current = null;
            } else {
              Alert.alert('Error', `Purchase failed: ${errorCode || 'Unknown error'}`);
              setIsLoading(false);
              pendingAmountRef.current = null;
            }
          },
        );
      }
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      setIsAvailable(false);
    }
  };

  const purchaseProduct = async (amount: number): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'In-App Purchases are only available on iOS');
      return false;
    }

    if (!InAppPurchases) {
      Alert.alert('Error', 'In-App Purchases module is not available. Please rebuild the app.');
      return false;
    }

    if (!isAvailable) {
      Alert.alert('Error', 'In-App Purchases are not available');
      return false;
    }

    if (amount < MINIMUM_AMOUNT_IOS) {
      Alert.alert('Error', `Minimum deposit amount is ${MINIMUM_AMOUNT_IOS} Naira`);
      return false;
    }

    setIsLoading(true);
    pendingAmountRef.current = amount;

    try {
      const productId = 'com.pejul.gympaddy.gp_coin_100';
      await InAppPurchases.purchaseItemAsync(productId);
      return true;
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to process purchase');
      setIsLoading(false);
      pendingAmountRef.current = null;
      return false;
    }
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
