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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';

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
    //   const [dark, setDark] = useState<boolean>(true);
    const { dark } = useTheme();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const filters: string[] = ['All', 'Pending', 'Running', 'Closed'];
    const items: Item[] = [
        {
            id: 1,
            title: '20KG Dumb Bells',
            price: 'N25,000',
            status: 'Pending',
            time: '5 min ago',
            image: 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        {
            id: 2,
            title: '20KG Dumb Bells',
            price: 'N25,000',
            status: 'Running',
            time: '5 min ago',
            image: 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        {
            id: 3,
            title: '20KG Dumb Bells',
            price: 'N25,000',
            status: 'Closed',
            time: '5 min ago',
            image: 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        {
            id: 4,
            title: '20KG Dumb Bells',
            price: 'N25,000',
            status: 'Running',
            time: '5 min ago',
            image: 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
    ];

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


    const renderItem = ({ item }: ListRenderItemInfo<Item>) => (
        <View style={[styles.itemCard, { backgroundColor: theme.cardBackground }]}>
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
                    <View style={{flexDirection:'row',gap:5,alignItems:'center'}}>
                        <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                            <MaterialIcons name="edit" size={15} color={theme.textSecondary} />
                        </TouchableOpacity>
    
                        {item.status === 'Closed' && (
                            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                                <Ionicons name="play" size={15} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
    
                        {item.status === 'Running' && (
                            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                                <Ionicons name="stop" size={15} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                        <MaterialIcons name="delete-outline" size={15} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={()=>router.back()}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Adewale's Profile</Text>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <Image
                        source={{
                            uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
                        }}
                        style={styles.profileImage}
                    />
                    <Text style={[styles.profileName, { color: theme.text }]}>Adewale</Text>
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
                    <FlatList
                        data={filteredItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 16 }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
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
        flex:1,
        marginHorizontal:3,
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
