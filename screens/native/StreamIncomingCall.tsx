import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    Call,
    CallContent,
} from '@stream-io/video-react-native-sdk';
import * as SecureStore from 'expo-secure-store';
import { startCallRingtone, stopCallRingtone } from '@/utils/callRingtone';

const API_URL = 'https://api.gympaddy.com/api/user';

export default function StreamIncomingCall() {
    const router = useRouter();
    const {
        call_id,
        call_type,
        caller_name = 'Unknown',
        caller_avatar = '',
    } = useLocalSearchParams();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const ringingRef = useRef(true);

    // Ringtone must start as soon as this screen opens (before Stream join).
    useEffect(() => {
        ringingRef.current = true;
        startCallRingtone().catch(() => {});
        return () => {
            ringingRef.current = false;
            stopCallRingtone().catch(() => {});
        };
    }, []);

    const stopRinging = async () => {
        ringingRef.current = false;
        await stopCallRingtone();
    };

    const handleAcceptCall = async () => {
        if (isJoining) return;
        setIsJoining(true);
        await stopRinging();

        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('User not authenticated');

            const res = await fetch(`${API_URL}/stream-join-call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ call_id }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to accept call');

            const { token: streamToken, user_id } = result;

            const streamClient = new StreamVideoClient({
                apiKey: '298uez2pm5kq',
                user: {
                    id: String(user_id),
                    name: `User ${user_id}`,
                },
                token: streamToken,
            });
            const normalizedCallType = String(call_type).toLowerCase();
            const streamCallType = normalizedCallType === 'video' ? 'default' : 'audio_room';
            const callObj = streamClient.call(streamCallType, String(call_id));

            await callObj.join({
                create: false,
                video: call_type === 'video',
            });

            if (call_type !== 'video') {
                await callObj.microphone.enable();
            }

            callObj.on('call.ended', () => {
                router.replace('/(tabs)');
            });

            setClient(streamClient);
            setCall(callObj);
            setJoined(true);
        } catch (err: any) {
            Alert.alert('Failed to join call', err.message);
            setIsJoining(false);
            router.back();
        }
    };

    const handleDecline = async () => {
        await stopRinging();
        try {
            if (call) await call.leave();
        } catch {
            /* ignore */
        }
        router.replace('/(tabs)');
    };

    const handleToggleMic = async () => {
        if (!call) return;
        try {
            if (isMuted) {
                await call.microphone.enable();
            } else {
                await call.microphone.disable();
            }
            setIsMuted(!isMuted);
        } catch (error) {
            console.error('Failed to toggle mic:', error);
        }
    };

    if (joined && client && call) {
        const isVideoCall = String(call_type).toLowerCase() === 'video';

        return (
            <StreamVideo client={client}>
                <StreamCall call={call}>
                    {isVideoCall ? (
                        <CallContent />
                    ) : (
                        <View style={styles.voiceCallContainer}>
                            <Image
                                source={
                                    caller_avatar
                                        ? { uri: String(caller_avatar) }
                                        : require('../../assets/icons/more/User.png')
                                }
                                style={styles.avatar}
                            />
                            <Text style={styles.name}>{caller_name}</Text>
                            <Text style={styles.callTypeText}>VOICE CALL</Text>

                            <View style={styles.voiceButtons}>
                                <TouchableOpacity style={styles.voiceBtn} onPress={handleToggleMic}>
                                    <Text style={styles.voiceBtnText}>
                                        {isMuted ? 'Unmute' : 'Mute'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.voiceBtn, { backgroundColor: '#C61F3A' }]}
                                    onPress={async () => {
                                        await call.leave();
                                        router.replace('/(tabs)');
                                    }}
                                >
                                    <Text style={styles.voiceBtnText}>End</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </StreamCall>
            </StreamVideo>
        );
    }

    return (
        <View style={styles.container}>
            <Image
                source={
                    caller_avatar
                        ? { uri: String(caller_avatar) }
                        : require('../../assets/icons/more/User.png')
                }
                style={styles.avatar}
            />
            <Text style={styles.name}>{caller_name}</Text>
            <Text style={styles.callTypeText}>{String(call_type).toUpperCase()} CALL</Text>
            <Text style={styles.ringingHint}>Incoming call…</Text>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.acceptButton, isJoining && { opacity: 0.5 }]}
                    onPress={handleAcceptCall}
                    disabled={isJoining}
                >
                    <Text style={styles.acceptText}>{isJoining ? 'Joining...' : 'Accept'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
                    <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        marginBottom: 20,
        borderWidth: 4,
        borderColor: '#fff',
    },
    name: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    callTypeText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 8,
        letterSpacing: 1,
    },
    ringingHint: {
        color: '#C61F3A',
        fontSize: 15,
        marginBottom: 36,
    },
    buttons: {
        flexDirection: 'row',
        gap: 16,
    },
    acceptButton: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 28,
    },
    declineButton: {
        backgroundColor: '#C61F3A',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 28,
    },
    acceptText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    declineText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    voiceCallContainer: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    voiceButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 40,
    },
    voiceBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 28,
    },
    voiceBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
