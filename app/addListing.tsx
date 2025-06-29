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
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { updateMarketplaceListing } from '@/utils/mutations/marketplace'; // You need to implement these if not present


//Code Related to the integration
import { useMutation } from '@tanstack/react-query';
import { createMarketplaceListing } from '@/utils/mutations/marketplace';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';


interface ImageSlot {
    id: number;
    uri?: string;
}

const categoryMap: Record<string, number> = {
    gym: 1,
    supplement: 4,
    wears: 5,
    others: 6,
};

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
    const [isSending, setIsSending] = useState(false);
    const params = useLocalSearchParams();
const listingId = params?.listing_id;
const isEditMode = !!listingId;
const { data: listingData, isLoading: isListingLoading } = useQuery({
  queryKey: ['marketplace-listing', listingId],
  queryFn: () => getMarketplaceListingById(listingId),
  enabled: isEditMode,
});


    const [formData, setFormData] = useState({
        productName: '',
        category: '',
        description: '',
        price: '',
        location: '',
    });

    const [images, setImages] = useState<ImageSlot[]>([
        { id: 1, uri: undefined },
        { id: 2, uri: undefined },
        { id: 3, uri: undefined },
        { id: 4, uri: undefined },
    ]);


    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const createListingMutation = useMutation({
        mutationFn: createMarketplaceListing,
    });

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

    const handleImagePress = async (imageId: number) => {
        if (Platform.OS === 'web') {
            Alert.alert('Image Upload', 'Image upload is not supported in web preview. This would work on mobile devices.');
            return;
        }
        // Request permission if not already granted
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access gallery is required!');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setImages(prev =>
                prev.map(img =>
                    img.id === imageId ? { ...img, uri } : img
                )
            );
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

    const handlePostListing = async () => {
        if (isSending) return;

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

        try {
            const form = new FormData();
            form.append('product_name', formData.productName);
            form.append('description', formData.description);
            form.append('price', formData.price);
            form.append('location', formData.location);
            form.append('category_id', String(categoryMap[formData.category]));

            images.forEach((img, idx) => {
                if (img.uri) {
                    const uriParts = img.uri.split('/');
                    const name = uriParts[uriParts.length - 1] || `image${idx + 1}.jpg`;
                    form.append('media_files[]', {
                        uri: img.uri,
                        name,
                        type: 'image/jpeg',
                    } as any);
                }
            });

            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                Toast.show({ type: 'error', text1: 'Not authenticated' });
                return;
            }

            if (isEditMode) {
              // Update
              await updateMarketplaceListing({
                id: listingId,
                data: form,
                token,
              });
              Toast.show({
                type: 'success',
                text1: 'Listing updated successfully!',
              });
            } else {
              // Create
              await createListingMutation.mutateAsync({
                data: form,
                token,
              });
              Toast.show({
                type: 'success',
                text1: 'Listing posted successfully!',
              });
            }
            setTimeout(() => {
              router.back();
            }, 500);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error?.message || 'Failed to post listing',
            });
        }
        finally {
            setIsSending(false);
        }
    };

    React.useEffect(() => {
      if (isEditMode && listingData) {
        setFormData({
          productName: listingData.product_name || '',
          category: Object.keys(categoryMap).find(key => categoryMap[key] === listingData.category_id) || '',
          description: listingData.description || '',
          price: String(listingData.price || ''),
          location: listingData.location || '',
        });
        setImages(
          (listingData.images || []).map((uri: string, idx: number) => ({
            id: idx + 1,
            uri,
          }))
        );
      }
    }, [isEditMode, listingData]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Icon name="chevron-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
  {isEditMode ? 'Edit Listing' : 'New Listing'}
</Text>
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
                        style={[
                            styles.postButton,
                            isSending && { opacity: 0.6 } // optional visual feedback
                        ]}
                        onPress={handlePostListing}
                        disabled={isSending}
                    >
                        <Text style={styles.postButtonText}>
                          {isSending ? (isEditMode ? 'Updating...' : 'Sending...') : (isEditMode ? 'Update Listing' : 'Post Listing')}
                        </Text>
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
        marginTop: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16
        ,
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