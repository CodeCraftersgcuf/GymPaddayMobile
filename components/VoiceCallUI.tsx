import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function VoiceCallUI({
  callerName,
  callerAvatar,
  onEndCall,
  onToggleMic,
  onToggleSpeaker,
  isMuted,
  isSpeakerOn,
}: {
  callerName: string;
  callerAvatar: string;
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  isMuted: boolean;
  isSpeakerOn: boolean;
}) {
  return (
    <View style={styles.container}>
      <Image
        source={
          callerAvatar
            ? { uri: callerAvatar }
            : require('../assets/icons/more/User.png')
        }
        style={styles.avatar}
      />
      <Text style={styles.name}>{callerName}</Text>
      <Text style={styles.status}>Connected…</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onToggleMic}>
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={onToggleSpeaker}>
          <Text style={styles.controlText}>
            {isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.endCall]} onPress={onEndCall}>
          <Text style={styles.controlText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
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
  status: {
    fontSize: 16,
    color: '#aaa',
    marginVertical: 10,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 40,
  },
  controlButton: {
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginHorizontal: 8,
  },
  controlText: {
    color: '#fff',
    fontWeight: '600',
  },
  endCall: {
    backgroundColor: '#FF3B30',
  },
});
