import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import FlutterwaveWebView from '@/components/payments/FlutterwaveWebView';
import { buildFlutterwaveCheckoutHtml } from '@/utils/flutterwaveCheckout';
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';
import { GP_RATE } from '@/constants/gp';

type ViewMode = 'deposit' | 'payment' | 'flutterwave';

//Code Related to the integration

import { useMutation } from '@tanstack/react-query';
import { topUpWallet } from '@/utils/mutations/wallets';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { resolveLatestDepositorName, resolveLatestUserSnapshot } from '@/utils/resolveLatestUserProfile';
import { useIosMonetizationHidden } from '@/utils/iosMonetization';

export default function TopupScreen() {
    const { hidden: hideIosMonetization, loading: iosMonetizationLoading } = useIosMonetizationHidden();
    useEffect(() => {
        if (!iosMonetizationLoading && hideIosMonetization) {
            router.replace('/(tabs)/more');
        }
    }, [iosMonetizationLoading, hideIosMonetization]);

    const [currentView, setCurrentView] = useState<ViewMode>('deposit');
    const [amount, setAmount] = useState('');
    const [depositorName, setDepositorName] = useState('');
    const [useMyDetails, setUseMyDetails] = useState(false);
    const useMyDetailsRef = useRef(useMyDetails);
    useEffect(() => {
        useMyDetailsRef.current = useMyDetails;
    }, [useMyDetails]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [webViewUri, setWebViewUri] = useState<string | null>(null);
    const { dark } = useTheme();
    // IAP removed — iOS uses the same Flutterwave top-up flow as Android

    const paymentDetails = {
        bankName: process.env.EXPO_PUBLIC_PAYMENT_BANK_NAME || 'GymPaddy Bank',
        accountName: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME || 'GymPaddy',
        accountNumber: process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER || '',
        amount: amount ? `N${amount}` : 'N4,000',
        reason: 'Connect VIP subscription',
    };
    const hasPaymentDetails = !!paymentDetails.accountNumber;

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                const snap = await resolveLatestUserSnapshot();
                if (cancelled) return;
                setUserName(snap.depositorName || snap.displayName);
                setUserEmail(snap.email);
                if (useMyDetailsRef.current) {
                    setDepositorName(snap.depositorName);
                }
            })();
            return () => {
                cancelled = true;
            };
        }, []),
    );

    const onRefreshProfile = useCallback(async () => {
        setRefreshing(true);
        try {
            const snap = await resolveLatestUserSnapshot();
            setUserName(snap.depositorName || snap.displayName);
            setUserEmail(snap.email);
            if (useMyDetailsRef.current) {
                setDepositorName(snap.depositorName);
            }
        } finally {
            setRefreshing(false);
        }
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

        // Same Flutterwave payment flow on iOS and Android (iOS visibility still gated by status-check)
        const paymentEmail = userEmail && userEmail !== 'test@example.com' 
            ? userEmail 
            : 'user@gympaddy.com';
        
        console.log('💳 Opening Flutterwave payment gateway...', {
            amount: amountValue,
            email: paymentEmail,
            platform: Platform.OS
        });
        
        // Generate unique order ID
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const htmlContent = buildFlutterwaveCheckoutHtml({
            amount: amountValue,
            email: paymentEmail,
            customerName: userName || paymentEmail,
            orderId,
        });
            
            setWebViewUri(htmlContent);
            setCurrentView('flutterwave');
            console.log('✅ Flutterwave view set, currentView:', 'flutterwave');
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
                        placeholder="Amount"
                        placeholderTextColor="#999"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.textInput, { color: dark ? 'white' : 'black', backgroundColor: dark ? 'black' : 'white' }]}
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

                {/* Exchange Rate */}
                <View style={styles.exchangeRateContainer}>
                    <Text style={styles.exchangeRateLabel}>Exchange Rate</Text>
                    <Text style={styles.exchangeRateValue}>N{GP_RATE.toLocaleString()} / 1GP</Text>
                </View>
                <TouchableOpacity 
                    style={styles.proceedButton} 
                    onPress={handleProceed}
                >
                    <Text style={styles.proceedButtonText}>Proceed</Text>
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
                <Text style={styles.exchangeRateValue}>N{GP_RATE.toLocaleString()} / 1GP</Text>
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
                        <FlutterwaveWebView
                            html={webViewUri}
                            dark={dark}
                            onMessage={handleWebViewMessage}
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
        borderColor: '#C61F3A',
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#C61F3A',
    },
    checkboxText: {
        fontSize: 16,
        color: '#C61F3A',
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
        backgroundColor: '#C61F3A',
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