import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';

interface Props {
  role: 'host' | 'audience';
  uid: number;
  remoteUid: number | null;
}

const VideoRenderer = ({ role, uid, remoteUid }: Props) => {
  const shouldShowLocal = role === 'host';
  const shouldShowRemote = role === 'audience' && remoteUid !== null;

  return (
    <View style={styles.container}>
      {shouldShowLocal && (
        <View style={styles.videoWrapper}>
          <RtcSurfaceView
            style={styles.video}
            canvas={{
              uid: 0, // Safe default for local preview (host)
              renderMode: 1,
              mirrorMode: 0,
            }}
          />
          <Text style={styles.label}>You (Host)</Text>
        </View>
      )}

      {shouldShowRemote && (
        <View style={styles.videoWrapper}>
          <RtcSurfaceView
            style={styles.video}
            canvas={{
              uid: remoteUid!,
              renderMode: 1,
              mirrorMode: 0,
            }}
          />
          <Text style={styles.label}>Live Stream</Text>
        </View>
      )}

      {!shouldShowLocal && !shouldShowRemote && (
        <View style={styles.waiting}>
          <Text style={styles.waitingText}>Waiting for stream to start...</Text>
        </View>
      )}
    </View>
  );
};

export default VideoRenderer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  label: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  waiting: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: '#888',
    fontSize: 16,
  },
});
