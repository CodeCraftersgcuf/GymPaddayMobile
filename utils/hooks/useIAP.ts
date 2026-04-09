import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '../../apiConfig';

const MINIMUM_AMOUNT_IOS = 100; // Minimum 100 Naira for iOS

// Try to import InAppPurchases, but handle gracefully if module is not available
let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('expo-in-app-purchases module not available:', error);
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
      console.warn('In-App Purchases module not available. Please rebuild the app with expo prebuild or use a development build.');
      setIsAvailable(false);
    }
    return () => {
      if (Platform.OS === 'ios' && isAvailable && InAppPurchases) {
        try {
          if (purchaseListenerRef.current) {
            purchaseListenerRef.current.remove();
          }
          InAppPurchases.disconnectAsync();
        } catch (error) {
          console.error('Error cleaning up IAP:', error);
        }
      }
    };
  }, []);

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
        
        // Set up purchase listener
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
      // Apple IAP doesn't support quantity parameter
      // Using the product ID created in App Store Connect
      // Product ID: "com.pejul.gympaddy.gp_coin_100" - Price: 100 Naira
      // Apple charges: 100 Naira (product price)
      // Backend credits: User-entered amount (via API call)
      const productId = 'com.pejul.gympaddy.gp_coin_100';

      await InAppPurchases.purchaseItemAsync(productId);
      
      // The purchase listener will handle the success/failure
      // After purchase succeeds, we call the API with the user-entered amount
      // The backend will credit the correct amount regardless of what Apple charged
      return true;
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error?.message || 'Failed to process purchase');
      setIsLoading(false);
      pendingAmountRef.current = null;
      return false;
    }
  };

  const handlePurchaseSuccess = async (amount: number) => {
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
  };

  return {
    isAvailable,
    isLoading,
    products,
    purchaseProduct,
    MINIMUM_AMOUNT_IOS,
  };
};

