// app/voice-call.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    createAgoraRtcEngine,
    IRtcEngine,
    ChannelProfileType,
    ClientRoleType,
} from 'react-native-agora';

const APP_ID = '2fae578d9eef4fe19df335eb67227571'; // Replace with yours
const BACKEND_API = 'https://gympaddy.hmstech.xyz/api/video-call/token'; // Laravel route

export default function VoiceCallScreen() {
    const engineRef = useRef<IRtcEngine | null>(null);
    const [joined, setJoined] = useState(false);
    const [uiud] = useState(() => Math.floor(Math.random() * 1000000));
    const router = useRouter();

    // Read params from URL
    const { channelName, uid, type } = useLocalSearchParams<{
        channelName?: string;
        uid?: string;
        type?: 'caller' | 'receiver';
    }>();

    const parsedUid = uid ? parseInt(uid) : undefined;

    const onEnd = () => {
        router.back();
    };

    const initAgora = async () => {
        try {
            if (!channelName || !parsedUid) {
                throw new Error('Missing channelName or uid');
            }

            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    throw new Error('Microphone permission not granted');
                }
            }

            const tokenRes = await fetch(`${BACKEND_API}?channel=${channelName}&uid=${parsedUid}`);
            const { token } = await tokenRes.json();
            console.log('Agora token:', token);

            const engine = createAgoraRtcEngine();
            engine.initialize({
                appId: APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
            });
            engineRef.current = engine;

            engine.registerEventHandler({
                onJoinChannelSuccess: (channel, uid, elapsed) => {
                    console.log(`✅ Joined channel: ${channel}, UID: ${uid}, elapsed: ${elapsed}`);
                    setJoined(true);
                },
                onUserJoined: (remoteUid, elapsed) => {
                    console.log(`👤 Remote user joined: ${remoteUid}, elapsed: ${elapsed}`);
                },
                onUserOffline: (remoteUid, reason) => {
                    console.log(`🚪 Remote user left: ${remoteUid}, reason: ${reason}`);
                    onEnd();
                },
                onError: (errCode) => {
                    console.error('❌ Agora Error:', errCode);
                    Alert.alert('Agora Error', `Code: ${errCode}`);
                },
            });

            engine.enableAudio();
            engine.setEnableSpeakerphone(true);
            engine.setDefaultAudioRouteToSpeakerphone(true);

            engine.joinChannel({
                token,
                channelId: channelName,
                uid: parsedUid,
                options: { clientRoleType: ClientRoleType.ClientRoleBroadcaster },
            });
        } catch (err) {
            console.error('Failed to init agora', err);
            Alert.alert('Error', err.message);
            onEnd();
        }
    };

    const leaveCall = async () => {
        try {
            await engineRef.current?.leaveChannel();
            engineRef.current?.release();
            engineRef.current = null;
        } catch (e) {
            console.error('Error leaving call', e);
        }
    };

    useEffect(() => {
        console.log('VoiceCallScreen mounted with channel:', channelName, 'uid:', parsedUid, 'uiud:', uiud, 'type:', type);
        initAgora();
        return () => {
            leaveCall();
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {joined ? 'Connected' : 'Joining call...'}
            </Text>
            <TouchableOpacity style={styles.endButton} onPress={leaveCall}>
                <Text style={styles.buttonText}>End Call</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    text: { color: '#fff', fontSize: 22, marginBottom: 20 },
    endButton: { backgroundColor: 'red', padding: 16, borderRadius: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});
