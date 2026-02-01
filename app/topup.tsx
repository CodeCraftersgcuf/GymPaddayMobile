import React, { useState } from 'react';
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
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

//Code Related to the integration

import { useMutation } from '@tanstack/react-query';
import { createTransaction } from '@/utils/mutations/transactions';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useIAP } from '@/utils/hooks/useIAP';


type ViewMode = 'deposit' | 'payment';

export default function TopupScreen() {
    const [currentView, setCurrentView] = useState<ViewMode>('deposit');
    const [amount, setAmount] = useState('');
    const [depositorName, setDepositorName] = useState('');
    const [useMyDetails, setUseMyDetails] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [userName, setUserName] = useState('John Doe'); // Default name for the checkbox
    const { dark } = useTheme();
    const { purchaseProduct, isLoading: isIAPLoading, MINIMUM_AMOUNT_IOS, isAvailable } = useIAP();

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
                    console.log('User name from SecureStore:', name); // ✅ Debug log
                    setUserName(name);
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
            return createTransaction({
                data: {
                    wallet_id: 2,
                    amount: parseFloat(amount),
                    type: 'topup',
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
            // For Android, use the existing Flutterwave flow
            if (!depositorName) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }
            setCurrentView('payment');
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
        if (currentView === 'payment') {
            setCurrentView('deposit');
        } else {
            router.back();
        }
    };

    const getHeaderTitle = () => {
        return currentView === 'deposit' ? 'Deposit' : 'Make Payment';
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
                    <Text style={styles.exchangeRateValue}>N2,000 / 2GP</Text>
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
                <Text style={styles.exchangeRateValue}>N2,000 / 2GP</Text>
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
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
                {currentView === 'deposit' ? renderDepositView() : renderPaymentView()}
            </ScrollView>

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
});