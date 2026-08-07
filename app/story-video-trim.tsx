import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { STORY_VIDEO_MAX_SECONDS } from '@/utils/storyVideoLimits';

const BRAND = '#C61F3A';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function StoryVideoTrimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    duration?: string;
    prefix?: string;
  }>();

  const uri = typeof params.uri === 'string' ? params.uri : '';
  const reportedDuration = Number(params.duration) || 0;
  const prefix = typeof params.prefix === 'string' ? params.prefix : 'trim';

  const videoRef = useRef<Video>(null);
  const [duration, setDuration] = useState(reportedDuration);
  const [start, setStart] = useState(0);
  const [ready, setReady] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  const maxStart = Math.max(0, duration - STORY_VIDEO_MAX_SECONDS);
  const end = Math.min(duration, start + STORY_VIDEO_MAX_SECONDS);
  const clipLength = Math.min(STORY_VIDEO_MAX_SECONDS, Math.max(0, end - start));

  useEffect(() => {
    if (!uri) router.back();
  }, [uri, router]);

  const onStatus = useCallback(
    async (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.durationMillis && status.durationMillis > 0) {
        const secs = status.durationMillis / 1000;
        setDuration((prev) => (prev > 0 ? prev : secs));
        setReady(true);
      }
      // Loop within the selected 30s window while previewing.
      if (
        !scrubbing &&
        status.positionMillis != null &&
        status.durationMillis != null &&
        status.isPlaying
      ) {
        const pos = status.positionMillis / 1000;
        if (pos >= end - 0.05) {
          await videoRef.current?.setPositionAsync(start * 1000);
        }
      }
    },
    [end, scrubbing, start],
  );

  const onStartChange = useCallback(
    async (value: number) => {
      const next = Math.min(maxStart, Math.max(0, value));
      setStart(next);
      try {
        await videoRef.current?.setPositionAsync(next * 1000);
      } catch {
        /* ignore seek errors */
      }
    },
    [maxStart],
  );

  const confirm = useCallback(() => {
    const item = {
      id: `${prefix}_${Date.now()}`,
      uri,
      mediaType: 'video' as const,
      trimStart: Number(start.toFixed(2)),
      trimDuration: Number(clipLength.toFixed(2)),
    };
    router.replace({
      pathname: '/story-preview',
      params: { selected: JSON.stringify([item]) },
    });
  }, [clipLength, prefix, router, start, uri]);

  if (!uri) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trim to {STORY_VIDEO_MAX_SECONDS}s</Text>
        <TouchableOpacity onPress={confirm} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playerWrap}>
        {!ready && (
          <ActivityIndicator color="#fff" style={StyleSheet.absoluteFillObject} />
        )}
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={onStatus}
        />
      </View>

      <View style={styles.controls}>
        <Text style={styles.hint}>
          Drag to choose which {STORY_VIDEO_MAX_SECONDS} seconds to keep
        </Text>
        <Text style={styles.range}>
          {formatTime(start)} – {formatTime(end)} ({formatTime(clipLength)})
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.max(maxStart, 0.01)}
          value={start}
          onSlidingStart={() => setScrubbing(true)}
          onSlidingComplete={async (v) => {
            setScrubbing(false);
            await onStartChange(v);
            try {
              await videoRef.current?.playAsync();
            } catch {
              /* ignore */
            }
          }}
          onValueChange={(v) => {
            setStart(Math.min(maxStart, Math.max(0, v)));
          }}
          minimumTrackTintColor={BRAND}
          maximumTrackTintColor="#444"
          thumbTintColor={BRAND}
        />
        <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmText}>Use this clip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    minWidth: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneText: {
    color: BRAND,
    fontSize: 16,
    fontWeight: '700',
  },
  playerWrap: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
    backgroundColor: '#0a0a0a',
  },
  hint: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  range: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
