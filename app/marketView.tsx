import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    SafeAreaView,
    TextInput,
    FlatList,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';



interface RelatedItem {
    id: string;
    title: string;
    price: string;
    seller: string;
    timeAgo: string;
    image: string;
}

const relatedItems: RelatedItem[] = [
    {
        id: '1',
        title: '20KG Dumb Bells',
        price: 'N25,000',
        seller: 'Alucard',
        timeAgo: '5 min ago',
        image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
    },
    {
        id: '2',
        title: '20KG Dumb Bells',
        price: 'N25,000',
        seller: 'Alucard',
        timeAgo: '5 min ago',
        image: 'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg',
    },
];

export default function ItemDetailsScreen() {
    const { dark } = useTheme();
    const isDark = dark;
    const router = useRouter();
    const { itemId } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const screenWidth = Dimensions.get('window').width;

    const images = [
        'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg',
        'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg',
        'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg',
        'https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg',
    ];

    const theme = {
        background: isDark ? '#000000' : '#FFFFFF',
        cardBackground: isDark ? '#181818' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#000000',
        textSecondary: isDark ? '#CCCCCC' : '#666666',
        borderColor: isDark ? '#333333' : '#E5E5E5',
        inputBackground: isDark ? '#333333' : '#F5F5F5',
    };

    const handleBack = () => {
        router.back();
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            // Handle sending message
            setMessage('');
        }
    };

    const handleQuickMessage = (text: string) => {
        setMessage(text);
    };

    const renderRelatedItem = ({ item }: { item: RelatedItem }) => (
        <TouchableOpacity style={[styles.relatedCard, { backgroundColor: theme.cardBackground }]}>
            <Image source={{ uri: item.image }} style={styles.relatedImage} />
            <View style={styles.relatedInfo}>
                <Text style={[styles.relatedTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.relatedPrice}>{item.price}</Text>
                <View style={styles.relatedSellerInfo}>
                    <Image
                        source={{ uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' }}
                        style={styles.relatedSellerAvatar}
                    />
                    <Text style={[styles.relatedSellerName, { color: theme.textSecondary }]}>
                        {item.seller}
                    </Text>
                    <Text style={[styles.relatedTimeAgo, { color: theme.textSecondary }]}>
                        {item.timeAgo}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image Carousel */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={e => {
                            const index = Math.round(
                                e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                            );
                            setCurrentImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {images.map((img, idx) => (
                            <View key={idx} style={{ width: screenWidth, height: 300 }}>
                                <Image
                                    source={{ uri: img }}
                                    style={styles.itemImage}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="chevron-back" size={24} color={dark ? 'black' : theme.text} />
                    </TouchableOpacity>

                    {/* Image Counter */}
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {currentImageIndex + 1}/{images.length}
                        </Text>
                    </View>
                </View>

                {/* Item Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>20KG Dumb Bells</Text>
                    <Text style={styles.itemPrice}>N25,000</Text>

                    <View style={styles.sellerSection}>
                        <Image
                            source={{ uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' }}
                            style={styles.sellerImage}
                        />
                        <View style={styles.sellerDetails}>
                            <Text style={[styles.sellerName, { color: theme.text }]}>Alucard</Text>
                            <View style={styles.sellerMeta}>
                                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.sellerTime, { color: theme.textSecondary }]}>5 min ago</Text>
                                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.sellerLocation, { color: theme.textSecondary }]}>Ikeja Lagos</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
                    <Text style={[styles.description, { color: theme.textSecondary }]}>
                        The best dumb bells, The best dumb bells, The best dumb bells{'\n'}
                        The best dumb bells, The best dumb bells, The best dumb bells{'\n'}
                        The best dumb bells, The best dumb bells
                    </Text>
                </View>

                {/* Chat with Seller */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Chat with seller</Text>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => handleQuickMessage('Is it available')}
                        >
                            <Text style={styles.quickActionText}>Is it available</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => handleQuickMessage('What is the last price')}
                        >
                            <Text style={styles.quickActionText}>What is the last price</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Message Input */}
                    <View style={styles.messageContainer}>
                        <TextInput
                            style={[styles.messageInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                            placeholder="Type message here"
                            placeholderTextColor={theme.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
                            onPress={handleSendMessage}
                            disabled={!message.trim()}
                        >
                            <Text style={styles.sendButtonText}>Send Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Listings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Listings</Text>
                    <FlatList
                        data={relatedItems}
                        renderItem={renderRelatedItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.relatedList}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: 300,
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCounter: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    imageCounterText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    infoCard: {
        margin: 20,
        marginBottom: 0,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF0000',
        marginBottom: 16,
    },
    sellerSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sellerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    sellerDetails: {
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    sellerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sellerTime: {
        fontSize: 14,
        marginRight: 12,
    },
    sellerLocation: {
        fontSize: 14,
    },
    section: {
        margin: 20,
        marginBottom: 0,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    quickActionButton: {
        borderWidth: 1,
        borderColor: '#FF0000',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    quickActionText: {
        color: '#FF0000',
        fontSize: 14,
        fontWeight: '500',
    },
    messageContainer: {
        gap: 12,
    },
    messageInput: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sendButton: {
        backgroundColor: '#FF0000',
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    relatedList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    relatedCard: {
        width: 150,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    relatedImage: {
        width: '100%',
        height: 100,
    },
    relatedInfo: {
        padding: 12,
    },
    relatedTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    relatedPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF0000',
        marginBottom: 8,
    },
    relatedSellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    relatedSellerAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 4,
    },
    relatedSellerName: {
        fontSize: 12,
        flex: 1,
    },
    relatedTimeAgo: {
        fontSize: 12,
    },
});