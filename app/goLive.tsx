import React, { useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

import Header from '@/components/Social/live/Header';
import StreamingCard from '@/components/Social/live/StreamingCard';
import DurationSelector from '@/components/Social/live/DurationSelector';
import SummaryModal from '@/components/Social/live/SummaryModal';
import LiveStreamingView from '@/components/Social/live/LiveStreamingView';
// import BottomSheetMenu from '@/components/Social/live/BottomSheetMenu';
import BuyMinutesSheet from '@/components/Social/live/BuyMinutesSheet';
import BuySuccessModal from '@/components/Social/live/BuySuccessModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useTheme } from '@/contexts/themeContext';

export default function HomeScreen() {
    const { dark } = useTheme();
    const [selectedDuration, setSelectedDuration] = useState('15 Min');
    const [showSummary, setShowSummary] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [showDurationSelector, setShowDurationSelector] = useState(false);
    const [showBuySuccess, setShowBuySuccess] = useState(false);
    const [boughtMinutes, setBoughtMinutes] = useState('');
    const [showBuyModal, setShowBuyModal] = useState(false);

    const handleDurationSelect = () => setShowDurationSelector(true);
    const handleSaveDuration = (duration: string) => {
        setSelectedDuration(duration);
        setShowDurationSelector(false);
    };
    const handleGoLive = () => setShowSummary(true);
    const handleProceed = () => {
        setShowSummary(false);
        setIsLive(true);
    };
    const handleEndLive = () => setIsLive(false);
    const handleBuyPress = () => {
        // buySheetRef.current?.expand();
        setShowBuyModal(true);
    };
    const handleBuy = (amount: string) => {
        setShowBuyModal(false);
        setBoughtMinutes(amount);
        setShowBuySuccess(true);
    };
    const handleCloseBuySuccess = () => setShowBuySuccess(false);

    if (isLive) {
        return (
            <LiveStreamingView
                dark={dark}
                onEndLive={handleEndLive}
                onThreeDotsPress={()=>{}}
            />
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: dark ? '#000000' : '#FFFFFF' }]}>
            <SafeAreaView style={{ flex: 1 }} >
                <Header
                    dark={dark}
                    onThreeDotsPress={()=>{}}
                />
                <StreamingCard
                    dark={dark}
                    selectedDuration={selectedDuration}
                    onDurationSelect={handleDurationSelect}
                    onGoLive={handleGoLive}
                    onBuyMinutes={handleBuyPress}
                />
                <SummaryModal
                    visible={showSummary}
                    dark={dark}
                    duration={selectedDuration}
                    onProceed={handleProceed}
                    onClose={() => setShowSummary(false)}
                />
                <DurationSelector
                    visible={showDurationSelector}
                    dark={dark}
                    selectedDuration={selectedDuration}
                    onSave={handleSaveDuration}
                    onClose={() => setShowDurationSelector(false)}
                />
                <BuyMinutesSheet
                    visible={showBuyModal}
                    dark={dark}
                    onBuy={handleBuy}
                    onClose={() => setShowBuyModal(false)}
                />
                <BuySuccessModal
                    visible={showBuySuccess}
                    dark={dark}
                    minutes={boughtMinutes}
                    onClose={handleCloseBuySuccess}
                />
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});