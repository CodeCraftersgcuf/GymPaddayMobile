import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PendingPost, PendingPostStatus } from '@/utils/pendingPosts';

type Props = {
  item: PendingPost;
  dark?: boolean;
  onDismiss?: () => void;
};

function stepIndex(status: PendingPostStatus): number {
  if (status === 'uploading') return 0;
  if (status === 'processing') return 1;
  if (status === 'failed') return -1;
  return 2;
}

function statusLabel(item: PendingPost): string {
  switch (item.status) {
    case 'uploading':
      if (item.uploadProgress != null && item.uploadProgress > 0) {
        return `Uploading your post… ${item.uploadProgress}%`;
      }
      return 'Starting upload…';
    case 'processing':
      return 'Uploading to feed — almost live';
    case 'failed':
      return item.errorMessage || 'Upload failed. Please try again.';
    default:
      return 'Processing…';
  }
}

export default function PendingPostProgressCard({ item, dark = false, onDismiss }: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const activeStep = stepIndex(item.status);
  const progress =
    item.status === 'uploading'
      ? Math.max(item.uploadProgress ?? 0, 3)
      : item.status === 'processing'
        ? 100
        : 0;

  useEffect(() => {
    if (item.status === 'failed') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [item.status, pulse]);

  const steps = [
    { key: 'upload', label: 'Uploading' },
    { key: 'process', label: 'Processing' },
    { key: 'live', label: 'Live' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: dark ? '#111' : '#fff', borderColor: dark ? '#333' : '#eee' }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: dark ? '#333' : '#ddd' }]}>
          <Ionicons name="cloud-upload-outline" size={18} color={dark ? '#aaa' : '#666'} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: dark ? '#fff' : '#111' }]}>Your post</Text>
          <Text style={[styles.subtitle, { color: dark ? '#aaa' : '#666' }]}>{statusLabel(item)}</Text>
        </View>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} hitSlop={12} style={styles.dismissBtn}>
            <Ionicons name="close" size={18} color={dark ? '#aaa' : '#666'} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.mediaWrap, { backgroundColor: dark ? '#1a1a1a' : '#f0f0f0' }]}>
        <Animated.View style={{ opacity: item.status === 'failed' ? 1 : pulse }}>
          <Ionicons
            name={
              item.status === 'failed'
                ? 'alert-circle-outline'
                : item.status === 'processing'
                  ? 'hourglass-outline'
                  : 'videocam-outline'
            }
            size={40}
            color={item.status === 'failed' ? '#C61F3A' : dark ? '#666' : '#999'}
          />
        </Animated.View>
      </View>

      {item.caption ? (
        <Text style={[styles.caption, { color: dark ? '#ddd' : '#333' }]} numberOfLines={2}>
          {item.caption}
        </Text>
      ) : null}

      <View style={[styles.progressTrack, { backgroundColor: dark ? '#333' : '#e8e8e8' }]}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
      </View>

      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const done = activeStep > index;
          const active = activeStep === index;
          const failed = item.status === 'failed' && index === 0;
          return (
            <View key={step.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  active && styles.stepDotActive,
                  failed && styles.stepDotFailed,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : active ? (
                  <View style={styles.stepDotInner} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: dark ? '#888' : '#999' },
                  (done || active) && { color: dark ? '#fff' : '#111', fontWeight: '600' },
                ]}
              >
                {step.label}
              </Text>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  dismissBtn: {
    padding: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  mediaWrap: {
    borderRadius: 10,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  caption: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#C61F3A',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: '#C61F3A',
    borderColor: '#C61F3A',
  },
  stepDotActive: {
    borderColor: '#C61F3A',
  },
  stepDotFailed: {
    borderColor: '#C61F3A',
    backgroundColor: '#C61F3A',
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C61F3A',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 11,
    left: '55%',
    right: '-45%',
    height: 2,
    backgroundColor: '#ddd',
    zIndex: 0,
  },
  stepLineDone: {
    backgroundColor: '#C61F3A',
  },
});
