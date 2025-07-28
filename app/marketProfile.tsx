import { ListRenderItemInfo } from 'react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ImageSourcePropType,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import MarketBottom from '@/components/Social/Boost/marketBottom';
import BoostAdModal from '@/components/Social/Boost/BoostAdModal';
import MarketBottom from '@/components/Social/Boost/MarketBottom';


//Code Related to the integration
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMarketplaceListingsByUser } from '@/utils/queries/marketplace';
import * as SecureStore from 'expo-secure-store';
import { deleteMarketplaceListing } from '@/utils/mutations/boost';

function timeAgo(dateString: string): string {
    if (!dateString) return '--';
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString();
}

type StatusType = 'Pending' | 'Running' | 'Closed';

interface Item {
    id: number;
    title: string;
    price: string;
    status: StatusType;
    time: string;
    image: string;
}

interface Theme {
    background: string;
    cardBackground: string;
    text: string;
    textSecondary: string;
    border: string;
}


const ProfileScreen: React.FC = () => {
    const { dark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const handleOpenModal = () => setModalVisible(true);
    const handleCloseModal = () => setModalVisible(false);
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [BottomIndex, setBottomIndex] = useState(-1);
    const [selectedItem, setSelectedItem] = useState<{ id: number, image: string } | null>(null);
    const route = useRouter();
    const handleMenu = (id: number, image: string) => {
        setSelectedItem({ id, image });
        console.log('click bottom sheet', id, image);
    };
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const filters: string[] = ['All', 'Pending', 'Running', 'Closed'];

    const dummyImage = "https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg";
    const [profileImage, setProfileImage] = useState<string | null>(dummyImage);

    // --- Integration with API ---
    const { data: listingsData, isLoading, error, refetch } = useQuery({
        queryKey: ['marketplace-listings'],
        queryFn: async () => {
            const userId = await SecureStore.getItemAsync('user_id');
            const token = await SecureStore.getItemAsync('auth_token');
            if (!userId || !token) throw new Error('User not logged in');
            return await getMarketplaceListingsByUser(Number(userId), token);
        }
    });
    React.useEffect(() => {
        (async () => {
            try {
                const userDataStr = await SecureStore.getItemAsync('user_data');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    setUsername(userData.username || userData.fullname || "User");
                    if (userData.profile_picture_url) {
                        setProfileImage(userData.profile_picture_url);
                    } else {
                        setProfileImage(dummyImage);
                    }
                } else {
                    setProfileImage(dummyImage);
                    setUsername("User");
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setProfileImage(dummyImage);
                setUsername("User");
            }
        })();
    }, []);

    const handleEdit = (ad: Item) => {
        // Find the original listing (full backend object, not UI-mapped)
        const originalListing =
            Array.isArray(listingsData?.listings) &&
            listingsData.listings.find((item: any) => String(item.id) === String(ad.id));

        if (!originalListing) {
            alert("Original listing not found!");
            return;
        }

        // Pass it to the addListing route as a JSON string (so it can be prefilled)
        router.push({
            pathname: '/addListing',
            params: {
                listing: JSON.stringify(originalListing),
                isEdit: true, // (optional: let your AddListing screen know this is an edit)
            },
        });
    };

    // Add mutation for deleting a listing
    const { mutate: deleteListing, isLoading: isDeleting } = useMutation({
        mutationFn: async (id: number) => {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('No auth token');
            return await deleteMarketplaceListing({ id, token });
        },
        onSuccess: () => {
            refetch(); // Refresh the listings after delete
        },
        onError: (error) => {
            Alert.alert('Error', 'Failed to delete listing.');
            console.error('Delete listing error:', error);
        }
    });

    // Handler for delete button
    const handleDelete = (item: Item) => {
        Alert.alert(
            'Delete Listing',
            'Are you sure you want to delete this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteListing(item.id)
                }
            ]
        );
    };

    // --- Map API data to UI Item[] ---
    const items: Item[] = Array.isArray(listingsData?.listings)
        ? listingsData.listings.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: `₦${Number(item.price).toLocaleString()}`,
            status:
                item.status === 'pending' ? 'Pending' :
                    item.status === 'running' ? 'Running' :
                        item.status === 'closed' ? 'Closed' : 'Pending',
            time: timeAgo(item.created_at),
            image: item.media_urls && item.media_urls.length > 0
                ? `https://gympaddy.hmstech.xyz/storage/${item.media_urls[0]}`
                : 'https://placehold.co/200x200?text=No+Image',
        }))
        : [];

    // --- Filtering logic ---
    const filteredItems: Item[] =
        activeFilter === 'All' ? items : items.filter(item => item.status === activeFilter);

    const getStatusColor = (status: StatusType): string => {
        switch (status) {
            case 'Pending':
                return '#FFA500';
            case 'Running':
                return '#4CAF50';
            case 'Closed':
                return '#FF6B6B';
            default:
                return '#999';
        }
    };

    const getStatusIcon = (status: StatusType): string => {
        switch (status) {
            case 'Pending':
                return 'time-outline';
            case 'Running':
                return 'play-circle-outline';
            case 'Closed':
                return 'stop-circle-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const theme: Theme = {
        background: dark ? '#000000' : '#FFFFFF',
        cardBackground: dark ? '#181818' : '#F5F5F5',
        text: dark ? '#FFFFFF' : '#000000',
        textSecondary: dark ? '#CCCCCC' : '#666666',
        border: dark ? '#333333' : '#E0E0E0',
    };

    // --- Loading & Error states ---
    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color="#FF0000" />
                <Text style={{ color: theme.text, marginTop: 16, fontSize: 16 }}>Loading listings...</Text>
            </SafeAreaView>
        );
    }
    if (error) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <Text style={{ color: 'red' }}>Failed to load listings.</Text>
            </SafeAreaView>
        );
    }
    const renderItem = ({ item }: { item: Item }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.itemCard, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleMenu(item.id, item.image)}
        >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <View style={styles.itemFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status}
                        </Text>
                    </View>
                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>{item.time}</Text>
                </View>
                <View style={styles.actionButtons}>
                    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]} onPress={() => handleEdit(item)}>
                            <MaterialIcons name="edit" size={15} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {item.status === 'Closed' && (
                            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}
                            >
                                <Ionicons name="play" size={15} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                        {item.status === 'Running' && (
                            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}
                            >
                                <Ionicons name="stop" size={15} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: theme.border }]}
                        onPress={() => handleDelete(item)}
                        disabled={isDeleting}
                    >
                        <MaterialIcons name="delete-outline" size={15} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );


    // Add refreshing state for pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);

    // Handler for pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        
        // Refetch the query
        await refetch();
        
        // Also refresh user data including username
        try {
            const userDataStr = await SecureStore.getItemAsync('user_data');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setUsername(userData.username || userData.fullname || "User");
                if (userData.profile_picture_url) {
                    setProfileImage(userData.profile_picture_url);
                }
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
        
        setRefreshing(false);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{username ? `${username}'s Profile` : "Profile"}</Text>

                    <TouchableOpacity onPress={() => handleMenu(1, 1)}>
                        <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <BoostAdModal
                    visible={modalVisible}
                    onClose={handleCloseModal}
                    dark={dark}
                />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#FF0000']}
                            tintColor="#FF0000"
                            title="Pull to refresh"
                            titleColor={theme.text}
                        />
                    }
                >
                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <Image
                            source={{
                                uri: profileImage,
                            }}
                            style={styles.profileImage}
                        />
                        <Text style={[styles.profileName, { color: theme.text }]}>{username || "User"}</Text>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterContainer}>
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterTab,
                                    activeFilter === filter && styles.activeFilterTab,
                                ]}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: activeFilter === filter ? '#FF6B6B' : theme.textSecondary },
                                    ]}
                                >
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.itemsContainer}>
                        {filteredItems.length === 0 ? (
                            <View style={{ alignItems: 'center', padding: 40 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                                    No data found for {activeFilter}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredItems}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id.toString()}
                                numColumns={2}
                                scrollEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 16 }}
                            />
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
            <MarketBottom
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                onBoost={handleOpenModal}
            />
        </GestureHandlerRootView>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeFilterTab: {
        borderBottomColor: '#FF6B6B',
    },
    filterText: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    itemCard: {
        flex: 1,
        marginHorizontal: 3,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    itemImage: {
        width: '100%',
        height: 100,
        resizeMode: 'cover',
    },
    itemContent: {
        padding: 10,
    },
    itemTitle: {
        fontSize: 8,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FF6B6B',
        marginBottom: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    timeText: {
        fontSize: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeToggle: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});

export default ProfileScreen;
