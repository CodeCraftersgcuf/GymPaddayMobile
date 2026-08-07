// Add to Story — camera or gallery picker (no MediaLibrary grid; works in Expo Go).

export const options = {
  headerShown: false,
};

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/themeContext';
import { useSafeBack } from '@/utils/hooks/useSafeBack';
import {
  STORY_VIDEO_MAX_SECONDS,
  needsStoryVideoTrim,
  storyVideoDurationSeconds,
} from '@/utils/storyVideoLimits';

const BRAND = '#C61F3A';

type StoryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
};

const pickerVideoOptions = {
  mediaTypes: ['images', 'videos'] as ('images' | 'videos')[],
  quality: 0.72,
  allowsEditing: true,
  aspect: [9, 16] as [number, number],
  videoMaxDuration: STORY_VIDEO_MAX_SECONDS,
  videoExportPreset: ImagePicker.VideoExportPreset.H264_960x540,
};

export default function AddToStoryScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const { dark } = useTheme();
  const [busy, setBusy] = useState<'camera' | 'gallery' | null>(null);

  const navigateWithAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset, prefix: string) => {
      const isVideo = asset.type === 'video';
      const durationSec = storyVideoDurationSeconds(asset.duration);

      if (isVideo && needsStoryVideoTrim(asset.duration)) {
        router.push({
          pathname: '/story-video-trim',
          params: {
            uri: asset.uri,
            duration: String(durationSec || STORY_VIDEO_MAX_SECONDS * 2),
            prefix,
          },
        });
        return;
      }

      const item: StoryAsset = {
        id: `${prefix}_${Date.now()}`,
        uri: asset.uri,
        mediaType: isVideo ? 'video' : 'photo',
      };
      router.push({
        pathname: '/story-preview',
        params: { selected: JSON.stringify([item]) },
      });
    },
    [router],
  );

  const openCamera = useCallback(async () => {
    if (busy) return;
    setBusy('camera');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera access needed',
          'Allow camera access in settings to capture photos and videos for your story.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync(pickerVideoOptions);

      if (!result.canceled && result.assets[0]) {
        navigateWithAsset(result.assets[0], 'cam');
      }
    } catch (err) {
      console.warn('Story camera error:', err);
      Alert.alert('Camera unavailable', 'Could not open the camera. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [busy, navigateWithAsset]);

  const openGallery = useCallback(async () => {
    if (busy) return;
    setBusy('gallery');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photos access needed',
          'Allow photo library access in settings to pick media for your story.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerVideoOptions);

      if (!result.canceled && result.assets[0]) {
        navigateWithAsset(result.assets[0], 'lib');
      }
    } catch (err) {
      console.warn('Story gallery error:', err);
      Alert.alert('Gallery unavailable', 'Could not open your photo library. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [busy, navigateWithAsset]);

  const bg = dark ? '#0d0d0d' : '#f8f8f8';
  const cardBg = dark ? '#1a1a1a' : '#fff';
  const textPrimary = dark ? '#fff' : '#111';
  const textSecondary = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? '#2a2a2a' : '#e5e7eb';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="close" size={28} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>New Story</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.hero}>
        <LinearGradient
          colors={['#9B1830', BRAND, '#7A1226']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroRing}
        >
          <View style={[styles.heroInner, { backgroundColor: bg }]}>
            <Ionicons name="add-circle" size={52} color={BRAND} />
          </View>
        </LinearGradient>
        <Text style={[styles.heroTitle, { color: textPrimary }]}>Share a moment</Text>
        <Text style={[styles.heroSubtitle, { color: textSecondary }]}>
          Capture something new or pick from your gallery
        </Text>
      </View>

      <View style={styles.options}>
        <Pressable
          onPress={openCamera}
          disabled={!!busy}
          style={({ pressed }) => [
            styles.optionCard,
            { backgroundColor: cardBg, borderColor: border },
            pressed && styles.optionPressed,
          ]}
        >
          <LinearGradient
            colors={['#1e3a5f', '#0f172a']}
            style={styles.optionIconWrap}
          >
            {busy === 'camera' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="camera" size={28} color="#fff" />
            )}
          </LinearGradient>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionTitle, { color: textPrimary }]}>Camera</Text>
            <Text style={[styles.optionDesc, { color: textSecondary }]}>
              Take a photo or record up to {STORY_VIDEO_MAX_SECONDS}s
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={textSecondary} />
        </Pressable>

        <Pressable
          onPress={openGallery}
          disabled={!!busy}
          style={({ pressed }) => [
            styles.optionCard,
            { backgroundColor: cardBg, borderColor: border },
            pressed && styles.optionPressed,
          ]}
        >
          <LinearGradient
            colors={['#4c1d95', '#312e81']}
            style={styles.optionIconWrap}
          >
            {busy === 'gallery' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="images" size={28} color="#fff" />
            )}
          </LinearGradient>
          <View style={styles.optionTextWrap}>
            <Text style={[styles.optionTitle, { color: textPrimary }]}>Gallery</Text>
            <Text style={[styles.optionDesc, { color: textSecondary }]}>
              Photos or videos (max {STORY_VIDEO_MAX_SECONDS}s — trim if longer)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: textSecondary }]}>
        Stories disappear after 24 hours · Videos max {STORY_VIDEO_MAX_SECONDS} seconds
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  heroRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  options: {
    paddingHorizontal: 20,
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  optionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  optionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 'auto',
    marginBottom: 28,
    paddingHorizontal: 24,
  },
});
