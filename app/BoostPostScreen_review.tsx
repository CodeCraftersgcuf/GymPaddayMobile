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
import { useMutation } from '@tanstack/react-query';
import { createBoostedPost } from '@/utils/mutations/posts';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';


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
    const [token, setToken] = useState<string | null>(null);

    const theme = isDark ? colors.dark : colors.light;
    const route = useRouter();
    const params = useLocalSearchParams();
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [balance, setBalance] = useState<number>(0);

    // audience is expected as an array: [selectedGender, minAge, maxAge, budget, duration, location, postId]
    // If passed as a string (comma-separated), split it
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

                const response = await fetch('https://gympaddy.hmstech.xyz/api/user/balance', {
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
        postId = ''
    ] = Array.isArray(audienceArray) ? audienceArray : [];

    const audience = {
        selectedGender,
        minAge,
        maxAge,
        budget: Number(budget),
        duration: Number(duration),
        location,
        postId,
    };
    const getToken = async () => {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        setToken(storedToken);
    };
    useEffect(() => {
        getToken();
    }, []);


    const boostMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error('No auth token');
            // Prepare correct data for createBoostedPost
            // postId must be a number
            const id = Number(audience.postId);
            const data = {
                amount: Number(audience.budget),
                duration: Number(audience.duration),
                location: audience.location || null,
                age_min: Number(audience.minAge) || null,
                age_max: Number(audience.maxAge) || null,
                gender: (audience.selectedGender || '').toLowerCase() as "all" | "male" | "female" | null,
            };
            return await createBoostedPost({ id, data, token });
        },
        onSuccess: (res) => {
            Toast.show({
                type: 'success',
                text1: 'Boosted!',
                text2: 'Your post has been boosted successfully',
                visibilityTime: 500,
            });
            setTimeout(() => {
                route.push('/BoostPostScreen_Final');
            }, 500);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Boost Failed',
                text2: error?.message || 'Failed to boost post',
                visibilityTime: 2000,
            });
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

                <ReviewItem icon="image" title="Ad Preview" value="" onEdit={() => { }} />

                <ReviewItem icon="location-on" title={audience.location} value="" onEdit={() => route.back()} />

                <ReviewItem
                    icon="attach-money"
                    title={`NGN ${audience?.budget?.toLocaleString() || '2,000'} for ${audience?.duration || 1} day`}
                    value=""
                    onEdit={() => route.back()}
                />

                <View style={[styles.walletContainer, { backgroundColor: theme.walletCard }]}>
                    <View style={styles.walletHeader}>
                        <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Wallet Balance</Text>
                        <TouchableOpacity style={styles.topUpButton}>
                            <Text style={styles.topUpText}>TopUp</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.walletAmount, { color: theme.text }]}>{balance}</Text>
                </View>

                <View style={[styles.reachContainer, { backgroundColor: theme.reachCard }]}>
                    <Text style={[styles.reachLabel, { color: theme.background }]}>Estimated Reach</Text>
                    <Text style={[styles.reachValue, { color: theme.background }]}>1k - 2k Accounts</Text>
                </View>
            </ScrollView>

            <Button
                title={boostMutation.isPending ? "Boosting..." : "Boost Post"}
                onPress={handleBoostPost}
                isDark={isDark}
                disabled={boostMutation.isPending}
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
