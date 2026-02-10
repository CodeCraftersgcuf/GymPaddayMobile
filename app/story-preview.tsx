import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { STORY_MUSIC_LIBRARY, MUSIC_CATEGORIES, getMusicByGenre, StoryMusic } from '@/constants/storyMusic';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const screenOptions = {
  headerShown: false,
};

export default function StoryPreview() {
  const { selected } = useLocalSearchParams();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMusicMap, setSelectedMusicMap] = useState<Record<number, StoryMusic>>({});
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch((err) => console.error('Audio mode error:', err));
  }, []);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  const mediaList = useMemo(() => {
    try {
      return selected ? JSON.parse(selected as string) : [];
    } catch (error) {
      console.warn('Failed to parse selected param:', error);
      return [];
    }
  }, [selected]);

  const currentMedia = mediaList[currentIndex];
  const isVideo = currentMedia?.mediaType === 'video';

  // Filter music based on search and category
  const filteredMusic = useMemo(() => {
    try {
      let music = getMusicByGenre(selectedCategory);
      if (!Array.isArray(music)) {
        console.error('getMusicByGenre returned non-array:', music);
        return [];
      }
      
      if (musicSearchQuery.trim()) {
        const query = musicSearchQuery.toLowerCase().trim();
        music = music.filter(
          (m) => {
            if (!m || !m.title || !m.artist) return false;
            return (
              m.title.toLowerCase().includes(query) ||
              m.artist.toLowerCase().includes(query)
            );
          }
        );
      }
      
      console.log('🎵 Filtered music:', music.length, 'items for category:', selectedCategory, 'search:', musicSearchQuery);
      return music;
    } catch (error) {
      console.error('Error filtering music:', error);
      return [];
    }
  }, [selectedCategory, musicSearchQuery]);

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (!currentMedia) return;
    progressAnim.setValue(1);
    if (isVideo && videoRef.current) {
      videoRef.current.setPositionAsync(0);
    }

    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }

    // Optional: auto-play selected music on story open
    const currentMusic = selectedMusicMap[currentIndex];
    if (currentMusic?.preview) {
      Audio.Sound.createAsync(
        { uri: currentMusic.preview },
        { shouldPlay: true }
      ).then(({ sound: newSound }) => {
        setSound(newSound);
      }).catch(console.error);
    }
  }, [currentIndex]);

  const handleMusicSelect = async (item: StoryMusic) => {
    if (!item || !item.id || !item.title) {
      console.error('Invalid music item:', item);
      Toast.show({
        type: 'error',
        text1: 'Invalid music',
        text2: 'Please select a valid music track',
      });
      return;
    }

    try {
      // Stop any currently playing sound
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Silently ignore cleanup errors
          if (__DEV__) {
            console.warn('Error stopping previous sound:', e);
          }
        }
        setSound(null);
      }

      // Try to play preview, but don't block music selection if it fails
      if (item.preview && item.preview.trim()) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: item.preview },
            { shouldPlay: true, volume: 0.5 }
          );
          setSound(newSound);
          console.log('✅ Music preview playing:', item.title);
        } catch (previewError: any) {
          // Only log non-network errors
          const errorMessage = previewError?.message || String(previewError);
          const isNetworkError = 
            errorMessage.includes('UnknownHostException') ||
            errorMessage.includes('Unable to resolve host') ||
            errorMessage.includes('Network request failed') ||
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('HttpDataSourceException') ||
            errorMessage.includes('404') ||
            errorMessage.includes('403');
          
          if (!isNetworkError && __DEV__) {
            console.warn('Preview playback failed (non-network error):', previewError);
          }
          // Continue even if preview fails - network errors are expected
        }
      } else {
        console.warn('Music item has no preview URL:', item);
      }

      // Always add music to story, regardless of preview success
      setSelectedMusicMap((prev) => ({
        ...prev,
        [currentIndex]: item,
      }));
      setShowMusicPicker(false);
      Toast.show({ 
        type: 'success', 
        text1: '🎵 Music Added', 
        text2: `${item.title} by ${item.artist || 'Unknown Artist'}`,
        visibilityTime: 1500,
      });
    } catch (err: any) {
      console.error('Unexpected error in handleMusicSelect:', err);
      // Still try to add the music even if there's an error
      setSelectedMusicMap((prev) => ({
        ...prev,
        [currentIndex]: item,
      }));
      setShowMusicPicker(false);
      Toast.show({ 
        type: 'success', 
        text1: '🎵 Music Added', 
        text2: `${item.title} by ${item.artist || 'Unknown Artist'}`,
        visibilityTime: 1500,
      });
    }
  };

  const removeMusicFromStory = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setSelectedMusicMap((prev) => {
      const newMap = { ...prev };
      delete newMap[currentIndex];
      return newMap;
    });
    Toast.show({ 
      type: 'info', 
      text1: 'Music Removed',
      visibilityTime: 1000,
    });
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('User not authenticated.');

      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i];
        const formData = new FormData();
        formData.append('media', {
          uri: media.uri,
          name: `story_${media.id}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}`,
          type: media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        } as any);
        formData.append('media_type', media.mediaType);
        formData.append('caption', '');

        if (selectedMusicMap[i] && selectedMusicMap[i].title && selectedMusicMap[i].preview) {
          console.log(selectedMusicMap[i], "selected music");
          formData.append('music_title', selectedMusicMap[i].title);
          formData.append('music_url', selectedMusicMap[i].preview);
          if (selectedMusicMap[i].artist) {
            formData.append('music_artist', selectedMusicMap[i].artist);
          }
        }

        const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/stories', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          Toast.show({ type: 'error', text1: 'Upload failed', text2: result?.message || 'Unknown error' });
          setIsUploading(false);
          return;
        }
      }

      Toast.show({ type: 'success', text1: 'Stories uploaded!' });
      setIsUploading(false);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setIsUploading(false);
    }
  };

  if (!mediaList.length) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: 'white', fontSize: 16 }}>No media selected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {mediaList.map((_: any, index: number) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                index === currentIndex && { flex: progressAnim, backgroundColor: '#940304' },
                index < currentIndex && { flex: 1, backgroundColor: '#FFFFFF' },
                index > currentIndex && { flex: 0, backgroundColor: 'transparent' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setShowMusicPicker(true)}
          >
            <Ionicons name="musical-notes" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Media Display */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <Video
            ref={videoRef}
            source={{ uri: currentMedia.uri }}
            style={styles.video}
            resizeMode={"cover" as any}
            isMuted={false}
            shouldPlay={true}
            useNativeControls={false}
          />
        ) : (
          <Image source={{ uri: currentMedia.uri }} style={styles.image} resizeMode="cover" />
        )}
        
        {/* Tap Zones for Navigation */}
        <TouchableOpacity 
          style={styles.leftTapZone} 
          onPress={handleBack}
          activeOpacity={1}
        />
        <TouchableOpacity 
          style={styles.rightTapZone} 
          onPress={handleNext}
          activeOpacity={1}
        />
      </View>

      {/* Music Indicator */}
      {selectedMusicMap[currentIndex] && (
        <View style={styles.musicIndicator}>
          <Ionicons name="musical-note" size={16} color="#fff" />
          <Text style={styles.musicIndicatorText} numberOfLines={1}>
            {selectedMusicMap[currentIndex].title} - {selectedMusicMap[currentIndex].artist}
          </Text>
          <TouchableOpacity onPress={removeMusicFromStory} style={styles.removeMusicBtn}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Button */}
      {isUploading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading your story...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.uploadButtonText}>Share to Story</Text>
        </TouchableOpacity>
      )}

      {/* Music Picker Modal */}
      <Modal
        visible={showMusicPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMusicPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={styles.musicPickerModal}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Music</Text>
              <TouchableOpacity onPress={() => setShowMusicPicker(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for music..."
                placeholderTextColor="#999"
                value={musicSearchQuery}
                onChangeText={(text) => {
                  try {
                    setMusicSearchQuery(text || '');
                  } catch (error) {
                    console.error('Error updating search query:', error);
                    setMusicSearchQuery('');
                  }
                }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {musicSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMusicSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
              {MUSIC_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat.id && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name.replace(/[^\w\s]/gi, '').trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Music List - FlatList outside ScrollView for proper scrolling */}
            <FlatList
              data={filteredMusic}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.musicList}
              style={styles.musicListContainer}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.musicItemLarge,
                    selectedMusicMap[currentIndex]?.id === item.id && styles.musicItemSelected,
                  ]}
                  onPress={() => handleMusicSelect(item)}
                >
                  <View style={styles.musicItemLeft}>
                    <Ionicons name="musical-notes" size={24} color="#940304" />
                    <View style={styles.musicInfo}>
                      <Text style={styles.musicTitleLarge} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.musicArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                  </View>
                  {selectedMusicMap[currentIndex]?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#940304" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="sad-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No music found</Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    height: 3,
    zIndex: 100,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
  },
  headerActions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 101,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
    resizeMode: 'cover',
  },
  video: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '35%',
    zIndex: 10,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '35%',
    zIndex: 10,
  },
  musicIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  musicIndicatorText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  removeMusicBtn: {
    padding: 4,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#940304',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  musicPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoryScroll: {
    marginTop: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
    minHeight: 44,
  },
  categoryTabActive: {
    backgroundColor: '#940304',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  categoryTextActive: {
    color: '#fff',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  musicListContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.5, // Limit height to allow scrolling
  },
  musicListContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.5, // Limit height to allow scrolling
  },
  musicList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  musicItemLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  musicItemSelected: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#940304',
  },
  musicItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicTitleLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  musicArtist: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});
