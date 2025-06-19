import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';


export default function OnboardingScreen() {
    const router = useRouter();
    const { dark } = useTheme();
    const isDark = dark;
    const handleProceed = () => {
        router.replace('/(tabs)');
    };

    const handleClose = () => {
        // Handle close action
        router.back();
    };

    const theme = {
        background: isDark ? '#000000' : '#FFFFFF',
        cardBackground: isDark ? '#181818' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#000000',
        textSecondary: isDark ? '#CCCCCC' : '#666666',
        buttonBackground: isDark ? '#FFFFFF' : '#000000',
        buttonText: isDark ? '#000000' : '#FFFFFF',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ImageBackground
                source={{
                    uri: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                }}
                style={styles.backgroundImage}
                blurRadius={3}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <AntDesign name="close" size={24} color={"#FFFFFF"} />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <Text style={styles.title}>Your Perfect Marketplace</Text>
                        <Text style={styles.description}>
                            Buy, Sell and trade gym equipments, and other items for free on our marketplace.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.proceedButton, { backgroundColor: theme.buttonBackground }]}
                        onPress={handleProceed}
                    >
                        <Text style={[styles.proceedButtonText, { color: theme.buttonText }]}>
                            Proceed
                        </Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    closeButton: {
        alignSelf: 'flex-end',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: '300',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.9,
    },
    proceedButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    proceedButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});