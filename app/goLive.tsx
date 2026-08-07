import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

import Header from '@/components/Social/live/Header';
import StreamingCard from '@/components/Social/live/StreamingCard';
import DurationSelector from '@/components/Social/live/DurationSelector';
import SummaryModal from '@/components/Social/live/SummaryModal';
import LiveStreamingView from '@/components/Social/live/LiveStreamingView';
import BuyMinutesSheet from '@/components/Social/live/BuyMinutesSheet';
import BuySuccessModal from '@/components/Social/live/BuySuccessModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { createLiveStream } from '@/utils/mutations/live';
import uuid from 'react-native-uuid';
import { Camera } from 'expo-camera';

import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { LIVE_STREAM_API_BASE, LIVE_STREAM_PUBLIC_BASE } from '@/utils/liveStreamConstants';

export default function GoLiveScreen() {
    const { dark } = useTheme();
    const queryClient = useQueryClient();
    const [selectedDuration, setSelectedDuration] = useState('15 Min');
    const [showSummary, setShowSummary] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [showDurationSelector, setShowDurationSelector] = useState(false);
    const [showBuySuccess, setShowBuySuccess] = useState(false);
    const [boughtMinutes, setBoughtMinutes] = useState('');
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [channelInfo, setChannelInfo] = useState<{ title: string; agora_channel: string, id?: string } | null>(null);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const handleProceed = async () => {
        try {
            setShowSummary(false);
            // Ask for mic+camera at OS level before WebView (WebView will not prompt itself).
            const cam = await Camera.requestCameraPermissionsAsync();
            const mic = await Camera.requestMicrophonePermissionsAsync();
            if (cam.status !== 'granted' || mic.status !== 'granted') {
              setCameraEnabled(true);
              alert(
                cam.status !== 'granted' && mic.status !== 'granted'
                  ? 'Please allow camera and microphone access to go live.'
                  : cam.status !== 'granted'
                    ? 'Please allow camera access to go live.'
                    : 'Please allow microphone access to go live.',
              );
              return;
            }

            // Fully release expo-camera before Agora WebView getUserMedia.
            setCameraEnabled(false);
            await new Promise((r) => setTimeout(r, 800));

            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('No token');

            const randomChannel = uuid.v4().toString().slice(0, 8); // e.g. '9f1b1c8a'

            const payload = {
                title: 'Morning Workout Live',
                agora_channel: randomChannel,
            };

            const res = await createLiveStream(payload, token);
            const stream = (res as any)?.data ?? res;

            setChannelInfo({
                title: stream.title,
                agora_channel: stream.agora_channel,
                id: stream.id != null ? String(stream.id) : undefined,
            });

            queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
            await new Promise((r) => setTimeout(r, 200));
            setIsLive(true);
        } catch (err: any) {
            console.error('Error creating live stream:', err);
            setCameraEnabled(true);
            const message = err?.message || 'Failed to go live. Try again.';
            alert(message);
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
    const handleEndLive = async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token && channelInfo?.id) {
                const res = await fetch(
                    `${LIVE_STREAM_API_BASE}/live-streams/${channelInfo.id}/end-host`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                        },
                    }
                );
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    console.warn('end-host failed:', errBody);
                }
            }
            if (channelInfo?.agora_channel) {
                const ch = encodeURIComponent(channelInfo.agora_channel);
                await fetch(`${LIVE_STREAM_PUBLIC_BASE}/live-streams/end/${ch}`, {
                    method: 'GET',
                }).catch(() => {});
            }
            queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
        } catch (e) {
            console.error('handleEndLive', e);
        } finally {
            setIsLive(false);
            setChannelInfo(null);
            setCameraEnabled(true);
        }
    };
    const handleBuyPress = () => {
        // buySheetRef.current?.expand();
        setShowBuyModal(true);
    };
    const handleBuy = async (amount: string) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('Token not found');

            const response = await fetch('https://api.gympaddy.com/api/user/minutes/purchase', {
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
                selectedDuration={selectedDuration}
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
                    cameraEnabled={cameraEnabled}
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