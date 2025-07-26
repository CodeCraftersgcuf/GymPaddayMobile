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
import { createLiveStream } from '@/utils/mutations/live';
// import { v4 as uuidv4 } from 'uuid'; // npm i uuid
import uuid from 'react-native-uuid';

import * as SecureStore from 'expo-secure-store';
export default function HomeScreen() {
    const { dark } = useTheme();
    const [selectedDuration, setSelectedDuration] = useState('15 Min');
    const [showSummary, setShowSummary] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [showDurationSelector, setShowDurationSelector] = useState(false);
    const [showBuySuccess, setShowBuySuccess] = useState(false);
    const [boughtMinutes, setBoughtMinutes] = useState('');
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [channelInfo, setChannelInfo] = useState<{ title: string; agora_channel: string, id?: string } | null>(null);

    const handleProceed = async () => {
        try {
            setShowSummary(false);
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('No token');

            const randomChannel = uuid.v4().toString().slice(0, 8); // e.g. '9f1b1c8a'

            const payload = {
                title: 'Morning Workout Live',
                agora_channel: randomChannel,
            };

            const res = await createLiveStream(payload, token);

            setChannelInfo({
                title: res.title,
                agora_channel: res.agora_channel,
                id: res.id
            });

            setIsLive(true); // will trigger LiveStreamingView
        } catch (err) {
            console.error('Error creating live stream:', err);
            alert('Failed to go live. Try again.');
        }
    };
    const handleDurationSelect = () => setShowDurationSelector(true);
    const handleSaveDuration = (duration: string) => {
        setSelectedDuration(duration);
        setShowDurationSelector(false);
    };
    const handleGoLive = () => setShowSummary(true);
    // const handleProceed = () => {
    //     setShowSummary(false);
    //     setIsLive(true);
    // };
    const handleEndLive = () => setIsLive(false);
    const handleBuyPress = () => {
        // buySheetRef.current?.expand();
        setShowBuyModal(true);
    };
    const handleBuy = async (amount: string) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('Token not found');

            const response = await fetch('https://gympaddy.hmstech.xyz/api/user/minutes/purchase', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ minutes: Number(amount) }), // send as number
            });

            if (!response.ok) {
                const errRes = await response.json();
                console.error('❌ Purchase failed:', errRes);
                alert('Purchase failed: ' + (errRes.message || 'Unknown error'));
                return;
            }

            const data = await response.json();
            console.log('✅ Purchase successful:', data);

            setShowBuyModal(false);
            setBoughtMinutes(amount);
            setShowBuySuccess(true);
        } catch (error) {
            console.error('❌ Error purchasing minutes:', error);
            alert('Error purchasing minutes. Please try again.');
        }
    };
    const handleCloseBuySuccess = () => setShowBuySuccess(false);

    if (isLive) {
        return (
            <LiveStreamingView
                dark={dark}
                livestreamId={channelInfo?.id}
                channelName={channelInfo?.agora_channel}
                onEndLive={handleEndLive}
                onThreeDotsPress={() => { }}
            />
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: dark ? '#000000' : '#FFFFFF' }]}>
            <SafeAreaView style={{ flex: 1 }} >
                <Header
                    dark={dark}
                    onThreeDotsPress={() => { }}
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