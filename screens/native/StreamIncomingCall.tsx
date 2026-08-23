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
import * as Notifications from 'expo-notifications';
import { startCallRingtone, stopCallRingtone } from '@/utils/callRingtone';
import { onCallEnded } from '@/utils/callEvents';
import { endStreamCall, getStreamCallStatus, isCallInactive } from '@/utils/streamCalls';
import { teardownStreamCall } from '@/utils/teardownStreamCall';
import CallEndWatcher from '@/components/CallEndWatcher';

const API_URL = 'https://api.gympaddy.com/api/user';

export default function StreamIncomingCall() {
    const router = useRouter();
    const {
        call_id,
        call_type,
        caller_name = 'Unknown',
        caller_avatar = '',
    } = useLocalSearchParams();

    const callIdRaw = Array.isArray(call_id) ? call_id[0] : call_id;
    const callId = String(callIdRaw || '');
    const callTypeRaw = Array.isArray(call_type) ? call_type[0] : call_type;
    const callType = String(callTypeRaw || 'voice');
    const callerName = String(Array.isArray(caller_name) ? caller_name[0] : caller_name || 'Unknown');
    const callerAvatar = String(Array.isArray(caller_avatar) ? caller_avatar[0] : caller_avatar || '');
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const callRef = useRef<Call | null>(null);
    const clientRef = useRef<StreamVideoClient | null>(null);
    callRef.current = call;
    clientRef.current = client;
    const leavingRef = useRef(false);

    const leaveScreen = async (endForEveryone = false) => {
        if (leavingRef.current) return;
        leavingRef.current = true;
        // Stop ringtone first (sync generation bump) before any other await.
        await stopCallRingtone();
        try {
            await Notifications.dismissAllNotificationsAsync();
        } catch {
            /* ignore */
        }
        await teardownStreamCall({
            call: callRef.current,
            client: clientRef.current,
            endForEveryone,
        });
        setCall(null);
        setClient(null);
        router.replace('/(tabs)');
    };

    useEffect(() => {
        let cancelled = false;
        startCallRingtone().catch(() => {});
        const unsub = onCallEnded((payload) => {
            if (cancelled) return;
            if (!payload.callId || payload.callId === callId) {
                stopCallRingtone().catch(() => {});
                leaveScreen(false);
            }
        });
        return () => {
            cancelled = true;
            unsub();
            // Always kill ringtone on unmount — covers accept, decline, hangup, navigate away.
            stopCallRingtone().catch(() => {});
            if (!leavingRef.current) {
                teardownStreamCall({
                    call: callRef.current,
                    client: clientRef.current,
                    endForEveryone: false,
                }).catch(() => {});
            }
        };
    }, [callId]);

    useEffect(() => {
        if (!callId || joined) return;
        let cancelled = false;
        const poll = async () => {
            const status = await getStreamCallStatus(callId);
            if (!cancelled && isCallInactive(status)) {
                await leaveScreen();
            }
        };
        poll();
        const timer = setInterval(poll, 2000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [callId, joined]);

    const handleAcceptCall = async () => {
        if (isJoining) return;
        setIsJoining(true);
        await stopCallRingtone();

        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) throw new Error('User not authenticated');

            const res = await fetch(`${API_URL}/stream-join-call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ call_id: callId }),
            });

            const result = await res.json();
            if (res.status === 410 || isCallInactive(result?.status)) {
                Alert.alert('Call ended', 'The caller already hung up.');
                await leaveScreen();
                return;
            }
            if (!res.ok) throw new Error(result.message || result.error || 'Failed to accept call');

            const { token: streamToken, user_id } = result;

            const streamClient = new StreamVideoClient({
                apiKey: '298uez2pm5kq',
                user: {
                    id: String(user_id),
                    name: `User ${user_id}`,
                },
                token: streamToken,
            });
            const normalizedCallType = callType.toLowerCase();
            const streamCallType = normalizedCallType === 'video' ? 'default' : 'audio_room';
            const callObj = streamClient.call(streamCallType, callId);

            await callObj.join({
                create: false,
                video: normalizedCallType === 'video',
            });

            if (normalizedCallType !== 'video') {
                await callObj.microphone.enable();
            }

            callObj.on('call.ended', () => {
                leaveScreen();
            });

            setClient(streamClient);
            setCall(callObj);
            setJoined(true);
        } catch (err: any) {
            Alert.alert('Failed to join call', err.message);
            setIsJoining(false);
            await leaveScreen();
        }
    };

    const handleDecline = async () => {
        if (callId) await endStreamCall(callId);
        await leaveScreen(false);
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
        const isVideoCall = callType.toLowerCase() === 'video';

        return (
            <StreamVideo client={client}>
                <StreamCall call={call}>
                    <CallEndWatcher
                        onEnded={async () => {
                            await leaveScreen(false);
                        }}
                    />
                    {isVideoCall ? (
                        <CallContent
                            onHangupCallHandler={async () => {
                                if (callId) {
                                    await endStreamCall(callId).catch(() => {});
                                }
                                // Stream Hangup already left; force full media teardown + disconnect.
                                await leaveScreen(false);
                            }}
                        />
                    ) : (
                        <View style={styles.voiceCallContainer}>
                            <Image
                                source={
                                    callerAvatar
                                        ? { uri: callerAvatar }
                                        : require('../../assets/icons/more/User.png')
                                }
                                style={styles.avatar}
                            />
                            <Text style={styles.name}>{callerName}</Text>
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
                                        if (callId) await endStreamCall(callId);
                                        await leaveScreen(true);
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
                    callerAvatar
                        ? { uri: callerAvatar }
                        : require('../../assets/icons/more/User.png')
                }
                style={styles.avatar}
            />
            <Text style={styles.name}>{callerName}</Text>
            <Text style={styles.callTypeText}>{callType.toUpperCase()} CALL</Text>
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
