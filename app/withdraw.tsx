import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/more/withdraw/Header';
import WithdrawForm from '@/components/more/withdraw/WithdrawForm';
import WithdrawSummary from '@/components/more/withdraw/WithdrawSummary';
import SuccessModal from '@/components/more/withdraw/SuccessModal';
import { useTheme } from '@/contexts/themeContext';

export interface WithdrawData {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  saveDetails: boolean;
}

export default function WithdrawScreen() {
  const [currentStep, setCurrentStep] = useState<'form' | 'summary'>('form');
  const [withdrawData, setWithdrawData] = useState<WithdrawData>({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    saveDetails: false,
  });
  const {dark} = useTheme();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFormSubmit = (data: WithdrawData) => {
    setWithdrawData(data);
    setCurrentStep('summary');
  };

  const handleSummaryProceed = () => {
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setCurrentStep('form');
    setWithdrawData({
      amount: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      saveDetails: false,
    });
  };

  const handleGoBack = () => {
    if (currentStep === 'summary') {
      setCurrentStep('form');
    }
  };

  return (
    <SafeAreaView style={[styles.container,{backgroundColor:dark?'black':'white'}]}>
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
          />
        ) : (
          <WithdrawSummary 
            data={withdrawData}
            onProceed={handleSummaryProceed}
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
    // backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
});