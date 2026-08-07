import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Header from '@/components/more/withdraw/Header';
import WithdrawForm from '@/components/more/withdraw/WithdrawForm';
import WithdrawSummary from '@/components/more/withdraw/WithdrawSummary';
import SuccessModal from '@/components/more/withdraw/SuccessModal';
import { useTheme } from '@/contexts/themeContext';

// Integration
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestWithdrawal, resolveWithdrawalAccount } from '@/utils/mutations/withdrawals';
import { getWithdrawalBanks } from '@/utils/queries/withdrawals';
import { API_ENDPOINTS } from '@/apiConfig';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { useIosMonetizationHidden } from '@/utils/iosMonetization';
import uuid from 'react-native-uuid';

/** Naira paid out per 1 GP. Must match the backend WithdrawalRequest::RATE. */
export const GP_RATE = 2000;

/** Smallest payout the backend accepts, in Naira. */
export const MIN_WITHDRAWAL_NAIRA = 2000;
export const MAX_WITHDRAWAL_NAIRA = 1000000;

export interface WithdrawData {
  amount: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verificationToken: string;
}

export default function WithdrawScreen() {
  const { hidden: hideIosMonetization, loading: iosMonetizationLoading } = useIosMonetizationHidden();
  useEffect(() => {
    if (!iosMonetizationLoading && hideIosMonetization) {
      router.replace('/(tabs)/more');
    }
  }, [iosMonetizationLoading, hideIosMonetization]);

  const [currentStep, setCurrentStep] = useState<'form' | 'summary'>('form');

  const [withdrawData, setWithdrawData] = useState<WithdrawData>({
    amount: '',
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    verificationToken: '',
  });

  const { dark } = useTheme();
  const queryClient = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clientReference, setClientReference] = useState(() => String(uuid.v4()));

  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['wallet-balance'],
    enabled: !hideIosMonetization,
    queryFn: async () => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) return 0;

      const response = await fetch(API_ENDPOINTS.USER.BALANCE, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return 0;
      return Number(result.balance ?? result.data?.balance ?? 0) || 0;
    },
  });

  const {
    data: banks = [],
    isLoading: banksLoading,
    error: banksError,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ['withdrawal-banks'],
    enabled: !hideIosMonetization,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) throw new Error('Not authenticated');
      return getWithdrawalBanks(authToken);
    },
  });

  const resolveAccountMutation = useMutation({
    mutationFn: async ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) throw new Error('Not authenticated');
      return resolveWithdrawalAccount({ bankCode, accountNumber, token: authToken });
    },
  });

  const handleFormSubmit = (data: WithdrawData) => {
    setWithdrawData(data);
    setCurrentStep('summary');
  };

  const withdrawalMutation = useMutation({
    mutationFn: async () => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) throw new Error('Not authenticated');

      return requestWithdrawal({
        data: {
          amount: parseFloat(withdrawData.amount),
          verification_token: withdrawData.verificationToken,
          client_reference: clientReference,
        },
        token: authToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.message || 'Failed to submit withdrawal request',
      });
    },
  });

  const handleSummaryProceed = () => {
    if (withdrawalMutation.isPending) return;
    withdrawalMutation.mutate();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setCurrentStep('form');
    setWithdrawData({
      amount: '',
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      verificationToken: '',
    });
    setClientReference(String(uuid.v4()));
  };

  const handleGoBack = () => {
    if (currentStep === 'summary') {
      setCurrentStep('form');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
      <Header
        title={currentStep === 'form' ? 'Withdraw' : 'Summary'}
        showBackButton={currentStep === 'summary'}
        onBackPress={handleGoBack}
      />
      <View style={styles.content}>
        {currentStep === 'form' ? (
          <WithdrawForm
            onSubmit={handleFormSubmit}
            initialData={withdrawData}
            balance={balance}
            balanceLoading={balanceLoading}
            banks={banks}
            banksLoading={banksLoading}
            banksError={banksError ? 'Could not load banks.' : undefined}
            onRetryBanks={refetchBanks}
            isVerifying={resolveAccountMutation.isPending}
            onVerifyAccount={async (bankCode, accountNumber) => {
              const response = await resolveAccountMutation.mutateAsync({ bankCode, accountNumber });
              return response.data;
            }}
          />
        ) : (
          <WithdrawSummary
            data={withdrawData}
            onProceed={handleSummaryProceed}
            isLoading={withdrawalMutation.isPending}
          />
        )}
      </View>
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
