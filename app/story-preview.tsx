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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const screenOptions = {
  headerShown: false,
};

export default function StoryPreview() {
  const { selected } = useLocalSearchParams();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicList, setMusicList] = useState([]);
  const [selectedMusicMap, setSelectedMusicMap] = useState({});
  const [sound, setSound] = useState(null);
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

  useEffect(() => {
    fetch('https://api.deezer.com/chart/0/tracks')
      .then((res) => res.json())
      .then((data) => {
        const tracks = data.data.slice(0, 2).map((track) => ({
          title: track.title,
          artist: track.artist.name,
          preview: track.preview,
          cover: track.album.cover_small,
        }));
        setMusicList(tracks);
      });
  }, []);

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

  const handleMusicSelect = async (item) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.preview },
        { shouldPlay: true }
      );

      setSound(newSound);
      setSelectedMusicMap((prev) => ({
        ...prev,
        [currentIndex]: item,
      }));
    } catch (err) {
      console.error('Sound playback error:', err);
    }
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

        if (selectedMusicMap[i]) {
          formData.append('music_title', selectedMusicMap[i].title);
          formData.append('music_url', selectedMusicMap[i].preview);
        }

        const response = await fetch('https://gympaddy.hmstech.xyz/api/user/stories', {
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
      <View style={styles.progressContainer}>
        {mediaList.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[styles.progressBarFill,
                index === currentIndex && { flex: progressAnim, backgroundColor: '#FF0000' },
                index < currentIndex && { flex: 1, backgroundColor: '#FFFFFF' },
                index > currentIndex && { flex: 0, backgroundColor: '#FFFFFF' },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.mediaContainer}>
        {isVideo ? (
          <Video
            ref={videoRef}
            source={{ uri: currentMedia.uri }}
            style={styles.video}
            resizeMode="cover"
            isMuted={false}
            shouldPlay={true}
            useNativeControls
          />
        ) : (
          <Image source={{ uri: currentMedia.uri }} style={styles.image} />
        )}
        <TouchableOpacity style={styles.leftTapZone} onPress={handleBack} />
        <TouchableOpacity style={styles.rightTapZone} onPress={handleNext} />
      </View>

      {musicList.length > 0 && (
        <View style={styles.musicPicker}>
          <Text style={styles.musicTitle}>🎵 Add Music:</Text>
          <FlatList
            horizontal
            data={musicList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.musicItem,
                  selectedMusicMap[currentIndex]?.preview === item.preview && styles.selectedMusic,
                ]}
                onPress={() => handleMusicSelect(item)}
              >
                <Image source={{ uri: item.cover }} style={styles.musicCover} />
                <Text style={styles.musicText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isUploading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>Uploading...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Text style={styles.uploadButtonText}>Upload All</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  progressContainer: {
    flexDirection: 'row', position: 'absolute', top: 10, left: 10, right: 10, height: 4, zIndex: 100, gap: 5,
  },
  progressBarBackground: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#fff', height: 4,
  },
  mediaContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH, height: '100%', resizeMode: 'cover',
  },
  video: {
    width: SCREEN_WIDTH, height: '100%',
  },
 leftTapZone: {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: '25%', // avoids blocking music picker area
  width: '30%',
  zIndex: 10,
},

rightTapZone: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: '25%',
  width: '30%',
  zIndex: 10,
},

  musicPicker: {
    position: 'absolute', bottom: 100, paddingVertical: 8, paddingLeft: 10,
  },
  musicTitle: {
    color: '#fff', fontSize: 14, marginBottom: 6, fontWeight: '600',
  },
  musicItem: {
    marginRight: 10, alignItems: 'center',
  },
  selectedMusic: {
    borderColor: '#FF0000', borderWidth: 2, borderRadius: 6,
  },
  musicCover: {
    width: 50, height: 50, borderRadius: 6, marginBottom: 4,
  },
  musicText: {
    color: '#fff', fontSize: 12,
  },
  uploadButton: {
    position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#FF0000', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff', fontWeight: '600', fontSize: 16,
  },
  loaderWrapper: {
    position: 'absolute', bottom: 30, alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },
});
