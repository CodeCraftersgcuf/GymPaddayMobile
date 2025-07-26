import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ViewStyle,
    TextStyle,
    FlatList,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from '@/components/Social/Boost/colors';
import Header from '@/components/Social/Boost/Header';
import ProgressBar from '@/components/Social/Boost/ProgressBar';
import RadioButton from '@/components/Social/Boost/RadioButton';
import CustomSlider from '@/components/Social/Boost/CustomSlider';
import Button from '@/components/Social/Boost/Button';
import EditBudgetBottomSheet from '@/components/Social/Boost/EditBudgetBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/themeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';



const PostAudienceScreen: React.FC = () => {
    const { dark } = useTheme();
    const isDark = dark;
    const route = useRouter();
    const params = useLocalSearchParams();
    const theme = isDark ? colors.dark : colors.light;
    const bottomSheetRef = useRef<BottomSheet>(null);

    console.log("Raw params from useLocalSearchParams:", params);

    const {
        isEditable = false,
        boostType = '',
        campaign: rawCampaign = null,
        listing: rawListing = null,
        post: rawPost = null,
        post_id,
        image,
    } = params || {};

    // Parse campaign, listing, post if needed
    let campaign = rawCampaign;
    try {
        if (rawCampaign && typeof rawCampaign === "string") {
            campaign = JSON.parse(rawCampaign);
        }
    } catch (err) {
        console.warn("Could not parse campaign param:", rawCampaign, err);
    }

    let listing = rawListing;
    try {
        if (rawListing && typeof rawListing === "string") {
            listing = JSON.parse(rawListing);
        }
    } catch (err) {
        console.warn("Could not parse listing param:", rawListing, err);
    }

    let post = rawPost;
    try {
        if (rawPost && typeof rawPost === "string") {
            post = JSON.parse(rawPost);
        }
    } catch (err) {
        console.warn("Could not parse post param:", rawPost, err);
    }

    console.log("Decoded campaign:", campaign);
    console.log("Decoded listing:", listing);
    console.log("Decoded post:", post);

    // Helpers
    function safe(val: any, fallback: any) {
        return val !== undefined && val !== null ? val : fallback;
    }
    function normalizeGender(val: string | undefined): 'All' | 'Male' | 'Female' {
        if (!val) return 'All';
        const v = (val || '').toString().toLowerCase();
        if (v === 'male') return 'Male';
        if (v === 'female') return 'Female';
        return 'All';
    }

    const isEdit = !!isEditable && !!campaign;
    console.log("isEditable:", isEditable, "isEdit:", isEdit);

    const initialAudience = isEdit
        ? {
            gender: normalizeGender(safe(campaign.gender, 'all')),
            minAge: safe(campaign.age_min, 18),
            maxAge: safe(campaign.age_max, 65),
            budget: safe(
                campaign.daily_budget && Number(campaign.daily_budget) > 0 ? campaign.daily_budget : undefined,
                safe(campaign.budget, 2000)
            ),
            duration: safe(campaign.duration, 20),
            location: safe(campaign.location, ''),
        }
        : {
            gender: 'All',
            minAge: 18,
            maxAge: 65,
            budget: 2000,
            duration: 20,
            location: '',
        };
    // State hooks
    const [selectedGender, setSelectedGender] = useState<'All' | 'Male' | 'Female'>(initialAudience.gender);
    const [minAge, setMinAge] = useState<number>(initialAudience.minAge);
    const [maxAge, setMaxAge] = useState<number>(initialAudience.maxAge);
    const [budget, setBudget] = useState<number>(initialAudience.budget);
    const [duration, setDuration] = useState<number>(initialAudience.duration);
    const [location, setLocation] = useState<string>(initialAudience.location);
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        console.log("Audience state changed", {
            selectedGender,
            minAge,
            maxAge,
            budget,
            duration,
            location,
        });
    }, [selectedGender, minAge, maxAge, budget, duration, location]);

    // 6. Compose post/campaign id and isMarket flag
    const postId = post_id || (isEdit ? campaign.id : undefined);
    const isMarket = image ? true : boostType === 'listing';

    // 7. Navigation
    const handleNext = () => {
        route.push({
            pathname: '/BoostPostScreen_review',
            params: {
                audience: [
                    selectedGender,
                    minAge,
                    maxAge,
                    budget,
                    duration,
                    location,
                    postId,
                    isMarket
                ],
                isEditable,
                boostType,
                campaignId: postId,
            },
        });
    };

    const handleEditBudget = () => {
        bottomSheetRef.current?.expand();
    };

    const handleSaveBudget = (newBudget: number, newDuration: number) => {
        setBudget(newBudget);
        setDuration(newDuration);
    };

    const formatCurrency = (value: number) => `GP  ${value.toLocaleString()}`;
    const formatDuration = (value: number) => `${Math.round(value)} Days`;
    const fetchLocationSuggestions = async (query: string) => {
        try {
            if (query.length < 2) {
                setLocationSuggestions([]);
                return;
            }

            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    countrycodes: 'NG',
                    format: 'json',
                    limit: 5,
                },
                headers: {
                    // 👇 Set your app name and contact (as per OpenStreetMap's requirement)
                    'User-Agent': 'GymPaddyApp/1.0 (support@gympaddy.hmstech.xyz)',
                    'Accept-Language': 'en',
                },
            });


            setLocationSuggestions(res.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Location fetch error:', error);
            setLocationSuggestions([]);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Header
                    title="Post Audience"
                    onBack={() => route.back()}
                    isDark={isDark}
                />

                <ProgressBar progress={50} isDark={isDark} />

                <ScrollView style={styles.content}>
                    <Text style={[styles.subtitle, { color: theme.text }]}>
                        Get your post across several audiences
                    </Text>

                    {/* Location */}
                    <View style={styles.section}>
                        <View style={[styles.locationContainer, { backgroundColor: theme.surface }]}>
                            <TextInput
                                style={[styles.locationText, { color: theme.text, flex: 1 }]}
                                placeholder="Enter location in Nigeria"
                                placeholderTextColor={theme.textSecondary}
                                value={location}
                                onChangeText={(text) => {
                                    setLocation(text);
                                    fetchLocationSuggestions(text);
                                }}
                                onFocus={() => {
                                    if (location.length > 1) setShowSuggestions(true);
                                }}
                            />
                        </View>

                        {/* Suggestions Below Input */}
                        {showSuggestions && locationSuggestions.length > 0 && (
                            <View style={styles.suggestionWrapper}>
                                <FlatList
                                    data={locationSuggestions}
                                    keyExtractor={(item) => item.place_id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.suggestionItem}
                                            onPress={() => {
                                                setLocation(item.display_name);
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <Text style={{ color: theme.text }}>{item.display_name}</Text>
                                        </TouchableOpacity>
                                    )}
                                    keyboardShouldPersistTaps="handled"
                                />
                            </View>
                        )}
                    </View>

                    {/* Age */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Age - Minimum is 18, Maximum is 65
                        </Text>
                        <View style={styles.ageInputs}>
                            <TextInput
                                style={[styles.ageInput, { backgroundColor: theme.surface, color: theme.text }]}
                                placeholder="Min"
                                placeholderTextColor={theme.textSecondary}
                                value={minAge.toString()}
                                onChangeText={(text) => setMinAge(parseInt(text) || 18)}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={[styles.ageInput, { backgroundColor: theme.surface, color: theme.text }]}
                                placeholder="Max"
                                placeholderTextColor={theme.textSecondary}
                                value={maxAge.toString()}
                                onChangeText={(text) => setMaxAge(parseInt(text) || 65)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Gender</Text>
                        {['All', 'Male', 'Female'].map((gender) => (
                            <RadioButton
                                key={gender}
                                selected={selectedGender === gender}
                                onPress={() => setSelectedGender(gender as 'All' | 'Male' | 'Female')}
                                label={gender}
                                isDark={isDark}
                            />
                        ))}
                    </View>

                    {/* Budget & Duration */}
                    <View style={styles.section}>
                        <View style={styles.budgetHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Set your daily spending limit
                            </Text>
                            <TouchableOpacity onPress={handleEditBudget}>
                                <Icon name="edit" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <CustomSlider
                            label="Daily Budget"
                            value={budget}
                            onValueChange={setBudget}
                            minimumValue={2000}
                            maximumValue={50000}
                            isDark={isDark}
                            formatValue={formatCurrency}
                        />

                        <CustomSlider
                            label="Duration"
                            value={duration}
                            onValueChange={setDuration}
                            minimumValue={1}
                            maximumValue={30}
                            isDark={isDark}
                            formatValue={formatDuration}
                        />
                    </View>
                </ScrollView>

                <Button
                    title="Next"
                    onPress={handleNext}
                    isDark={isDark}
                />

                {/* <EditBudgetBottomSheet
                    ref={bottomSheetRef}
                    isDark={isDark}
                    budget={budget}
                    duration={duration}
                    onSave={handleSaveBudget}
                /> */}
            </View>
        </GestureHandlerRootView>
    );
};


type Styles = {
    container: ViewStyle;
    content: ViewStyle;
    subtitle: TextStyle;
    section: ViewStyle;
    sectionTitle: TextStyle;
    locationContainer: ViewStyle;
    locationText: TextStyle;
    ageInputs: ViewStyle;
    ageInput: TextStyle;
    budgetHeader: ViewStyle;
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 16,
    },
    suggestionWrapper: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 5,
        maxHeight: 150,
        borderWidth: 0.5,
        borderColor: '#ddd',
        elevation: 3,
        zIndex: 100,
    },

    suggestionItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderColor: '#eee',
    },

    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // padding: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 0.3,
        borderColor: '#E5E5E5'
    },
    locationText: {
        fontSize: 16,
    },
    ageInputs: {
        flexDirection: 'row',
        gap: 16,
    },
    ageInput: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 0.3
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
});

export default PostAudienceScreen;
