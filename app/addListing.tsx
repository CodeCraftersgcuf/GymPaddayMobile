import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    SafeAreaView,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CategoryBottomSheet from '@/components/market/CategoryBottomSheet';
import LocationBottomSheet from '@/components/market/LocationBottomSheet';
import { useTheme } from '@/contexts/themeContext';




interface ImageSlot {
    id: number;
    uri?: string;
}

const categories = [
    { id: 'gym', title: 'Gym Equipments', icon: 'barbell', color: '#FF0000' },
    { id: 'supplement', title: 'Supplement', icon: 'medical', color: '#0066FF' },
    { id: 'wears', title: 'Wears', icon: 'shirt', color: '#00AA00' },
    { id: 'others', title: 'Others', icon: 'grid', color: '#8B00FF' },
];

const locations = [
    { id: 'ikeja', title: 'Ikeja, Lagos' },
    { id: 'victoria-island', title: 'Victoria Island, Lagos' },
    { id: 'lekki', title: 'Lekki, Lagos' },
    { id: 'surulere', title: 'Surulere, Lagos' },
    { id: 'yaba', title: 'Yaba, Lagos' },
    { id: 'mainland', title: 'Lagos Mainland' },
    { id: 'island', title: 'Lagos Island' },
    { id: 'abuja', title: 'Abuja, FCT' },
    { id: 'kano', title: 'Kano State' },
    { id: 'ibadan', title: 'Ibadan, Oyo' },
];

export default function AddListingScreen() {
    const { dark } = useTheme();
    const isDark = dark; // You can control this boolean
    const router = useRouter();
    const categoryBottomSheetRef = useRef<BottomSheet>(null);
    const locationBottomSheetRef = useRef<BottomSheet>(null);

    const [formData, setFormData] = useState({
        productName: '',
        category: '',
        description: '',
        price: '',
        location: '',
    });

    const [images, setImages] = useState<ImageSlot[]>([
        { id: 1, uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' },
        { id: 2, uri: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg' },
        { id: 3, uri: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg' },
        { id: 4, uri: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg' },
    ]);

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const theme = {
        background: isDark ? '#000000' : '#FFFFFF',
        cardBackground: isDark ? '#181818' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#000000',
        textSecondary: isDark ? '#CCCCCC' : '#666666',
        borderColor: isDark ? '#333333' : '#E5E5E5',
        inputBackground: isDark ? '#333333' : '#F5F5F5',
        inputText: isDark ? '#FFFFFF' : '#000000',
    };

    const handleBack = () => {
        router.back();
    };

    const handleImagePress = (imageId: number) => {
        if (Platform.OS !== 'web') {
            // Handle image picker for mobile
            Alert.alert('Image Picker', 'This would open image picker on mobile');
        } else {
            // Handle web file input
            Alert.alert('Image Upload', 'This would handle image upload on web');
        }
    };

    const handleImageOptions = (imageId: number) => {
        Alert.alert(
            'Image Options',
            'Choose an action',
            [
                { text: 'Replace', onPress: () => handleImagePress(imageId) },
                { text: 'Remove', onPress: () => removeImage(imageId), style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const removeImage = (imageId: number) => {
        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, uri: undefined } : img
        ));
    };

    const openCategoryBottomSheet = () => {
        categoryBottomSheetRef.current?.expand();
    };

    const openLocationBottomSheet = () => {
        locationBottomSheetRef.current?.expand();
    };

    const handleCategorySelect = (categoryId: string) => {
        setFormData(prev => ({ ...prev, category: categoryId }));
    };

    const handleLocationSelect = (locationId: string) => {
        setFormData(prev => ({ ...prev, location: locationId }));
    };

    const getSelectedCategoryTitle = () => {
        const category = categories.find(cat => cat.id === formData.category);
        return category ? category.title : 'Category';
    };

    const getSelectedLocationTitle = () => {
        const location = locations.find(loc => loc.id === formData.location);
        return location ? location.title : 'Location';
    };

    const handlePostListing = () => {
        // Validate form
        if (!formData.productName.trim()) {
            Alert.alert('Error', 'Please enter a product name');
            return;
        }
        if (!formData.category) {
            Alert.alert('Error', 'Please select a category');
            return;
        }
        if (!formData.description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }
        if (!formData.price.trim()) {
            Alert.alert('Error', 'Please enter a price');
            return;
        }
        if (!formData.location) {
            Alert.alert('Error', 'Please select a location');
            return;
        }

        // Show success message
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
            setShowSuccessMessage(false);
            // Navigate back or to listings
            router.back();
        }, 3000);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Icon name="chevron-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>New Listing</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Success Message */}
                {showSuccessMessage && (
                    <View style={styles.successMessage}>
                        <Text style={styles.successText}>Your post has been submitted for review</Text>
                    </View>
                )}

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Product Images */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Product Image</Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                            You can upload a maximum of 4 images for your product
                        </Text>

                        <View style={styles.imagesGrid}>
                            {images.map((image) => (
                                <TouchableOpacity
                                    key={image.id}
                                    style={[styles.imageSlot, { backgroundColor: theme.inputBackground }]}
                                    onPress={() => image.uri ? handleImageOptions(image.id) : handleImagePress(image.id)}
                                >
                                    {image.uri ? (
                                        <>
                                            <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                                            <TouchableOpacity
                                                style={styles.imageOptionsButton}
                                                onPress={() => handleImageOptions(image.id)}
                                            >
                                                <Icon name="ellipsis-vertical" size={16} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <View style={styles.emptyImageSlot}>
                                            <Icon name="camera-outline" size={32} color={theme.textSecondary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Product Name */}
                    <View style={styles.section}>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.inputText,
                                    borderColor: theme.borderColor
                                }
                            ]}
                            placeholder="Product name"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.productName}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, productName: text }))}
                        />
                    </View>

                    {/* Category */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.selectInput,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: theme.borderColor
                                }
                            ]}
                            onPress={openCategoryBottomSheet}
                        >
                            <Text style={[
                                styles.selectInputText,
                                { color: formData.category ? theme.inputText : theme.textSecondary }
                            ]}>
                                {getSelectedCategoryTitle()}
                            </Text>
                            <Icon name="chevron-down" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.inputText,
                                    borderColor: theme.borderColor
                                }
                            ]}
                            placeholder="Description"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Price */}
                    <View style={styles.section}>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.inputText,
                                    borderColor: theme.borderColor
                                }
                            ]}
                            placeholder="Price"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.price}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.selectInput,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: theme.borderColor
                                }
                            ]}
                            onPress={openLocationBottomSheet}
                        >
                            <Text style={[
                                styles.selectInputText,
                                { color: formData.location ? theme.inputText : theme.textSecondary }
                            ]}>
                                {getSelectedLocationTitle()}
                            </Text>
                            <Icon name="chevron-down" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomSpacing} />
                </ScrollView>

                {/* Post Button */}
                <View style={[styles.bottomContainer, { backgroundColor: theme.background }]}>
                    <TouchableOpacity
                        style={styles.postButton}
                        onPress={handlePostListing}
                    >
                        <Text style={styles.postButtonText}>Post Listing</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Sheets */}
                <CategoryBottomSheet
                    ref={categoryBottomSheetRef}
                    categories={categories}
                    selectedCategory={formData.category}
                    onSelectCategory={handleCategorySelect}
                    isDark={isDark}
                />

                <LocationBottomSheet
                    ref={locationBottomSheetRef}
                    locations={locations}
                    selectedLocation={formData.location}
                    onSelectLocation={handleLocationSelect}
                    isDark={isDark}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        width: 40,
    },
    successMessage: {
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    successText: {
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageSlot: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    imageOptionsButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyImageSlot: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    selectInput: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    selectInputText: {
        fontSize: 16,
        flex: 1,
    },
    textArea: {
        minHeight: 120,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    bottomSpacing: {
        height: 100,
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
    },
    postButton: {
        backgroundColor: '#FF0000',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});