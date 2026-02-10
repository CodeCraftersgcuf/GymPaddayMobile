import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';
import { useQuery } from '@tanstack/react-query';
import { getUserBusinesses } from '@/utils/queries/businesses';
import { getBusinessStatus } from '@/utils/queries/marketplace';
import * as SecureStore from 'expo-secure-store';

const benefits = [
    'Get the best services on gym paddy with business',
    'Access to premium business tools and analytics',
    'Priority customer support and assistance',
    'Enhanced visibility in search results',
    'Advanced business profile customization',
];

type SubmissionState = 'idle' | 'reviewing' | 'rejected' | 'approved';

export default function BusinessUpgradeScreen() {
    const { dark } = useTheme();
    const router = useRouter();
    const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
    const [hasExistingBusiness, setHasExistingBusiness] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    console.log('🚀 BusinessUpgradeScreen - Component Rendered');
    console.log('📊 Current state - submissionState:', submissionState);
    console.log('📊 Current state - hasExistingBusiness:', hasExistingBusiness);
    console.log('📊 Current state - isCheckingStatus:', isCheckingStatus);

    // Log when component mounts
    useEffect(() => {
        console.log('🎯 BusinessUpgradeScreen - Component Mounted');
        console.log('🔍 Checking business status...');
    }, []);

    // Check business status using getBusinessStatus endpoint
    const { data: businessStatusData, isLoading: isLoadingStatus, error: businessStatusError } = useQuery({
        queryKey: ['get-business-status'],
        queryFn: async () => {
            console.log('═══════════════════════════════════════');
            console.log('🔍 [getBusinessStatus] Starting query...');
            console.log('═══════════════════════════════════════');
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                console.error('❌ [getBusinessStatus] No auth token found');
                throw new Error('Not authenticated');
            }
            console.log('✅ [getBusinessStatus] Auth token found, calling API...');
            try {
                const response = await getBusinessStatus(token);
                console.log('═══════════════════════════════════════');
                console.log('📊 [getBusinessStatus] RAW Response:', response);
                console.log('📊 [getBusinessStatus] Response Type:', typeof response);
                console.log('📊 [getBusinessStatus] Response Keys:', Object.keys(response || {}));
                console.log('📊 [getBusinessStatus] JSON Response:', JSON.stringify(response, null, 2));
                console.log('═══════════════════════════════════════');
                return response;
            } catch (err) {
                console.error('❌ [getBusinessStatus] API Call Error:', err);
                throw err;
            }
        },
    });

    // Handle business status data
    useEffect(() => {
        if (businessStatusData) {
            console.log('═══════════════════════════════════════');
            console.log('✅ [getBusinessStatus] Data received');
            console.log('📊 [getBusinessStatus] Full data:', JSON.stringify(businessStatusData, null, 2));
            console.log('📊 [getBusinessStatus] Data type:', typeof businessStatusData);
            // Check if user has submitted a business request
            const status = businessStatusData?.status || businessStatusData?.approval_status || businessStatusData?.data?.status;
            console.log('📋 [getBusinessStatus] Extracted status:', status);
            console.log('📋 [getBusinessStatus] data.status:', businessStatusData?.status);
            console.log('📋 [getBusinessStatus] data.approval_status:', businessStatusData?.approval_status);
            console.log('📋 [getBusinessStatus] data.data?.status:', businessStatusData?.data?.status);
            
            if (status) {
                if (status === 'approved' || status === 'Approved') {
                    console.log('✅ [getBusinessStatus] Status: APPROVED');
                    setSubmissionState('approved');
                } else if (status === 'rejected' || status === 'Rejected') {
                    console.log('❌ [getBusinessStatus] Status: REJECTED');
                    setSubmissionState('rejected');
                } else {
                    console.log('⏳ [getBusinessStatus] Status: REVIEWING');
                    setSubmissionState('reviewing');
                }
                setHasExistingBusiness(true);
                console.log('🔒 [getBusinessStatus] hasExistingBusiness set to: true');
            } else {
                console.log('ℹ️ [getBusinessStatus] No status found in response');
            }
            console.log('═══════════════════════════════════════');
        }
    }, [businessStatusData]);

    // Handle business status error
    useEffect(() => {
        if (businessStatusError) {
            console.error('═══════════════════════════════════════');
            console.error('❌ [getBusinessStatus] Query Error:', businessStatusError);
            console.error('❌ [getBusinessStatus] Error message:', businessStatusError?.message);
            console.error('═══════════════════════════════════════');
        }
    }, [businessStatusError]);

    // Also check user businesses as fallback
    const { data: userBusinessesData, isLoading: isLoadingBusinesses, error: userBusinessesError } = useQuery({
        queryKey: ['user-businesses'],
        queryFn: async () => {
            console.log('═══════════════════════════════════════');
            console.log('🔍 [getUserBusinesses] Starting query...');
            console.log('═══════════════════════════════════════');
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                console.error('❌ [getUserBusinesses] No auth token found');
                throw new Error('Not authenticated');
            }
            console.log('✅ [getUserBusinesses] Auth token found, calling API...');
            try {
                const response = await getUserBusinesses(token);
                console.log('═══════════════════════════════════════');
                console.log('📊 [getUserBusinesses] RAW Response:', response);
                console.log('📊 [getUserBusinesses] Response Type:', typeof response);
                console.log('📊 [getUserBusinesses] Response Keys:', Object.keys(response || {}));
                console.log('📊 [getUserBusinesses] JSON Response:', JSON.stringify(response, null, 2));
                console.log('═══════════════════════════════════════');
                return response;
            } catch (err) {
                console.error('❌ [getUserBusinesses] API Call Error:', err);
                throw err;
            }
        },
    });

    // Update checking status when queries complete
    useEffect(() => {
        if (!isLoadingStatus && !isLoadingBusinesses) {
            setIsCheckingStatus(false);
            console.log('✅ Status check completed');
        }
    }, [isLoadingStatus, isLoadingBusinesses]);

    // Handle user businesses data
    useEffect(() => {
        if (userBusinessesData && !hasExistingBusiness) {
            console.log('═══════════════════════════════════════');
            console.log('✅ [getUserBusinesses] Data received');
            console.log('📊 [getUserBusinesses] Full data:', JSON.stringify(userBusinessesData, null, 2));
            const businesses = userBusinessesData?.data || userBusinessesData?.businesses || userBusinessesData || [];
            console.log('📋 [getUserBusinesses] Extracted businesses array:', businesses);
            console.log('📋 [getUserBusinesses] Businesses length:', businesses.length);
            console.log('📋 [getUserBusinesses] Is array?', Array.isArray(businesses));
            console.log('📋 [getUserBusinesses] hasExistingBusiness current value:', hasExistingBusiness);
            
            if (Array.isArray(businesses) && businesses.length > 0) {
                console.log('📋 [getUserBusinesses] First business object:', JSON.stringify(businesses[0], null, 2));
                const status =
                    businesses[0]?.status ||
                    businesses[0]?.approval_status ||
                    (businesses[0]?.is_approved ? 'approved' : 'reviewing');
                console.log('📋 [getUserBusinesses] Extracted status:', status);
                console.log('📋 [getUserBusinesses] businesses[0].status:', businesses[0]?.status);
                console.log('📋 [getUserBusinesses] businesses[0].approval_status:', businesses[0]?.approval_status);
                console.log('📋 [getUserBusinesses] businesses[0].is_approved:', businesses[0]?.is_approved);
                
                if (status === 'approved' || status === 'Approved') {
                    console.log('✅ [getUserBusinesses] Status: APPROVED');
                    setSubmissionState('approved');
                } else if (status === 'rejected' || status === 'Rejected') {
                    console.log('❌ [getUserBusinesses] Status: REJECTED');
                    setSubmissionState('rejected');
                } else {
                    console.log('⏳ [getUserBusinesses] Status: REVIEWING');
                    setSubmissionState('reviewing');
                }
                setHasExistingBusiness(true);
                console.log('🔒 [getUserBusinesses] hasExistingBusiness set to: true');
            } else {
                console.log('ℹ️ [getUserBusinesses] No businesses found');
                console.log('ℹ️ [getUserBusinesses] Array check:', Array.isArray(businesses));
                console.log('ℹ️ [getUserBusinesses] Length check:', businesses.length);
            }
            console.log('═══════════════════════════════════════');
        }
    }, [userBusinessesData, hasExistingBusiness]);

    // Handle user businesses error
    useEffect(() => {
        if (userBusinessesError) {
            console.error('═══════════════════════════════════════');
            console.error('❌ [getUserBusinesses] Query Error:', userBusinessesError);
            console.error('❌ [getUserBusinesses] Error message:', userBusinessesError?.message);
            console.error('═══════════════════════════════════════');
        }
    }, [userBusinessesError]);

    const getStatusMessage = () => {
        switch (submissionState) {
            case 'reviewing':
                return 'Your submission is under review. You will receive a confirmation mail soon.';
            case 'rejected':
                return 'Your submission was rejected. Please resubmit with a clear copy of your certificate.';
            case 'approved':
                return 'Your business profile has been approved successfully!';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (submissionState) {
            case 'reviewing':
                return '#FFB300';
            case 'rejected':
                return '#F44336';
            case 'approved':
                return '#4CAF50';
            default:
                return '#940304';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color={dark ? 'white' : "#333"} />
                </TouchableOpacity>
                <ThemeText style={styles.headerTitle}>Register Business</ThemeText>
            </ThemedView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#FFE4E1', '#FFF0F5']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.upgradeSection}>
                        <Text style={styles.upgradeTitle}>
                            Upgrade to a <Text style={styles.businessText}>Business</Text> Profile
                        </Text>
                        <Text style={styles.upgradeSubtitle}>
                            With a business profile, you get the following benefits
                        </Text>

                        <ThemedView darkColor='#181818' style={styles.benefitsContainer}>
                            {benefits.map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <View style={styles.benefitNumber}>
                                        <Text style={styles.benefitNumberText}>{index + 1}</Text>
                                    </View>
                                    <ThemeText style={styles.benefitText}>{benefit}</ThemeText>
                                </View>
                            ))}
                        </ThemedView>

                        {/* Status Alert */}
                        {submissionState !== 'idle' && (
                            <View style={[styles.statusContainer, { 
                                backgroundColor: submissionState === 'approved' ? '#E8F5E8' : 
                                                submissionState === 'rejected' ? '#FFEBEE' : '#FFF8E1',
                                borderColor: getStatusColor(),
                            }]}>
                                <Ionicons
                                    name={submissionState === 'approved' ? 'checkmark-circle' : 
                                          submissionState === 'rejected' ? 'close-circle' : 'time-outline'}
                                    size={24}
                                    color={getStatusColor()}
                                />
                                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                    {getStatusMessage()}
                                </Text>
                            </View>
                        )}
                    </View>
                    {/* Only show button if status check is complete and status is not pending/reviewing */}
                    {!isCheckingStatus && submissionState !== 'reviewing' && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.upgradeButton}
                                onPress={() => {
                                    router.push('/bussinessForm');
                                }}
                            >
                                <Text style={styles.upgradeButtonText}>
                                    {hasExistingBusiness
                                        ? submissionState === 'approved'
                                            ? 'View Business Profile'
                                            : submissionState === 'rejected'
                                            ? 'Resubmit Application'
                                            : 'Upgrade to business'
                                        : 'Upgrade to business'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </LinearGradient>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        // color: '#333',
        marginLeft: 15,
    },
    content: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
        minHeight: 500,
    },
    upgradeSection: {
        padding: 20,
        paddingTop: 60,
    },
    upgradeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    businessText: {
        color: '#940304',
    },
    upgradeSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    benefitsContainer: {
        // backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    benefitNumber: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#940304',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    benefitNumberText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    benefitText: {
        fontSize: 16,
        // color: '#333',
        flex: 1,
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    upgradeButton: {
        backgroundColor: '#940304',
        borderRadius: 15,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    upgradeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 20,
        marginHorizontal: 20,
    },
    statusText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
});