import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 2;

// const dark = true; // You can change this to toggle theme

const listingData = [
    {
        id: 1,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
    {
        id: 2,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
    {
        id: 3,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
    {
        id: 4,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
    {
        id: 5,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
    {
        id: 6,
        title: '20KG Dumb Bells',
        price: 'N25,000',
        image: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        seller: 'Alucard',
        sellerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        timeAgo: '5 min ago',
    },
];

export default function ListingsScreen() {
    const { dark } = useTheme();
    const theme = {
        background: dark ? '#000000' : '#ffffff',
        secondary: dark ? '#181818' : '#f5f5f5',
        text: dark ? '#ffffff' : '#000000',
        textSecondary: dark ? '#999999' : '#666666',
        border: dark ? '#333333' : '#e0e0e0',
    };

    const renderListingItem = (item: typeof listingData[0]) => (
        <TouchableOpacity key={item.id} style={[styles.listingItem, { backgroundColor: theme.secondary }]}>
            <Image source={{ uri: item.image }} style={styles.listingImage} />
            <View style={styles.listingContent}>
                <Text style={[styles.listingTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={styles.listingPrice}>{item.price}</Text>
                <View style={styles.sellerInfo}>
                    <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
                    <View style={styles.sellerDetails}>
                        <Text style={[styles.sellerName, { color: theme.textSecondary }]}>{item.seller}</Text>
                        <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>{item.timeAgo}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Adewale's Listings</Text>
                <TouchableOpacity>
                    <Icon name="ellipsis-vertical" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.listingsGrid}>
                    {listingData.map(renderListingItem)}
                </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        paddingVertical: 16,
    },
    listingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        gap: 8,
    },
    listingItem: {
        width: itemWidth,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    listingImage: {
        width: '100%',
        height: 160,
    },
    listingContent: {
        padding: 12,
    },
    listingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    listingPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff4444',
        marginBottom: 12,
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sellerAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    sellerDetails: {
        flex: 1,
    },
    sellerName: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    timeAgo: {
        fontSize: 11,
    },
});