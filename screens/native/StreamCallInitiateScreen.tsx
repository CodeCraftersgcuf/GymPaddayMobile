import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    StreamVideoClient,
    StreamVideo,
    StreamCall,
    Call,
} from '@stream-io/video-react-native-sdk';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import CallScreen from '@/components/CallScreen';
import CallEndWatcher from '@/components/CallEndWatcher';
import { endStreamCall } from '@/utils/streamCalls';
import { teardownStreamCall } from '@/utils/teardownStreamCall';

const API_URL = 'https://api.gympaddy.com/api/user';

export default function StreamCallInitiateScreen() {
    const router = useRouter();
    const {
        receiver_id,
        call_type,
        receiver_name = 'User',
        receiver_avatar = '',
    } = useLocalSearchParams<{
        receiver_id: string;
        call_type: string;
        receiver_name?: string;
        receiver_avatar?: string;
    }>();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [callId, setCallId] = useState<string>('');
    const leavingRef = useRef(false);
    const clientRef = useRef<StreamVideoClient | null>(null);
    const callRef = useRef<Call | null>(null);
    clientRef.current = client;
    callRef.current = call;

    // //   const { useRemoteParticipants } = useCallStateHooks();
    // //   const remoteParticipants = useRemoteParticipants();
    // //   console.log("remote participante",remoteParticipants)

    //   const receiverJoined = remoteParticipants.length > 0;
console.log("call type for outgoing",call_type)

    useEffect(() => {
        const startCall = async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) throw new Error('User not authenticated');

                const res = await fetch(`${API_URL}/stream-start-call`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        receiver_id,
                        call_type,
                    }),
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.message || 'Failed to start call');

                const { call_id, token: streamToken, user_id } = result;
                setCallId(String(call_id));

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

                const callObj = streamClient.call(streamCallType, call_id);

                await callObj.join({
                    create: true,
                    // audio: true,
                    video: call_type === 'video',
                });

                  if (call_type !== 'video') {
                await callObj.microphone.enable();
            }
                callObj.on('call.ended', () => {
                    // Must tear down media — navigating alone leaves ghost audio.
                    if (leavingRef.current) return;
                    leavingRef.current = true;
                    teardownStreamCall({
                        call: callObj,
                        client: streamClient,
                        endForEveryone: false,
                    })
                        .catch(() => {})
                        .finally(() => {
                            setCall(null);
                            setClient(null);
                            router.replace('/(tabs)');
                        });
                });

                setClient(streamClient);
                setCall(callObj);
            } catch (err: any) {
                Alert.alert('Call Failed', err.message);
                router.back();
            }
        };

        startCall();

        return () => {
            if (leavingRef.current) return;
            leavingRef.current = true;
            teardownStreamCall({
                call: callRef.current,
                client: clientRef.current,
                endForEveryone: false,
            }).catch(() => {});
        };
    }, []);

    const hangUp = async (endForEveryone = true) => {
        if (leavingRef.current) return;
        leavingRef.current = true;
        const id = callId || String(callRef.current?.id || '');
        try {
            if (id) await endStreamCall(id);
        } catch {
            /* still hang up locally */
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

    const handleEndCall = async () => {
        try {
            await hangUp(true);
        } catch (error) {
            console.error('Error ending call:', error);
            router.replace('/(tabs)');
        }
    };

    /** Remote already left — don't call end() again; just drop local media. */
    const handleRemoteEnded = async () => {
        try {
            await hangUp(false);
        } catch {
            router.replace('/(tabs)');
        }
    };

    if (!client || !call) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.loaderText}>Initializing Call...</Text>
            </View>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallEndWatcher onEnded={handleRemoteEnded} />
                <CallScreen
                call_type={call_type}
                    receiver_avatar={receiver_avatar}
                    receiver_name={receiver_name}
                    onEndCall={handleEndCall}
                />
                {/* <CallContent /> */}
            </StreamCall>
        </StreamVideo>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        color: '#fff',
        fontSize: 16,
    },
    gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        marginBottom: 20,
        borderWidth: 5,
        borderColor: 'white',
    },
    nameText: {
        fontSize: 22,
        color: 'white',
        fontWeight: '600',
    },
    callingText: {
        fontSize: 16,
        color: '#eee',
        marginTop: 10,
    },
    endCallButton: {
        marginTop: 30,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: '#C61F3A',
    },
    endCallText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
