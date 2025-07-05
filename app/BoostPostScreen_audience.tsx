import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ViewStyle,
    TextStyle,
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



const PostAudienceScreen: React.FC = () => {
    const { dark } = useTheme();
    const isDark = dark;
    const route = useRouter();
    const params = useLocalSearchParams();
    const theme = isDark ? colors.dark : colors.light;
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [selectedGender, setSelectedGender] = useState<'All' | 'Male' | 'Female'>('All');
    const [minAge, setMinAge] = useState<number>(18);
    const [maxAge, setMaxAge] = useState<number>(65);
    const [budget, setBudget] = useState<number>(2000);
    const [duration, setDuration] = useState<number>(20);
    const [location, setLocation] = useState<string>('');
    // Get post_id from route params
    let { post_id } = params || {};
    console.log("Post Audience Screen post_id:", post_id);
    const postId = post_id;

    const handleNext = () => {
        // Use a valid route path and pass audience as an array if required
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
                ],
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

    const formatCurrency = (value: number) => `N ${value.toLocaleString()}`;
    const formatDuration = (value: number) => `${Math.round(value)} Days`;

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
    
                    <View style={styles.section}>
                        <View style={[styles.locationContainer, { backgroundColor: theme.surface }]}>
                            {/* <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text> */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[styles.locationText, { color: theme.text, flex: 1 }]}
                                    placeholder="Select Location"
                                    placeholderTextColor={theme.textSecondary}
                                    value={location}
                                    onChangeText={setLocation}
                                />
                                {/* <Icon name="keyboard-arrow-down" size={24} color={theme.textSecondary} /> */}
                            </View>
                        </View>
                    </View>
    
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
    
                <EditBudgetBottomSheet
                    ref={bottomSheetRef}
                    isDark={isDark}
                    budget={budget}
                    duration={duration}
                    onSave={handleSaveBudget}
                />
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
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
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
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
});

export default PostAudienceScreen;
