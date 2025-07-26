import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    Call,
    CallContent,
    useCallStateHooks,
    CallingState,
} from '@stream-io/video-react-native-sdk';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
// import { StreamAudioVideo } from '@stream-io/video-react-native-sdk';

const API_URL = 'https://gympaddy.hmstech.xyz/api/user';

export default function StreamIncomingCall() {
    const router = useRouter();
    const {
        receiver_id,
        call_id,
        call_type,
        caller_name = 'Unknown',
        caller_avatar = '',
    } = useLocalSearchParams();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    console.log("call type for incoming", call_type)
    // 🚀 useCallStateHooks - listens to lifecycle changes
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    // 🔊 Play ringtone when screen loads
    useEffect(() => {
        const playRingtone = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/music/audio.mp3')
            );
            setSound(sound);
            await sound.setIsLoopingAsync(true);
            await sound.playAsync();
        };

        playRingtone();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    // ✅ Track call lifecycle state (ex: LEFT, FAILED, etc.)
    useEffect(() => {
        if (!callingState) return;

        switch (callingState) {
            case CallingState.LEFT:
            case CallingState.RECONNECTING_FAILED:
                router.replace('/(tabs)');
                break;

            case CallingState.OFFLINE:
                Alert.alert('You are offline');
                break;

            case CallingState.RECONNECTING:
                console.log('Reconnecting to call...');
                break;

            case CallingState.MIGRATING:
                console.log('Migrating to new SFU node...');
                break;

            default:
                break;
        }
    }, [callingState]);

    // ✅ Accept call
    const handleAcceptCall = async () => {
        if (isJoining) return;
        setIsJoining(true);

        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
        }

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
            setClient(streamClient);
            setCall(callObj);
            setJoined(true);
        } catch (err: any) {
            Alert.alert('Failed to join call', err.message);
            setIsJoining(false);
            router.back();
        }
    };

    // ❌ Decline call
    const handleDecline = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
        }

        if (call) {
            await call.leave(); // ensure proper leave
        }

        router.replace('/');
    };
    const [isMuted, setIsMuted] = useState(false);

    const handleToggleMic = async () => {
        if (!call) return;
        try {
            if (isMuted) {
                await call.microphone.enable();   // Unmute
            } else {
                await call.microphone.disable();  // Mute
            }
            setIsMuted(!isMuted);
        } catch (error) {
            console.error('Failed to toggle mic:', error);
        }
    };


    // 🎥 Full call UI
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
                                        : require('../assets/icons/more/User.png')
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
                                    style={[styles.voiceBtn, { backgroundColor: '#F44336' }]}
                                    onPress={async () => {
                                        await call.leave();
                                        router.replace('/');
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

    // 📞 Incoming call UI
    return (
        <View style={styles.container}>
            <Image
                source={
                    caller_avatar
                        ? { uri: String(caller_avatar) }
                        : require('../assets/icons/more/User.png')
                }
                style={styles.avatar}
            />
            <Text style={styles.name}>{caller_name}</Text>
            <Text style={styles.callTypeText}>{String(call_type).toUpperCase()} CALL</Text>

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
    voiceCallContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    voiceButtons: {
        flexDirection: 'row',
        marginTop: 40,
        width: '100%',
        justifyContent: 'space-around',
    },
    voiceBtn: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    voiceBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    callTypeText: {
        fontSize: 18,
        color: '#bbb',
        marginTop: 8,
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 40,
        width: '100%',
        justifyContent: 'space-around',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    declineButton: {
        backgroundColor: '#F44336',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    acceptText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    declineText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
