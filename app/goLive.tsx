import React, { useState, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

import Header from '@/components/Social/live/Header';
import StreamingCard from '@/components/Social/live/StreamingCard';
import DurationSelector from '@/components/Social/live/DurationSelector';
import SummaryModal from '@/components/Social/live/SummaryModal';
import LiveStreamingView from '@/components/Social/live/LiveStreamingView';
import BottomSheetMenu from '@/components/Social/live/BottomSheetMenu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

const dark = true; // You can change this to false for light theme

export default function HomeScreen() {
    const [selectedDuration, setSelectedDuration] = useState('15 Min');
    const [showSummary, setShowSummary] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [showDurationSelector, setShowDurationSelector] = useState(false);
    const bottomSheetRef = useRef<BottomSheet>(null);

    const handleDurationSelect = () => {
        setShowDurationSelector(true);
    };

    const handleSaveDuration = (duration: string) => {
        setSelectedDuration(duration);
        setShowDurationSelector(false);
    };

    const handleGoLive = () => {
        setShowSummary(true);
    };

    const handleProceed = () => {
        setShowSummary(false);
        setIsLive(true);
    };

    const handleEndLive = () => {
        setIsLive(false);
    };

    const handleThreeDotsPress = () => {
        bottomSheetRef.current?.expand();
    };

    const handleBottomSheetClose = () => {
        bottomSheetRef.current?.close();
    };

    const handleNavigateToListing = () => {
        bottomSheetRef.current?.close();
        router.push('/UserListing');
    };

    if (isLive) {
        return (
            <LiveStreamingView
                dark={dark}
                onEndLive={handleEndLive}
                onThreeDotsPress={handleThreeDotsPress}
            />
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: dark ? '#000000' : '#FFFFFF' }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <Header
                        dark={dark}
                        onThreeDotsPress={handleThreeDotsPress}
                    />

                    <StreamingCard
                        dark={dark}
                        selectedDuration={selectedDuration}
                        onDurationSelect={handleDurationSelect}
                        onGoLive={handleGoLive}
                    />

                    <DurationSelector
                        visible={showDurationSelector}
                        dark={dark}
                        selectedDuration={selectedDuration}
                        onSave={handleSaveDuration}
                        onClose={() => setShowDurationSelector(false)}
                        />

                    <SummaryModal
                        visible={showSummary}
                        dark={dark}
                        duration={selectedDuration}
                        onProceed={handleProceed}
                        onClose={() => setShowSummary(false)}
                    />

                    <BottomSheetMenu
                        ref={bottomSheetRef}
                        dark={dark}
                        onNavigateToListing={handleNavigateToListing}
                        onClose={handleBottomSheetClose}
                    />
                </SafeAreaView>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});