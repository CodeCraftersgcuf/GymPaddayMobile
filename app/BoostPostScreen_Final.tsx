import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from '@/components/Social/Boost/colors';
import Header from '@/components/Social/Boost/Header';
import ProgressBar from '@/components/Social/Boost/ProgressBar';
import PostPreview from '@/components/Social/Boost/PostPreview';
import Button from '@/components/Social/Boost/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';

// Replace with your actual stack definition
type RootStackParamList = {
    BoostSuccess: undefined;
    BoostPost: undefined;
};


const BoostSuccessScreen: React.FC = () => {
    const { dark } = useTheme();
    const isDark = dark;
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useRouter();

    const handleHome = () => {
        navigation.push('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Boost Post" onBack={() => navigation.back()} isDark={isDark} />
            <ProgressBar progress={100} isDark={isDark} />

            <ScrollView style={styles.content}>
                <View style={[styles.alertContainer, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
                    <Icon name="warning" size={24} color="#FF9800" />
                    <Text style={[styles.alertText, { color: '#856404' }]}>
                        Your boosted post is currently under review, you will receive a confirmation mail soon
                    </Text>
                </View>

                <PostPreview isDark={isDark} />
            </ScrollView>

            <Button title="Home" onPress={handleHome} isDark={isDark} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    alertContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 8,
        borderWidth: 1,
    },
    alertText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default BoostSuccessScreen;
