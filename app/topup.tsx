import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

//Code Related to the integration

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topUpWallet } from '@/utils/mutations/wallets';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useIAP } from '@/utils/hooks/useIAP';


type ViewMode = 'deposit' | 'payment' | 'flutterwave';

export default function TopupScreen() {
    const [currentView, setCurrentView] = useState<ViewMode>('deposit');
    const [amount, setAmount] = useState('');
    const [depositorName, setDepositorName] = useState('');
    const [useMyDetails, setUseMyDetails] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userName, setUserName] = useState('John Doe'); // Default name for the checkbox
    const [userEmail, setUserEmail] = useState('test@example.com'); // User email for Flutterwave
    const [webViewUri, setWebViewUri] = useState<string | null>(null);
    const webViewRef = useRef<WebView>(null);
    const { dark } = useTheme();
    const { purchaseProduct, isLoading: isIAPLoading, MINIMUM_AMOUNT_IOS, isAvailable } = useIAP();
    const queryClient = useQueryClient();

    const paymentDetails = {
        bankName: process.env.EXPO_PUBLIC_PAYMENT_BANK_NAME || 'GymPaddy Bank',
        accountName: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME || 'GymPaddy',
        accountNumber: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER || '',
        amount: amount ? `N${amount}` : 'N4,000',
        reason: 'Connect VIP subscription',
    };
    const hasPaymentDetails = !!paymentDetails.accountNumber;
    // ✅ Load user_data from SecureStore on mount
    React.useEffect(() => {
        (async () => {
            try {
                const userDataStr = await SecureStore.getItemAsync('user_data');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const name = userData.fullname || userData.username || 'John Doe';
                    const email = userData.email || 'test@example.com';
                    console.log('User name from SecureStore:', name); // ✅ Debug log
                    console.log('User email from SecureStore:', email); // ✅ Debug log
                    setUserName(name);
                    setUserEmail(email);
                } else {
                    console.log('No user_data found in SecureStore');
                }
            } catch (error) {
                console.error('Failed to load user data from SecureStore:', error);
            }
        })();
    }, []);



    const createTransactionMutation = useMutation({
        mutationFn: async () => {
            const authToken = await SecureStore.getItemAsync('auth_token');
            if (!authToken) throw new Error('Not authenticated');
            // Use wallet topup endpoint which handles the conversion correctly
            return topUpWallet({
                data: {
                    amount: parseFloat(amount),
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

    const handleProceed = async () => {
        if (!amount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        const amountValue = parseFloat(amount);
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
                setAmount('');
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
        if (!hasPaymentDetails) {
            Alert.alert('Unavailable', 'Payment details are not available yet.');
            return;
        }
        await Clipboard.setStringAsync(paymentDetails.accountNumber);
        Alert.alert('Copied', 'Account number copied to clipboard');
    };

    const handlePaymentMade = () => {
        createTransactionMutation.mutate();
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        // Reset form
        setAmount('');
        setDepositorName('');
        setUseMyDetails(false);
        setCurrentView('deposit');
        router.push('/(tabs)/more');
    };

    const handleBack = () => {
        if (currentView === 'payment' || currentView === 'flutterwave') {
            setCurrentView('deposit');
            setWebViewUri(null);
        } else {
            router.back();
        }
    };

    const getHeaderTitle = () => {
        if (currentView === 'deposit') return 'Deposit';
        if (currentView === 'flutterwave') return 'Payment';
        return 'Make Paymen';
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

    const renderDepositView = () => (
        <>
            {/* Form */}
            <ThemedView style={styles.form}>
                {/* Amount Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.textInput, { color: dark ? 'white' : 'black', backgroundColor: dark ? 'black' : 'white' }]}
                        placeholder={Platform.OS === 'ios' ? `Amount (min ${MINIMUM_AMOUNT_IOS} Naira)` : "Amount"}
                        placeholderTextColor="#999"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        editable={!isIAPLoading}
                    />
                    {Platform.OS === 'ios' && (
                        <Text style={[styles.minAmountHint, { color: dark ? '#999' : '#666' }]}>
                            Minimum deposit: {MINIMUM_AMOUNT_IOS} Naira
                        </Text>
                    )}
                </View>

                {/* Depositor's Name Input - Only show for Android */}
                {Platform.OS !== 'ios' && (
                    <>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.textInput, { color: dark ? 'white' : 'black', backgroundColor: dark ? 'black' : 'white' }]}
                                placeholder="Depositor's Name"
                                placeholderTextColor="#999"
                                value={depositorName}
                                onChangeText={setDepositorName}
                            />
                        </View>

                        {/* Use My Details Checkbox */}
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

                {/* Exchange Rate */}
                <View style={styles.exchangeRateContainer}>
                    <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
                    <Text style={styles.exchangeRateValue}>N2,000 / 1GP</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.proceedButton, isIAPLoading && styles.proceedButtonDisabled]} 
                    onPress={handleProceed}
                    disabled={isIAPLoading}
                >
                    {isIAPLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.proceedButtonText}>
                            {Platform.OS === 'ios' ? 'Purchase GP Coins' : 'Proceed'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ThemedView>

            {/* Proceed Button */}
        </>
    );

    const renderPaymentView = () => (
        <>
            {/* Payment Details */}
            <ThemedView darkColor='#181818' lightColor='#FFFFFF' style={styles.detailsContainer}>
                {/* Bank Name */}
                <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Bank Name</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.bankName}</ThemeText>
                </View>

                {/* Account Name */}
                <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Account Name</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.accountName}</ThemeText>
                </View>

                {/* Account Number */}
                <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Account No</ThemeText>
                    <View style={styles.accountNumberContainer}>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopyAccountNumber}
                            disabled={!hasPaymentDetails}
                        >
                            <Ionicons name="copy-outline" size={18} color={dark ? 'white' : "#666"} />
                        </TouchableOpacity>
                        <ThemeText darkColor='#666' style={styles.detailValue}>
                            {hasPaymentDetails ? paymentDetails.accountNumber : 'Unavailable'}
                        </ThemeText>
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.detailRow}>
                    <ThemeText style={styles.detailLabel}>Amount</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.amount}</ThemeText>
                </View>

                {/* Reason */}
                <View style={[styles.detailRow, styles.lastDetailRow]}>
                    <ThemeText style={styles.detailLabel}>Reason</ThemeText>
                    <ThemeText darkColor='#666' style={styles.detailValue}>{paymentDetails.reason}</ThemeText>
                </View>
                {/* Exchange Rate */}
            </ThemedView>
            <View style={[styles.exchangeRateContainer, { marginHorizontal: 20 }]}>
                <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
                <Text style={styles.exchangeRateValue}>N2,000 / 1GP</Text>
            </View>


            {/* Payment Made Button */}
            <TouchableOpacity
                style={[styles.proceedButton, !hasPaymentDetails && { opacity: 0.5 }]}
                onPress={handlePaymentMade}
                disabled={!hasPaymentDetails}
            >
                <Text style={styles.proceedButtonText}>
                    {hasPaymentDetails ? 'I have made payment' : 'Payment details unavailable'}
                </Text>
            </TouchableOpacity>
        </>
    );

    // Debug log
    React.useEffect(() => {
        console.log('🔍 Topup Screen State:', {
            currentView,
            hasWebViewUri: !!webViewUri,
            platform: Platform.OS,
            amount,
        });
    }, [currentView, webViewUri, amount]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
            {currentView === 'flutterwave' && webViewUri ? (
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <ThemedView style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons name="chevron-back" size={24} color={dark ? 'white' : "#333"} />
                        </TouchableOpacity>
                        <ThemeText style={styles.headerTitle}>{getHeaderTitle()}</ThemeText>
                        <View style={styles.placeholder} />
                    </ThemedView>
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
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <ThemedView style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons name="chevron-back" size={24} color={dark ? 'white' : "#333"} />
                        </TouchableOpacity>
                        <ThemeText style={styles.headerTitle}>{getHeaderTitle()}</ThemeText>
                        <View style={styles.placeholder} />
                    </ThemedView>

                    {/* Dynamic Content */}
                    {currentView === 'deposit' && renderDepositView()}
                    {currentView === 'payment' && renderPaymentView()}
                </ScrollView>
            )}

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Success Icon */}
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                        </View>

                        {/* Success Message */}
                        <Text style={styles.successTitle}>
                            Congratulations, your payment has been processed
                        </Text>

                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 10,
        // backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
        // paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: 10,
     
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        // color: '#333',
    },
    placeholder: {
        width: 32,
    },
    form: {
        paddingHorizontal: 20,
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 16,
        color: '#333',
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
        // marginHorizontal:20
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
        marginBottom: 40
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
        // backgroundColor: '#FFFFFF',
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
        // color: ,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        // color: '#666',
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
});