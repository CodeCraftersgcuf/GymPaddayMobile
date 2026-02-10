import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';


//Code Related to the integration
import { useMutation, useQuery } from '@tanstack/react-query';
import { createBusiness } from '@/utils/mutations/businesses';
import { getUserBusinesses } from '@/utils/queries/businesses';
import { getBusinessStatus } from '@/utils/queries/marketplace';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';


const validationSchema = Yup.object().shape({
    businessName: Yup.string()
        .min(2, 'Business name must be at least 2 characters')
        .required('Business name is required'),
    category: Yup.string()
        .required('Category is required'),
    address: Yup.string()
        .min(10, 'Address must be at least 10 characters')
        .required('Address is required'),
    businessEmail: Yup.string()
        .email('Invalid email format')
        .required('Business email is required'),
    businessPhone: Yup.string()
        .matches(/^[0-9]{11}$/, 'Phone number must be 11 digits')
        .required('Business phone number is required'),
});

const categories = [
    'Fashion',
    'Food & Beverage',
    'Technology',
    'Healthcare',
    'Education',
    'Real Estate',
    'Automotive',
    'Beauty & Wellness',
    'Sports & Fitness',
    'Entertainment',
];

type SubmissionState = 'idle' | 'reviewing' | 'rejected' | 'approved';

export default function BusinessRegistrationScreen() {
    const { dark } = useTheme();
    const router = useRouter();
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
    const [hasExistingBusiness, setHasExistingBusiness] = useState(false);
    const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

    console.log('🚀 BusinessRegistrationScreen - Component Rendered');
    console.log('📊 Current state - submissionState:', submissionState);
    console.log('📊 Current state - hasExistingBusiness:', hasExistingBusiness);

    // Log when component mounts
    useEffect(() => {
        console.log('🎯 BusinessRegistrationScreen - Component Mounted');
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
        onSuccess: (data: any) => {
            console.log('═══════════════════════════════════════');
            console.log('✅ [getBusinessStatus] onSuccess Triggered');
            console.log('📊 [getBusinessStatus] Full data:', JSON.stringify(data, null, 2));
            console.log('📊 [getBusinessStatus] Data type:', typeof data);
            // Check if user has submitted a business request
            const status = data?.status || data?.approval_status || data?.data?.status;
            console.log('📋 [getBusinessStatus] Extracted status:', status);
            console.log('📋 [getBusinessStatus] data.status:', data?.status);
            console.log('📋 [getBusinessStatus] data.approval_status:', data?.approval_status);
            console.log('📋 [getBusinessStatus] data.data?.status:', data?.data?.status);
            
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
        },
        onError: (error: any) => {
            console.error('═══════════════════════════════════════');
            console.error('❌ [getBusinessStatus] Query Error:', error);
            console.error('❌ [getBusinessStatus] Error message:', error?.message);
            console.error('❌ [getBusinessStatus] Error stack:', error?.stack);
            console.error('═══════════════════════════════════════');
        },
    });

    // Also check user businesses as fallback
    const { data: userBusinessesData, error: userBusinessesError } = useQuery({
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
        onSuccess: (data: any) => {
            console.log('═══════════════════════════════════════');
            console.log('✅ [getUserBusinesses] onSuccess Triggered');
            console.log('📊 [getUserBusinesses] Full data:', JSON.stringify(data, null, 2));
            const businesses = data?.data || data?.businesses || data || [];
            console.log('📋 [getUserBusinesses] Extracted businesses array:', businesses);
            console.log('📋 [getUserBusinesses] Businesses length:', businesses.length);
            console.log('📋 [getUserBusinesses] Is array?', Array.isArray(businesses));
            console.log('📋 [getUserBusinesses] hasExistingBusiness current value:', hasExistingBusiness);
            
            if (Array.isArray(businesses) && businesses.length > 0 && !hasExistingBusiness) {
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
                console.log('ℹ️ [getUserBusinesses] No businesses found or hasExistingBusiness already true');
                console.log('ℹ️ [getUserBusinesses] Array check:', Array.isArray(businesses));
                console.log('ℹ️ [getUserBusinesses] Length check:', businesses.length);
                console.log('ℹ️ [getUserBusinesses] hasExistingBusiness check:', hasExistingBusiness);
            }
            console.log('═══════════════════════════════════════');
        },
        onError: (error: any) => {
            console.error('═══════════════════════════════════════');
            console.error('❌ [getUserBusinesses] Query Error:', error);
            console.error('❌ [getUserBusinesses] Error message:', error?.message);
            console.error('❌ [getUserBusinesses] Error stack:', error?.stack);
            console.error('═══════════════════════════════════════');
        },
    });

    // --- Mutation for business creation ---
    const createBusinessMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const token = await SecureStore.getItemAsync('auth_token');
            console.log("Token", token);
            if (!token) throw new Error('Not authenticated');
            return createBusiness({ data: formData, token });
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Business registered successfully!',
                text2: 'Your submission is under review.',
            });
            setSubmissionState('reviewing');
            setHasExistingBusiness(true);
            setIsSubmittingLocal(false);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: error?.message || 'Failed to register business',
            });
            setIsSubmittingLocal(false);
        },
    });

    const pickImage = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Image Upload', 'Image upload is not supported in web preview. This would work on mobile devices.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    // --- Updated handleSubmit ---
    const handleSubmit = async (values: any) => {
        // Prevent double submission
        if (isSubmittingLocal || createBusinessMutation.isPending) {
            return;
        }

        try {
            // Allow resubmission if rejected, but prevent if approved or reviewing
            if (hasExistingBusiness && submissionState !== 'rejected') {
                Toast.show({
                    type: 'info',
                    text1: 'Business already registered',
                    text2: 'Please wait for approval or update your existing business.',
                });
                return;
            }
            
            // Set submitting state immediately to disable button
            setIsSubmittingLocal(true);
            
            const formData = new FormData();
            formData.append('business_name', values.businessName);
            formData.append('category', values.category);
            formData.append('address', values.address);
            formData.append('business_email', values.businessEmail);
            formData.append('business_phone', values.businessPhone);
            if (selectedImage) {
                // Guess filename and type from uri
                const uriParts = selectedImage.split('/');
                const name = uriParts[uriParts.length - 1] || 'photo.jpg';
                formData.append('photo', {
                    uri: selectedImage,
                    name,
                    type: 'image/jpeg',
                } as any);
            }
            createBusinessMutation.mutate(formData);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error?.message || 'Failed to register business',
            });
            setIsSubmittingLocal(false);
        }
    };

    const isSubmitting = isSubmittingLocal || createBusinessMutation.isPending;
    // Allow resubmission if rejected, but disable if approved or reviewing
    const isFormDisabled = (hasExistingBusiness && submissionState !== 'rejected') || isSubmitting;

    const getAlertStyle = () => {
        switch (submissionState) {
            case 'reviewing':
                return {
                    backgroundColor: '#FFF8E1',
                    borderColor: '#FFB300',
                    textColor: '#F57C00',
                };
            case 'rejected':
                return {
                    backgroundColor: '#FFEBEE',
                    borderColor: '#F44336',
                    textColor: '#D32F2F',
                };
            case 'approved':
                return {
                    backgroundColor: '#E8F5E8',
                    borderColor: '#4CAF50',
                    textColor: '#2E7D32',
                };
            default:
                return null;
        }
    };

    const getAlertMessage = () => {
        switch (submissionState) {
            case 'reviewing':
                return 'Your submission is under review. You will receive a confirmation mail soon.';
            case 'rejected':
                return 'Your submission was rejected due to unclear document upload, kindly upload a clear copy of your certificate';
            case 'approved':
                return 'Your business profile has been approved successfully!';
            default:
                return '';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: dark ? "black" : "white" }]}>
            <ThemedView darkColor='black' style={[styles.header, { borderBottomColor: dark ? "#181818" : "#f0f0f0" }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color={dark ? 'white' : "#333"} />
                </TouchableOpacity>
                <ThemeText style={styles.headerTitle}>Register Business</ThemeText>
            </ThemedView>

            <Formik
                initialValues={{
                    businessName: '',
                    category: '',
                    address: '',
                    businessEmail: '',
                    businessPhone: '',
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                    <>
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <View style={styles.form}>
                                {/* Business Name */}
                                <View style={styles.fieldContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            touched.businessName && errors.businessName && styles.inputError,
                                            {
                                                backgroundColor: dark ? "#181818" : "#f8f9fa",
                                                color: dark ? "white" : "black",
                                                borderColor: dark ? '#181818' : '#e0e0e0',
                                            },
                                            isFormDisabled && { opacity: 0.6 }
                                        ]}
                                        placeholder="Business name"
                                        placeholderTextColor="#999"
                                        value={values.businessName}
                                        onChangeText={handleChange('businessName')}
                                        onBlur={handleBlur('businessName')}
                                        editable={!isFormDisabled}
                                    />
                                    {touched.businessName && errors.businessName && (
                                        <Text style={styles.errorText}>{errors.businessName}</Text>
                                    )}
                                </View>

                                {/* Category Dropdown */}
                                <View style={styles.fieldContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.input,
                                            styles.dropdown,
                                            touched.category && errors.category && styles.inputError,
                                            {
                                                backgroundColor: dark ? "#181818" : "#f8f9fa",
                                                borderColor: dark ? '#181818' : '#e0e0e0',
                                            },
                                            isFormDisabled && { opacity: 0.6 }
                                        ]}
                                        onPress={() => !isFormDisabled && setShowCategoryDropdown(!showCategoryDropdown)}
                                        disabled={isFormDisabled}
                                    >
                                        <ThemeText style={[styles.dropdownText, !values.category && styles.placeholder]}>
                                            {values.category || 'Category'}
                                        </ThemeText>
                                        <Ionicons
                                            name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color="#666"
                                        />
                                    </TouchableOpacity>

                                    {showCategoryDropdown && (
                                        <ThemedView darkColor='#181818' style={[styles.dropdownMenu, {
                                            // {
                                            backgroundColor: dark ? "#181818" : "#f8f9fa",
                                            borderColor: dark ? '#181818' : '#e0e0e0',
                                            zIndex:100
                                            // }
                                        }]}>
                                            {categories.map((category, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[styles.dropdownItem, {
                                                        backgroundColor: dark ? "#181818" : "#f8f9fa",
                                                        borderColor: dark ? '#181818' : '#e0e0e0',
                                                    }]}
                                                    onPress={() => {
                                                        setFieldValue('category', category);
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    <ThemeText style={styles.dropdownItemText}>{category}</ThemeText>
                                                </TouchableOpacity>
                                            ))}
                                        </ThemedView>
                                    )}

                                    {touched.category && errors.category && (
                                        <Text style={styles.errorText}>{errors.category}</Text>
                                    )}
                                </View>

                                {/* Address */}
                                <View style={styles.fieldContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.textArea,
                                            touched.address && errors.address && styles.inputError,
                                            {
                                                backgroundColor:dark ? "#181818" : "#f8f9fa",
                                                color: dark ? "white" : "black",
                                                borderColor : dark? '#181818' : '#e0e0e0',
                                            },
                                            isFormDisabled && { opacity: 0.6 }
                                        ]}
                                        placeholder="Address"
                                        placeholderTextColor="#999"
                                        value={values.address}
                                        onChangeText={handleChange('address')}
                                        onBlur={handleBlur('address')}
                                        multiline
                                        numberOfLines={3}
                                        editable={!isFormDisabled}
                                    />
                                    {touched.address && errors.address && (
                                        <Text style={styles.errorText}>{errors.address}</Text>
                                    )}
                                </View>

                                {/* Business Email */}
                                <View style={styles.fieldContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            touched.businessEmail && errors.businessEmail && styles.inputError,
                                            {
                                                backgroundColor:dark ? "#181818" : "#f8f9fa",
                                                color: dark ? "white" : "black",
                                                borderColor : dark? '#181818' : '#e0e0e0',
                                            },
                                            isFormDisabled && { opacity: 0.6 }
                                        ]}
                                        placeholder="Business Email"
                                        placeholderTextColor="#999"
                                        value={values.businessEmail}
                                        onChangeText={handleChange('businessEmail')}
                                        onBlur={handleBlur('businessEmail')}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isFormDisabled}
                                    />
                                    {touched.businessEmail && errors.businessEmail && (
                                        <Text style={styles.errorText}>{errors.businessEmail}</Text>
                                    )}
                                </View>

                                {/* Business Phone */}
                                <View style={styles.fieldContainer}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            touched.businessPhone && errors.businessPhone && styles.inputError,
                                            {
                                                backgroundColor:dark ? "#181818" : "#f8f9fa",
                                                color: dark ? "white" : "black",
                                                borderColor : dark? '#181818' : '#e0e0e0',
                                            },
                                            isFormDisabled && { opacity: 0.6 }
                                        ]}
                                        placeholder="Business phone number"
                                        placeholderTextColor="#999"
                                        value={values.businessPhone}
                                        onChangeText={handleChange('businessPhone')}
                                        onBlur={handleBlur('businessPhone')}
                                        keyboardType="phone-pad"
                                        editable={!isFormDisabled}
                                    />
                                    {touched.businessPhone && errors.businessPhone && (
                                        <Text style={styles.errorText}>{errors.businessPhone}</Text>
                                    )}
                                </View>

                                {/* Document Upload */}
                                <ThemedView darkColor='#181818' style={styles.uploadContainer}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.uploadButton,
                                            {backgroundColor:dark? "#181818":"#f8f9fa"},
                                            isFormDisabled && { opacity: 0.6 }
                                        ]} 
                                        onPress={() => !isFormDisabled && pickImage()}
                                        disabled={isFormDisabled}
                                    >
                                        <Ionicons name="cloud-upload-outline" size={40} color="#ccc" />
                                        <Text style={styles.uploadText}>
                                            Upload a clear picture of your business certificate
                                        </Text>
                                    </TouchableOpacity>

                                    {selectedImage && (
                                        <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                                    )}
                                </ThemedView>

                                {/* Alert Messages */}
                                {submissionState !== 'idle' && (
                                    <View style={[styles.alertContainer, {
                                        backgroundColor: getAlertStyle()?.backgroundColor,
                                        borderColor: getAlertStyle()?.borderColor,
                                    }]}>
                                        <Ionicons
                                            name="warning-outline"
                                            size={20}
                                            color={getAlertStyle()?.textColor}
                                        />
                                        <Text style={[styles.alertText, { color: getAlertStyle()?.textColor }]}>
                                            {getAlertMessage()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    submissionState === 'approved' && styles.saveButtonSuccess,
                                    isFormDisabled && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                    if (!isFormDisabled) {
                                        handleSubmit(); // Formik's handleSubmit will call onSubmit with values
                                    }
                                }}
                                disabled={isFormDisabled}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isSubmitting
                                        ? 'Submitting...'
                                        : hasExistingBusiness
                                            ? submissionState === 'approved'
                                                ? 'Approved'
                                                : submissionState === 'rejected'
                                                    ? 'Rejected - Resubmit'
                                                    : 'Under Review'
                                            : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </Formik>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
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
    form: {
        padding: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    inputError: {
        borderColor: '#940304',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        // color: '#333',
    },
    placeholder: {
        color: '#999',
    },
    dropdownMenu: {
        // backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginTop: 5,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dropdownItem: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 16,
        // color: '#333',
    },
    uploadContainer: {
        marginBottom: 20,
    },
    uploadButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 40,
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    uploadedImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginTop: 10,
    },
    alertContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 20,
    },
    alertText: {
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
    errorText: {
        color: '#940304',
        fontSize: 12,
        marginTop: 5,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    saveButton: {
        backgroundColor: '#940304',
        borderRadius: 25,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonSuccess: {
        backgroundColor: '#4CAF50',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});