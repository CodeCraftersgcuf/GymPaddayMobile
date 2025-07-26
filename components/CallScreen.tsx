import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { CallContent, useCall, useCallStateHooks } from '@stream-io/video-react-native-sdk';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function CallScreen({
    receiver_avatar,
    receiver_name,
    call_type,
    onEndCall,
}: {
    receiver_avatar: string;
    receiver_name: string;
    call_type: string;
    onEndCall: () => void;
}) {
    console.log("call type",call_type)
    const { useRemoteParticipants } = useCallStateHooks();
    const remoteParticipants = useRemoteParticipants();
    const call = useCall();
    const router = useRouter();

    const receiverJoined = remoteParticipants.length > 0;
    const isAudio = call_type?.toLowerCase() === 'voice';
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!call) return;

        const unsubscribe = call.on('call.ended', () => {
            router.back();
        });

        return () => unsubscribe?.();
    }, [call]);

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
            console.error('Error toggling mic:', error);
        }
    };

    if (!call) return null;

    if (!receiverJoined) {
        return (
            <LinearGradient
                colors={['#FF0000', '#C800A1', '#4A00FF']}
                style={styles.gradientBackground}
            >
                <Image
                    source={
                        receiver_avatar
                            ? { uri: receiver_avatar }
                            : require('../assets/icons/more/User.png')
                    }
                    style={styles.avatar}
                />
                <Text style={styles.nameText}>{receiver_name}</Text>
                <Text style={styles.callingText}>Calling…</Text>
                <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
                    <Text style={styles.endCallText}>End Call</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    if (isAudio) {
        return (
            <View style={styles.voiceCallContainer}>
                <Image
                    source={
                        receiver_avatar
                            ? { uri: receiver_avatar }
                            : require('../assets/icons/more/User.png')
                    }
                    style={styles.avatar}
                />
                <Text style={styles.nameText}>{receiver_name}</Text>
                <Text style={styles.callingText}>Connected</Text>

                <View style={styles.voiceButtons}>
                    <TouchableOpacity style={styles.voiceBtn} onPress={handleToggleMic}>
                        <Text style={styles.voiceBtnText}>
                            {isMuted ? 'Unmute' : 'Mute'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.voiceBtn, { backgroundColor: '#F44336' }]}
                        onPress={onEndCall}
                    >
                        <Text style={styles.voiceBtnText}>End</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return <CallContent />;
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

})