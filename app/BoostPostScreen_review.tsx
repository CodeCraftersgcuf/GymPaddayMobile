import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ViewStyle,
    TextStyle,
    Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from '@/components/Social/Boost/colors';
import Header from '@/components/Social/Boost/Header';
import ProgressBar from '@/components/Social/Boost/ProgressBar';
import Button from '@/components/Social/Boost/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';


//Code Related to the integration
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBoostedPost, createBoostedListing } from '@/utils/mutations/posts';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { updateBoostedMarketplace, updateBoostedPost } from '@/utils/mutations/boost';
import { API_ENDPOINTS } from '@/apiConfig';

// If you have a type for your navigation stack, use that instead of `any`
type RootStackParamList = {
    ReviewAd: {
        audience: {
            budget: number;
            duration: number;
            [key: string]: any;
        };
    };
    BoostSuccess: undefined;
};

const ReviewAdScreen: React.FC = () => {
    const { dark } = useTheme();
    const isDark = dark;
    const queryClient = useQueryClient();

    const theme = isDark ? colors.dark : colors.light;
    const route = useRouter();
    const params = useLocalSearchParams();
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [balance, setBalance] = useState<number>(0);
    let audienceArray: (string | number)[] = [];
    if (Array.isArray(params.audience)) {
        audienceArray = params.audience as (string | number)[];
    } else if (typeof params.audience === 'string') {
        audienceArray = params.audience.split(',');
    }

    console.log("ReviewAdScreen audienceArray:", audienceArray);

    React.useEffect(() => {
        (async () => {
            try {
                setLoadingBalance(true); // start loading
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) throw new Error('No token founds');

                const response = await fetch(API_ENDPOINTS.USER.PROFILE.Balance, {
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
                } else {
                    Alert.alert('Error', result.message || 'Failed to fetch balance');
                }
            } catch (error) {
                console.error('Balance fetch error:', error);
                Alert.alert('Error', 'Unable to fetch wallet balance.');
            } finally {
                setLoadingBalance(false); // stop loading
            }
        })();
    }, []);

    const [
        selectedGender = '',
        minAge = '',
        maxAge = '',
        budget = 2000,
        duration = 1,
        location = '',
        postId = '',
        isMarketFromAudience = false,
    ] = Array.isArray(audienceArray) ? audienceArray : [];

    const isMarketFromAudienceBool =
        isMarketFromAudience === true ||
        isMarketFromAudience === 1 ||
        isMarketFromAudience === 'true' ||
        isMarketFromAudience === '1';
    const audience = {
        selectedGender,
        minAge,
        maxAge,
        budget: Number(budget),
        duration: Number(duration),
        location,
        postId,
    };
    const isEditableBool =
        typeof params.isEditable === 'string'
            ? params.isEditable === 'true'
            : !!params.isEditable;

    const dailyBudgetGp = Math.round(Number(audience.budget) || 0);
    const durationDays = Math.max(1, Math.round(Number(audience.duration) || 1));
    const totalGpCharge = isEditableBool ? 0 : dailyBudgetGp * durationDays;
    const canAffordBoost = isEditableBool || balance >= totalGpCharge;

    const boostMutation = useMutation({
        mutationFn: async () => {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('No auth token');
            const id = Number(audience.postId);

            const editMode = params.isEditable === true || params.isEditable === 'true';
            const marketListing =
                params.isMarket === true ||
                params.isMarket === 'true' ||
                isMarketFromAudienceBool;
            console.log('Boost Mutation Params:', {
                editMode,
                marketListing,
                id,
                audience,
            });

            if (editMode) {
                // --- EDIT MODE ---
                const updateData = {
                    budget: Math.round(Number(audience.budget)),
                    duration: Math.round(Number(audience.duration)),
                    location: audience.location || null,
                    age_min: Number(audience.minAge) || null,
                    age_max: Number(audience.maxAge) || null,
                    gender: (audience.selectedGender || '').toLowerCase(),
                };
                // Add ONLY the fields user can edit.

                if (marketListing) {
                    console.log('[EDIT] updateBoostedMarketplace', { id, data: updateData });
                    return await updateBoostedMarketplace({ id, data: updateData, token });
                } else {
                    console.log('[EDIT] updateBoostedPost', { id, data: updateData });
                    return await updateBoostedPost({ id, data: updateData, token });
                }
            } else {
                // --- CREATE MODE ---
                const createData = {
                    amount: Number(audience.budget),
                    duration: Number(audience.duration),
                    location: audience.location || null,
                    age_min: Number(audience.minAge) || null,
                    age_max: Number(audience.maxAge) || null,
                    gender: (audience.selectedGender || '').toLowerCase(),
                };
                if (marketListing) {
                    console.log('[CREATE] createBoostedListing', { id, data: createData });
                    return await createBoostedListing({ id, data: createData, token });
                } else {
                    console.log('[CREATE] createBoostedPost', { id, data: createData });
                    return await createBoostedPost({ id, data: createData, token });
                }
            }
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
            Toast.show({
                type: 'success',
                text1: isEditableBool ? 'Ad updated!' : 'Boosted!',
                text2: isEditableBool ? 'Your ad has been updated successfully' : 'Your post has been boosted successfully',
                visibilityTime: 500,
            });
            setTimeout(() => {
                route.push('/(tabs)');
            }, 500);
        },
        onError: (error: any) => {
            let detail = '';
            const apiErrors = error?.response?.data?.errors ?? error?.data?.errors;
            if (apiErrors && typeof apiErrors === 'object') {
                detail = Object.values(apiErrors).flat().join('\n');
            }
            const message =
                detail ||
                error?.data?.message ||
                error?.response?.data?.message ||
                (typeof error?.message === 'string' ? error.message : '') ||
                (isEditableBool ? 'Failed to update ad' : 'Failed to boost post');

            const statusCode = error?.statusCode || error?.response?.status || error?.data?.code;
            const title =
                statusCode === 409
                    ? 'Already Boosted'
                    : isEditableBool
                        ? 'Update Failed'
                        : 'Boost Failed';

            Toast.show({
                type: 'error',
                text1: title,
                text2: message,
                visibilityTime: 4000,
            });
            Alert.alert(title, message);
        }
    });



    const handleBoostPost = () => {
        boostMutation.mutate();
    };

    const ReviewItem = ({
        icon,
        title,
        value,
        onEdit,
    }: {
        icon: string;
        title: string;
        value: string;
        onEdit: () => void;
    }) => (
        <TouchableOpacity style={[styles.reviewItem, { backgroundColor: theme.surface }]} onPress={onEdit}>
            <View style={styles.reviewItemLeft}>
                <Icon name={icon} size={24} color={colors.light.primary} />
                <Text style={[styles.reviewItemTitle, { color: theme.text }]}>{title}</Text>
            </View>
            <View style={styles.reviewItemRight}>
                <Text style={[styles.reviewItemValue, { color: theme.text }]}>{value}</Text>
                <Icon name="edit" size={20} color={theme.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Review Ad" onBack={() => route.back()} isDark={isDark} />

            <ProgressBar progress={75} isDark={isDark} />

            <ScrollView style={styles.content}>
                <Text style={[styles.subtitle, { color: theme.text }]}>Your ad is almost ready</Text>

                <ReviewItem
                    icon="image"
                    title="Ad Preview"
                    value=""
                    onEdit={() => {
                        route.push({
                            pathname: '/AdPreview',
                            params: {
                                postId: audience.postId,
                                campaignId: (params.campaignId as string) ?? String(audience.postId),
                            }
                        });
                    }}
                />

                <ReviewItem icon="location-on" title={audience.location} value="" onEdit={() => route.back()} />

                <ReviewItem
                    icon="attach-money"
                    title={
                        isEditableBool
                            ? `GP ${dailyBudgetGp.toLocaleString()}/day · ${durationDays} day(s)`
                            : `GP ${dailyBudgetGp.toLocaleString()}/day × ${durationDays} days = ${totalGpCharge.toLocaleString()} GP`
                    }
                    value=""
                    onEdit={() => route.back()}
                />

                <View style={[styles.walletContainer, { backgroundColor: theme.walletCard }]}>
                    <View style={styles.walletHeader}>
                        <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Wallet balance (GP)</Text>
                        <TouchableOpacity style={styles.topUpButton} onPress={() => route.push('/topup')}>
                            <Text style={styles.topUpText}>TopUp</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.walletAmount, { color: theme.text }]}>
                        {loadingBalance ? '…' : balance.toLocaleString()}
                    </Text>
                    {!isEditableBool && !loadingBalance && !canAffordBoost && (
                        <Text style={{ color: '#B91C1C', marginTop: 8, fontSize: 14 }}>
                            You need {totalGpCharge.toLocaleString()} GP to start this boost. Top up to continue.
                        </Text>
                    )}
                </View>

                <View style={[styles.reachContainer, { backgroundColor: theme.reachCard }]}>
                    <Text style={[styles.reachLabel, { color: theme.background }]}>Estimated Reach</Text>
                    <Text style={[styles.reachValue, { color: theme.background }]}>1k - 2k Accounts</Text>
                </View>
            </ScrollView>

            <Button
                title={boostMutation.isPending ? "Boosting..." : isEditableBool ? "Update boost" : "Boost Post"}
                onPress={handleBoostPost}
                isDark={isDark}
                disabled={boostMutation.isPending || loadingBalance || (!isEditableBool && !canAffordBoost)}
            />
        </View>
    );
};

type Styles = {
    container: ViewStyle;
    content: ViewStyle;
    subtitle: TextStyle;
    reviewItem: ViewStyle;
    reviewItemLeft: ViewStyle;
    reviewItemTitle: TextStyle;
    reviewItemRight: ViewStyle;
    reviewItemValue: TextStyle;
    walletContainer: ViewStyle;
    walletHeader: ViewStyle;
    walletLabel: TextStyle;
    topUpButton: ViewStyle;
    topUpText: TextStyle;
    walletAmount: TextStyle;
    reachContainer: ViewStyle;
    reachLabel: TextStyle;
    reachValue: TextStyle;
};

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,

    },

    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    reviewItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    reviewItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    reviewItemTitle: {
        fontSize: 16,
        marginLeft: 12,
    },
    reviewItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewItemValue: {
        fontSize: 16,
        marginRight: 8,
    },
    walletContainer: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    walletLabel: {
        fontSize: 14,
    },
    topUpButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    topUpText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    walletAmount: {
        fontSize: 24,
        fontWeight: '700',
    },
    reachContainer: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',

    },
    reachLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    reachValue: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ReviewAdScreen;
