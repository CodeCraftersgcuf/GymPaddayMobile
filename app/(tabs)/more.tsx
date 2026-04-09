import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletCard from '@/components/more/main/WalletCard';
import SettingItem from '@/components/more/main/SettingItem';
import { settingsData, otherSettingsData } from '@/components/more/main/settingsData';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topUpWallet } from '@/utils/mutations/wallets';
import Toast from 'react-native-toast-message';
import { useIAP } from '@/utils/hooks/useIAP';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';



export default function More() {
  const queryClient = useQueryClient();
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });
  const { dark, setScheme } = useTheme();
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [openTheme, setopenTheme] = useState(false)
  const [refreshing, setRefreshing] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const route = useRouter();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";

  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);

  const [loadingBalance, setLoadingBalance] = useState(true);

  // Topup modal states
  const [topupAmount, setTopupAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [useMyDetails, setUseMyDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('test@example.com');
  const [currentView, setCurrentView] = useState<'deposit' | 'payment' | 'flutterwave'>('deposit');
  const [webViewUri, setWebViewUri] = useState<string | null>(null);
  const webViewRef = React.useRef<WebView>(null);
  const { purchaseProduct, isLoading: isIAPLoading, MINIMUM_AMOUNT_IOS, isAvailable } = useIAP();

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(defatulImage); // fallback to prop
          }
          const name = userData.fullname || userData.username || 'John Doe';
          const email = userData.email || 'test@example.com';
          setUserName(name);
          setUserEmail(email);
        } else {
          setProfileImage(defatulImage); // fallback to prop
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(defatulImage); // fallback to prop
      }
    })();
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true); // start loading
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No token founds');

        const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/balance', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();
        console.log('Balance fetch result:', result);

        if (response.ok && result.status === 'success') {
          setBalance(Number(result.balance));
        } else if (response.status === 404 || (result?.message || '').toLowerCase().includes('wallet not found')) {
          // Admin-created users may not have a wallet yet; show 0 and let backend create on next request
          setBalance(0);
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch balance');
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
        setBalance(0);
      } finally {
        setLoadingBalance(false); // stop loading
      }
    })();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      setLoadingBalance(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token found');

      const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/balance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setBalance(Number(result.balance));
      } else if (response.status === 404 || (result?.message || '').toLowerCase().includes('wallet not found')) {
        setBalance(0);
      }

      // Also refresh user profile data including profile image
      const userDataStr = await SecureStore.getItemAsync('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.profile_picture_url) {
          setProfileImage(userData.profile_picture_url);
        }
      }
    } catch (error) {
      console.error('Refresh balance error:', error);
    } finally {
      setLoadingBalance(false);
      setRefreshing(false);
    }
  }, []);


  const userProfile = {
    name: 'Sarah Johnson',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  const handleToggleBalance = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handleTopup = () => {
    if (Platform.OS === 'ios') {
      return;
    }
    setShowTopupModal(true);
  };

  const createTransactionMutation = useMutation({
    mutationFn: async () => {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (!authToken) throw new Error('Not authenticated');
      // Use wallet topup endpoint which handles the conversion correctly
      return topUpWallet({
        data: {
          amount: parseFloat(topupAmount),
        },
        token: authToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
      Toast.show({
        type: 'success',
        text1: 'Deposit successful!',
      });
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.message || 'Failed to create transaction',
      });
    },
  });

  const handleTopupProceed = async () => {
    if (!topupAmount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountValue = parseFloat(topupAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // For iOS, use Apple In-App Purchase
    if (Platform.OS === 'ios') {
      if (amountValue < MINIMUM_AMOUNT_IOS) {
        Alert.alert('Error', `Minimum deposit amount is ${MINIMUM_AMOUNT_IOS} Naira`);
        return;
      }

      if (!isAvailable) {
        Alert.alert('Error', 'In-App Purchases are not available. Please try again later.');
        return;
      }

      const success = await purchaseProduct(amountValue);
      if (success) {
        setShowSuccessModal(true);
        // Reset form
        setTopupAmount('');
        setDepositorName('');
        setUseMyDetails(false);
      }
    } else {
      // For Android, use Flutterwave payment gateway
      // Use email from user data, or fallback to a default for testing
      const paymentEmail = userEmail && userEmail !== 'test@example.com' 
        ? userEmail 
        : 'user@gympaddy.com'; // Fallback email for payment
      
      console.log('💳 Opening Flutterwave payment gateway...', {
        amount: amountValue,
        email: paymentEmail,
        platform: Platform.OS
      });
      
      // Generate unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create HTML content with Flutterwave payment
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Flutterwave Payment</title>
  <script src="https://checkout.flutterwave.com/v3.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</head>
<body>
<script>
  function makePayment() {
    const amount = ${amountValue};
    const order_id = "${orderId}";
    const email = "${paymentEmail}";

    FlutterwaveCheckout({
      public_key: "FLWPUBK_TEST-dd1514f7562b1d623c4e63fb58b6aedb-X",
      tx_ref: "txref_" + Date.now(),
      amount: parseFloat(amount),
      currency: "NGN",
      payment_options: "card,ussd",
      customer: {
        email: email,
        name: email
      },
      callback: function (response) {
        console.log("🔍 Flutterwave callback:", response);

        const isSuccess =
          response.status === "successful" ||
          response.status === "completed" ||
          response.charge_response_code === "00";

        const message = {
          event: isSuccess ? "success" : "failed",
          data: response
        };

        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      },
      onclose: function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: "closed" }));
      },
      customizations: {
        title: "GymPaddy Payment",
        description: \`Order ID: \${order_id}\`,
        logo: "https://yourdomain.com/logo.png"
      }
    });
  }

  window.onload = makePayment;
</script>
</body>
</html>
      `;
      
      setWebViewUri(htmlContent);
      setCurrentView('flutterwave');
      console.log('✅ Flutterwave view set, currentView:', 'flutterwave');
    }
  };

  const handleUseMyDetails = () => {
    setUseMyDetails(!useMyDetails);
    if (!useMyDetails) {
      setDepositorName(userName);
    } else {
      setDepositorName('');
    }
  };

  const handleCopyAccountNumber = async () => {
    if (!paymentDetails.accountNumber) {
      Alert.alert('Unavailable', 'Payment details are not available yet.');
      return;
    }
    await Clipboard.setStringAsync(paymentDetails.accountNumber);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  const handlePaymentMade = () => {
    createTransactionMutation.mutate();
  };

  const handleCloseTopupModal = () => {
    setShowTopupModal(false);
    setTopupAmount('');
    setDepositorName('');
    setUseMyDetails(false);
    setCurrentView('deposit');
    setWebViewUri(null);
    setShowSuccessModal(false);
  };

  const handleBackFromPayment = () => {
    if (currentView === 'payment' || currentView === 'flutterwave') {
      setCurrentView('deposit');
      setWebViewUri(null);
    } else {
      handleCloseTopupModal();
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView message:', message);

      if (message.event === 'success') {
        // Payment successful
        console.log('✅ Payment successful:', message.data);
        Toast.show({
          type: 'success',
          text1: 'Payment Successful!',
          text2: 'Your transaction is being processed.',
        });
        
        // Create transaction record
        createTransactionMutation.mutate();
        
        // Close WebView and show success modal
        setCurrentView('deposit');
        setWebViewUri(null);
        setShowSuccessModal(true);
      } else if (message.event === 'failed') {
        // Payment failed
        console.log('❌ Payment failed:', message.data);
        Toast.show({
          type: 'error',
          text1: 'Payment Failed',
          text2: 'Please try again or use a different payment method.',
        });
        setCurrentView('deposit');
        setWebViewUri(null);
      } else if (message.event === 'closed') {
        // User closed the payment modal
        console.log('🚪 Payment modal closed');
        setCurrentView('deposit');
        setWebViewUri(null);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    handleCloseTopupModal();
    // Refresh balance
    onRefresh();
  };

  const paymentDetails = {
    bankName: process.env.EXPO_PUBLIC_PAYMENT_BANK_NAME || 'GymPaddy Bank',
    accountName: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME || 'GymPaddy',
    accountNumber: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER || '',
    amount: topupAmount ? `N${topupAmount}` : 'N4,000',
    reason: 'Connect VIP subscription',
  };

  const handleWithdraw = () => {
    if (Platform.OS === 'ios') {
      return;
    }
    route.push('/withdraw');
  };

  const handleTransaction = () => {
    route.push('/transactionHistory');
    // Alert.alert('Transaction', 'Transaction history will be shown here');
  };

  const handleSettingPress = async (id: string) => {
    switch (id) {
      case 'notifications':
        // Alert.alert('Notifications', 'Notification settings');
        route.push('/notification');
        break;
      case 'edit-profile':
        // Alert.alert('Edit Profile', 'Profile editing screen');
        route.push('/EditProfile')
        break;
      case 'gifts-history':
        route.push('/giftHistory');
        break;
      case 'business-settings':
        // Alert.alert('Business Settings', 'Business account settings');
        route.push('/bussinessRegister');
        break;
      case 'view-ads':
        // Alert.alert('View Ads', 'Advertisement preferences');
        route.push('/adsProfile')
        break;
      case 'support':
        // Alert.alert('Support', 'Contact customer support');
        route.push('/support')
        break;
      case 'theme':
        Alert.alert('Theme', 'Switch between light and dark theme');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: async () => {
                try {
                  await SecureStore.deleteItemAsync('auth_token');
                  await SecureStore.deleteItemAsync('user_data');
                  // Optionally clear other sensitive data here
                  route.replace('/login');
                } catch (e) {
                  Alert.alert('Error', 'Failed to logout. Please try again.');
                }
              }
            }
          ]
        );
        break;
      case 'delete-account':
        setDeletePassword('');
        setShowDeleteAccountModal(true);
        break;
      default:
        Alert.alert('Feature', `${id} feature coming soon`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : '#FAFAFA' }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF3B30']}
            tintColor="#FF3B30"
            title="Pull to refresh"
            titleColor={dark ? '#fff' : '#000'}
          />
        }
      >
        {/* Header */}
        <ThemedView darkColor='#181818' style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_400Regular', }]}>Wallet</Text>
          <TouchableOpacity onPress={() => route.push('/EditProfile')}>
            <Image source={{ uri: profileImage || '' }} style={styles.headerProfileImage} />
          </TouchableOpacity>
        </ThemedView>

        {/* Wallet Card */}
        <WalletCard
          balance={balance}
          isBalanceHidden={isBalanceHidden}
          onToggleBalance={handleToggleBalance}
          onTopup={handleTopup}
          onWithdraw={handleWithdraw}
          onTransaction={handleTransaction}
          userName={userProfile.name}
          userImage={profileImage} // Use profileImage state instead of userProfile.image
          loading={loadingBalance}
        />

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <ThemeText lightColor='#8E8E93' style={styles.sectionTitle}>Settings</ThemeText>
          <ThemedView lightColor='#FAFAFA' darkColor='#181818' style={styles.settingsContainer}>
            {settingsData.map((item) => (
              <SettingItem
                key={item.id}
                item={item}
                onPress={handleSettingPress}
              />
            ))}
          </ThemedView>
        </View>

        {/* Other Section */}
        <View style={styles.settingsSection}>
          <ThemeText style={styles.sectionTitle}>Other</ThemeText>
          <View style={styles.settingsContainer}>
            <View>
              <SettingItem
                item={{
                  id: 'theme',
                  title: 'Theme',
                  icon: 'moon',
                  iconFamily: 'Feather',
                  backgroundColor: 'transparent',
                }}
                onPress={() => setopenTheme(!openTheme)}
              />
              {openTheme && (
                <View style={{ padding: 10, backgroundColor: dark ? '#222' : '#FAFAFA', borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <SettingItem
                    item={{
                      id: 'light-theme',
                      title: 'Light Theme',
                      icon: 'sun',
                      iconFamily: 'Feather',
                      backgroundColor: 'transparent',
                    }}
                    onPress={() => setScheme('light')}
                  />
                  <SettingItem
                    item={{
                      id: 'dark-theme',
                      title: 'Dark Theme',
                      icon: 'moon',
                      iconFamily: 'Feather',
                      backgroundColor: 'transparent',
                    }}
                    onPress={() => setScheme('dark')}
                  />
                </View>
              )}
            </View>
            {otherSettingsData.map((item) => (
              <SettingItem
                key={item.id}
                item={item}
                onPress={handleSettingPress}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Topup Modal */}
      <Modal
        visible={showTopupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseTopupModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: dark ? 'black' : 'white' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleBackFromPayment} style={styles.modalCloseButton}>
              <Ionicons 
                name={currentView === 'payment' || currentView === 'flutterwave' ? "chevron-back" : "close"} 
                size={24} 
                color={dark ? 'white' : '#333'} 
              />
            </TouchableOpacity>
            <ThemeText style={styles.modalTitle}>
              {currentView === 'deposit' ? 'Deposit' : currentView === 'flutterwave' ? 'Payment' : 'Make Payment'}
            </ThemeText>
            <View style={styles.placeholder} />
          </View>

          {currentView === 'flutterwave' && webViewUri ? (
            <View style={{ flex: 1 }}>
              {/* WebView for Flutterwave */}
              <View style={[styles.webViewWrapper, { backgroundColor: dark ? '#000' : '#fff', flex: 1 }]}>
                <WebView
                  ref={webViewRef}
                  source={{ html: webViewUri }}
                  style={styles.webView}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={[styles.loadingContainer, { backgroundColor: dark ? '#000' : '#fff' }]}>
                      <ActivityIndicator size="large" color="#940304" />
                      <Text style={[styles.loadingText, { color: dark ? '#fff' : '#666' }]}>Loading payment gateway...</Text>
                    </View>
                  )}
                />
              </View>
            </View>
          ) : (
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {currentView === 'deposit' ? (
              <ThemedView style={styles.topupForm}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, { color: dark ? 'white' : 'black', backgroundColor: dark ? '#181818' : 'white' }]}
                    placeholder={Platform.OS === 'ios' ? `Amount (min ${MINIMUM_AMOUNT_IOS} Naira)` : "Amount"}
                    placeholderTextColor="#999"
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                    keyboardType="numeric"
                    editable={!isIAPLoading}
                  />
                  {Platform.OS === 'ios' && (
                    <Text style={[styles.minAmountHint, { color: dark ? '#999' : '#666' }]}>
                      Minimum deposit: {MINIMUM_AMOUNT_IOS} Naira
                    </Text>
                  )}
                </View>

                {Platform.OS !== 'ios' && (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.textInput, { color: dark ? 'white' : 'black', backgroundColor: dark ? '#181818' : 'white' }]}
                        placeholder="Depositor's Name"
                        placeholderTextColor="#999"
                        value={depositorName}
                        onChangeText={setDepositorName}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={handleUseMyDetails}
                    >
                      <View style={[styles.checkbox, useMyDetails && styles.checkboxChecked]}>
                        {useMyDetails && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.checkboxText}>Use my details</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.exchangeRateContainer}>
                  <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
                  <Text style={styles.exchangeRateValue}>N2,000 / 1GP</Text>
                </View>
              </ThemedView>
            ) : (
              <>
                <ThemedView darkColor='#181818' lightColor='#FFFFFF' style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Bank Name</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.bankName}</ThemeText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Account Name</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.accountName}</ThemeText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Account No</ThemeText>
                    <View style={styles.accountNumberContainer}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopyAccountNumber}
                        disabled={!paymentDetails.accountNumber}
                      >
                        <Ionicons name="copy-outline" size={18} color={dark ? 'white' : "#666"} />
                      </TouchableOpacity>
                      <ThemeText darkColor='#666' style={styles.detailValue}>
                        {paymentDetails.accountNumber || 'Unavailable'}
                      </ThemeText>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Amount</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.amount}</ThemeText>
                  </View>
                  <View style={[styles.detailRow, styles.lastDetailRow]}>
                    <ThemeText style={styles.detailLabel}>Reason</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.reason}</ThemeText>
                  </View>
                </ThemedView>
                <View style={[styles.exchangeRateContainer, { marginHorizontal: 20 }]}>
                  <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
                  <Text style={styles.exchangeRateValue}>N2,000 / 1GP</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.proceedButton,
                isIAPLoading && styles.proceedButtonDisabled,
                currentView !== 'deposit' && !paymentDetails.accountNumber && { opacity: 0.5 }
              ]}
              onPress={currentView === 'deposit' ? handleTopupProceed : handlePaymentMade}
              disabled={isIAPLoading || (currentView !== 'deposit' && !paymentDetails.accountNumber)}
            >
              {isIAPLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.proceedButtonText}>
                  {currentView === 'deposit' 
                    ? (Platform.OS === 'ios' ? 'Purchase GP Coins' : 'Proceed')
                    : (paymentDetails.accountNumber ? 'I have made payment' : 'Payment details unavailable')}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>
              Congratulations, your payment has been processed
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseSuccessModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteAccountModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={[styles.deleteModalContainer, { backgroundColor: dark ? '#1a1a1a' : '#fff' }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDeleteAccountModal(false);
                        setShowDeletePassword(false);
                      }}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color={dark ? 'white' : '#333'} />
                    </TouchableOpacity>
                    <ThemeText style={styles.modalTitle}>Delete Account</ThemeText>
                    <View style={styles.placeholder} />
                  </View>

                  <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
                    <ThemeText style={{ marginBottom: 8, fontSize: 14, color: dark ? '#ccc' : '#555' }}>
                      This action cannot be undone. Enter your password to confirm.
                    </ThemeText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, position: 'relative' }}>
                      <TextInput
                        style={[styles.textInput, {
                          color: dark ? '#fff' : '#000',
                          borderColor: dark ? '#444' : '#E5E5E5',
                          backgroundColor: dark ? '#2a2a2a' : '#fafafa',
                          marginTop: 0,
                          paddingRight: 48,
                        }]}
                        placeholder="Enter your password"
                        placeholderTextColor={dark ? '#888' : '#aaa'}
                        secureTextEntry={!showDeletePassword}
                        value={deletePassword}
                        onChangeText={setDeletePassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowDeletePassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          padding: 4,
                        }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Ionicons
                          name={showDeletePassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color={dark ? '#888' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteConfirmButton, { opacity: isDeletingAccount ? 0.6 : 1 }]}
                      disabled={isDeletingAccount}
                      onPress={async () => {
                        if (!deletePassword) {
                          Alert.alert('Error', 'Please enter your password.');
                          return;
                        }
                        setIsDeletingAccount(true);
                        try {
                          const token = await SecureStore.getItemAsync('auth_token');
                          const response = await fetch(API_ENDPOINTS.USER.PROFILE.DeleteAccount, {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ password: deletePassword }),
                          });
                          if (!response.ok) {
                            const errorBody = await response.text();
                            console.error('[Delete Account] HTTP', response.status, response.statusText);
                            console.error('[Delete Account] Response body:', errorBody);
                            let message = 'Failed to delete account. Please try again.';
                            try {
                              const parsed = JSON.parse(errorBody);
                              if (parsed?.errors?.password) {
                                message = parsed.errors.password[0];
                              } else if (parsed?.message) {
                                message = parsed.message;
                              }
                            } catch {}
                            Alert.alert('Error', message);
                            return;
                          }
                          await SecureStore.deleteItemAsync('auth_token');
                          await SecureStore.deleteItemAsync('user_data');
                          setShowDeleteAccountModal(false);
                          setShowDeletePassword(false);
                          route.replace('/login');
                        } catch (e) {
                          console.error('[Delete Account] Error:', e);
                          Alert.alert('Error', 'Failed to delete account. Please try again.');
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      }}
                    >
                      {isDeletingAccount
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Delete My Account</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,


  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    // fontWeight: 'bold',
    color: '#FF3B30',
    // fontStyle: 'italic',
    // paddingVertical:10
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // paddingVertical:10
  },
  settingsSection: {
    marginTop: 50,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsContainer: {
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  bottomSpacing: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topupForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#940304',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#940304',
  },
  checkboxText: {
    fontSize: 16,
    color: '#940304',
    fontWeight: '500',
  },
  exchangeRateContainer: {
    backgroundColor: '#FFE5E5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  exchangeRateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exchangeRateValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  proceedButton: {
    backgroundColor: '#940304',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButtonDisabled: {
    opacity: 0.6,
  },
  minAmountHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  detailsContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  closeButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  webViewWrapper: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  deleteModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});