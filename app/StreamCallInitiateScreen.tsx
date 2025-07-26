import React, { useEffect, useState } from 'react';
import { View, Text, Image, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    StreamVideoClient,
    StreamVideo,
    StreamCall,
    Call,
    CallContent,
    useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import CallScreen from '@/components/CallScreen';

const API_URL = 'https://gympaddy.hmstech.xyz/api/user';

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
                    router.replace('/');
                });

                setClient(streamClient);
                setCall(callObj);
            } catch (err: any) {
                Alert.alert('Call Failed', err.message);
                router.back();
            }
        };

        startCall();
    }, []);

    const handleEndCall = async () => {
        try {
            await call?.leave();
            router.back();
        } catch (error) {
            console.error('Error ending call:', error);
            Alert.alert('Failed to end call');
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
        backgroundColor: '#FF3B30',
    },
    endCallText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
