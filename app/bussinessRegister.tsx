import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';

const benefits = [
    'Get the best services on gym paddy with business',
    'Access to premium business tools and analytics',
    'Priority customer support and assistance',
    'Enhanced visibility in search results',
    'Advanced business profile customization',
];

export default function BusinessUpgradeScreen() {
    const { dark } = useTheme();
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color={dark ? 'white' : "#333"} />
                </TouchableOpacity>
                <ThemeText style={styles.headerTitle}>Register Business</ThemeText>
            </ThemedView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#FFE4E1', '#FFF0F5']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.upgradeSection}>
                        <Text style={styles.upgradeTitle}>
                            Upgrade to a <Text style={styles.businessText}>Business</Text> Profile
                        </Text>
                        <Text style={styles.upgradeSubtitle}>
                            With a business profile, you get the following benefits
                        </Text>

                        <ThemedView darkColor='#181818' style={styles.benefitsContainer}>
                            {benefits.map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <View style={styles.benefitNumber}>
                                        <Text style={styles.benefitNumberText}>{index + 1}</Text>
                                    </View>
                                    <ThemeText style={styles.benefitText}>{benefit}</ThemeText>
                                </View>
                            ))}
                        </ThemedView>
                    </View>
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.upgradeButton}
                            onPress={() => router.push('/bussinessForm')}
                        >
                            <Text style={styles.upgradeButtonText}>Upgrade to business</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
    gradientBackground: {
        flex: 1,
        minHeight: 500,
    },
    upgradeSection: {
        padding: 20,
        paddingTop: 60,
    },
    upgradeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    businessText: {
        color: '#FF0000',
    },
    upgradeSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    benefitsContainer: {
        // backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    benefitNumber: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    benefitNumberText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    benefitText: {
        fontSize: 16,
        // color: '#333',
        flex: 1,
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        paddingBottom: 30,
    },
    upgradeButton: {
        backgroundColor: '#FF0000',
        borderRadius: 15,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    upgradeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});