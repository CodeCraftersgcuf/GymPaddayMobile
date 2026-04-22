import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '../../apiConfig';

/** Fallback minimum when StoreKit has not returned a product yet (iOS only). */
const MINIMUM_AMOUNT_IOS = 100;

/** Must match the consumable (or non-consumable) product ID in App Store Connect exactly. */
const IOS_WALLET_PRODUCT_ID = 'gp_coin1';

let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('expo-in-app-purchases module not available:', error);
}

/** Expo / Play Billing: 1_000_000 micro-units = one unit of local currency (same mapping on iOS native module). */
export function gpCreditFromStoreMicros(priceAmountMicros: number): number {
  if (!Number.isFinite(priceAmountMicros) || priceAmountMicros <= 0) return 0;
  return Math.round(priceAmountMicros / 1_000_000);
}

export const useIAP = () => {
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [iosIapInitializing, setIosIapInitializing] = useState(Platform.OS === 'ios');
  const [iosWalletItem, setIosWalletItem] = useState<any | null>(null);
  const purchaseListenerRef = useRef<any>(null);
  const pendingAmountRef = useRef<number | null>(null);
  const walletProductRef = useRef<any>(null);

  const setWalletProduct = useCallback((item: any | null) => {
    walletProductRef.current = item;
    setIosWalletItem(item);
  }, []);

  const loadIosWalletProduct = useCallback(async () => {
    if (!InAppPurchases || Platform.OS !== 'ios') return null;
    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync([IOS_WALLET_PRODUCT_ID]);
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results?.length) {
        setProducts([]);
        setWalletProduct(null);
        return null;
      }
      const item =
        results.find((r: any) => r.productId === IOS_WALLET_PRODUCT_ID) ?? results[0];
      setProducts(results as any[]);
      setWalletProduct(item);
      return item;
    } catch (e) {
      console.warn('getProductsAsync failed:', e);
      setProducts([]);
      setWalletProduct(null);
      return null;
    }
  }, [setWalletProduct]);

  useEffect(() => {
    if (Platform.OS === 'ios' && InAppPurchases) {
      initializeIAP();
    } else if (Platform.OS === 'ios' && !InAppPurchases) {
      console.warn(
        'In-App Purchases module not available. Please rebuild the app with expo prebuild or use a development build.'
      );
      setIsAvailable(false);
      setIosIapInitializing(false);
    }
    return () => {
      if (Platform.OS === 'ios' && InAppPurchases) {
        try {
          if (purchaseListenerRef.current) {
            purchaseListenerRef.current.remove?.();
            purchaseListenerRef.current = null;
          }
          InAppPurchases.disconnectAsync?.();
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

  const initializeIAP = async () => {
    if (!InAppPurchases) {
      setIsAvailable(false);
      setIosIapInitializing(false);
      return;
    }

    setIosIapInitializing(true);
    try {
      await InAppPurchases.connectAsync();

      purchaseListenerRef.current = InAppPurchases.setPurchaseListener(
        async ({ responseCode, results, errorCode }: any) => {
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
        }
      );

      await loadIosWalletProduct();
      setIsAvailable(true);
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      setIsAvailable(false);
      setWalletProduct(null);
    } finally {
      setIosIapInitializing(false);
    }
  };

  const iosWalletGpCredit = iosWalletItem
    ? gpCreditFromStoreMicros(Number(iosWalletItem.priceAmountMicros ?? 0))
    : 0;
  const iosWalletProductReady =
    Platform.OS === 'ios' && !!iosWalletItem && iosWalletGpCredit > 0 && isAvailable;

  const purchaseProduct = async (_legacyAmount?: number): Promise<boolean> => {
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

    let item = walletProductRef.current;
    if (!item || gpCreditFromStoreMicros(Number(item.priceAmountMicros ?? 0)) <= 0) {
      item = await loadIosWalletProduct();
    }

    const creditGp = item ? gpCreditFromStoreMicros(Number(item.priceAmountMicros ?? 0)) : 0;
    if (!item || creditGp <= 0) {
      Alert.alert(
        'Error',
        'Could not load this product from the App Store. Check your connection and that the product id exists in App Store Connect.'
      );
      return false;
    }

    setIsLoading(true);
    pendingAmountRef.current = creditGp;

    try {
      await InAppPurchases.purchaseItemAsync(IOS_WALLET_PRODUCT_ID);
      return true;
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error?.message || 'Failed to process purchase');
      setIsLoading(false);
      pendingAmountRef.current = null;
      return false;
    }
  };

  const iosLocalizedPrice = iosWalletItem?.price as string | undefined;
  const iosWalletTitle = iosWalletItem?.title as string | undefined;
  const iosWalletDescription = iosWalletItem?.description as string | undefined;
  const iosPriceCurrencyCode = iosWalletItem?.priceCurrencyCode as string | undefined;

  return {
    isAvailable,
    isLoading,
    products,
    purchaseProduct,
    MINIMUM_AMOUNT_IOS,
    iosWalletProductId: Platform.OS === 'ios' ? IOS_WALLET_PRODUCT_ID : undefined,
    iosIapInitializing,
    iosWalletProductReady,
    iosWalletGpCredit,
    iosLocalizedPrice,
    iosWalletTitle,
    iosWalletDescription,
    iosPriceCurrencyCode,
    /** Re-fetch StoreKit metadata (price, title) for gp_coin1. */
    refreshIosWalletProduct: loadIosWalletProduct,
  };
};
