import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { images } from '@/constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export type VideoDetailModalProps = {
  visible: boolean;
  videoUrl: string | null;
  thumbnailUrl?: string | null;
  fallbackMp4Url?: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
};

export default function VideoDetailModal({
  visible,
  videoUrl,
  thumbnailUrl,
  fallbackMp4Url,
  isMuted,
  onToggleMute,
  onClose,
}: VideoDetailModalProps) {
  const videoRef = useRef<Video | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      setIsPlaying(true);
      setSourceUrl(null);
      videoRef.current?.pauseAsync().catch(() => {});
      return;
    }
    setSourceUrl(videoUrl);
  }, [visible, videoUrl]);

  useEffect(() => {
    if (!visible || !sourceUrl) return;
    const ref = videoRef.current;
    if (!ref) return;

    (async () => {
      try {
        await ref.loadAsync({ uri: sourceUrl }, { shouldPlay: true, isMuted }, false);
        setIsPlaying(true);
      } catch {
        if (fallbackMp4Url && sourceUrl !== fallbackMp4Url) {
          setSourceUrl(fallbackMp4Url);
        }
      }
    })();
  }, [visible, sourceUrl, isMuted, fallbackMp4Url]);

  useEffect(() => {
    videoRef.current?.setIsMutedAsync(isMuted).catch(() => {});
  }, [isMuted]);

  const togglePlayPause = useCallback(async () => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      const status = await ref.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await ref.pauseAsync();
        setIsPlaying(false);
      } else {
        await ref.playAsync();
        setIsPlaying(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsBuffering(Boolean(status.isBuffering));
    if ('isPlaying' in status) {
      setIsPlaying(status.isPlaying);
    }
  }, []);

  if (!visible || !videoUrl) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.root}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Pressable style={styles.videoStage} onPress={togglePlayPause}>
          {thumbnailUrl && !ready ? (
            <ExpoImage
              source={{ uri: thumbnailUrl }}
              style={styles.poster}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          ) : null}

          <Video
            ref={videoRef}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            isMuted={isMuted}
            shouldPlay={isPlaying}
            useNativeControls={false}
            onReadyForDisplay={() => setReady(true)}
            onPlaybackStatusUpdate={onStatus}
            onError={() => {
              if (fallbackMp4Url && sourceUrl !== fallbackMp4Url) {
                setSourceUrl(fallbackMp4Url);
              }
            }}
          />

          {isBuffering && !ready && (
            <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
          )}

          {!isPlaying && ready && (
            <View style={styles.playHint} pointerEvents="none">
              <Image source={images.playIcon} style={styles.playIcon} />
            </View>
          )}
        </Pressable>

        <TouchableOpacity style={styles.muteBtn} onPress={onToggleMute} hitSlop={10}>
          <Image
            source={isMuted ? images.mute : images.unmute}
            style={styles.muteIcon}
          />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 20,
    padding: 8,
  },
  videoStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_W,
    maxHeight: SCREEN_H,
  },
  video: {
    width: SCREEN_W,
    height: SCREEN_H * 0.85,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  spinner: {
    position: 'absolute',
  },
  playHint: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 36,
    padding: 16,
  },
  playIcon: {
    width: 36,
    height: 36,
    tintColor: '#fff',
  },
  muteBtn: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 24,
    padding: 10,
    zIndex: 20,
  },
  muteIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
});
