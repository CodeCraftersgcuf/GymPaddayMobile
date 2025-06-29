import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ViewStyle,
    TextStyle,
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
    const theme = isDark ? colors.dark : colors.light;
    // Use Expo Router's useLocalSearchParams to get params
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-ignore
    const route = useRouter();
    // Get params from the route using useLocalSearchParams from expo-router

    const params = useLocalSearchParams();
    // audience is expected as an array: [selectedGender, minAge, maxAge, budget, duration, location, post_id]
    const audienceArray = params.audience as unknown as (string | number)[];
    const [
        selectedGender = '',
        minAge = '',
        maxAge = '',
        budget = 2000,
        duration = 1,
        location = '',
        post_id = ''
    ] = Array.isArray(audienceArray) ? audienceArray : [];

    const audience = {
        selectedGender,
        minAge,
        maxAge,
        budget: Number(budget),
        duration: Number(duration),
        location,
        post_id,
    };

    const handleBoostPost = () => {
        route.push('/BoostPostScreen_Final');
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

                <ReviewItem icon="location-on" title="Lagos, Nigeria" value="" onEdit={() => route.back()} />

                <ReviewItem
                    icon="attach-money"
                    title={`NGN ${audience?.budget?.toLocaleString() || '2,000'} for ${audience?.duration || 1} day`}
                    value=""
                    onEdit={() => route.back()}
                />

                <View style={[styles.walletContainer, { backgroundColor: '#FFE4E1' }]}>
                    <View style={styles.walletHeader}>
                        <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Wallet Balance</Text>
                        <TouchableOpacity style={styles.topUpButton}>
                            <Text style={styles.topUpText}>TopUp</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.walletAmount, { color: theme.text }]}>N 20,000</Text>
                </View>

                <View style={[styles.reachContainer, { backgroundColor: theme.text }]}>
                    <Text style={[styles.reachLabel, { color: theme.background }]}>Estimated Reach</Text>
                    <Text style={[styles.reachValue, { color: theme.background }]}>1k - 2k Accounts</Text>
                </View>
            </ScrollView>

            <Button title="Boost Post" onPress={handleBoostPost} isDark={isDark} />
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
        marginTop: 30,
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
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    reachLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    reachValue: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ReviewAdScreen;
