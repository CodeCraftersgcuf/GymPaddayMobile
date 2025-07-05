import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import * as SecureStore from 'expo-secure-store'; // if you're storing token
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// ✅ 👇 This must be OUTSIDE the component
export const screenOptions = {
    headerShown: false,
};
export default function StoryPreview() {
    const { selected } = useLocalSearchParams();
    const router = useRouter();
const [isUploading, setIsUploading] = useState(false);

    const mediaList = useMemo(() => {
        try {
            return selected ? JSON.parse(selected as string) : [];
        } catch (error) {
            console.warn('Failed to parse selected param:', error);
            return [];
        }
    }, [selected]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const videoRef = useRef<Video>(null);

    const currentMedia = mediaList[currentIndex];
    const isVideo = currentMedia?.mediaType === 'video';

    const handleNext = () => {
        if (currentIndex < mediaList.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            router.back(); // Close viewer
        }
    };
useEffect(() => {
    if (!currentMedia || isUploading) return; // ✅ prevent running animation during upload

    progressAnim.setValue(0);

    const duration = isVideo ? 5000 : 3000;

    const animation = Animated.timing(progressAnim, {
        toValue: 1,
        duration,
        useNativeDriver: false,
    }).start(() => {
        handleNext();
    });

    if (isVideo && videoRef.current) {
        videoRef.current.replayAsync();
    }

    return () => {
        progressAnim.stopAnimation(); // ✅ stop if component unmounts
    };
}, [currentIndex, isUploading]);


    // 🛑 If mediaList is empty
    if (!mediaList || mediaList.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', fontSize: 16 }}>No media selected.</Text>
            </SafeAreaView>
        );
    }
const handleUpload = async () => {
  try {
    setIsUploading(true);

    const token = await SecureStore.getItemAsync('auth_token');

    if (!token) {
      alert('User not authenticated.');
      setIsUploading(false);
      return;
    }

    for (const media of mediaList) {
      const formData = new FormData();

      formData.append('media', {
        uri: media.uri,
        name: `story_${media.id}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}`,
        type: media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      } as any);

      formData.append('media_type', media.mediaType);
      formData.append('caption', '');

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
        console.error('Error uploading:', result);
        Toast.show({
          type: 'error',
          text1: 'Upload failed',
          text2: result?.message || 'Unknown error',
        });
        setIsUploading(false);
        return;
      }
    }

    Toast.show({
      type: 'success',
      text1: 'Stories uploaded!',
    });

    setIsUploading(false);
    router.replace('/(tabs)'); // 👈 change to your home route
  } catch (error) {
    console.error('Upload error:', error);
    Toast.show({
      type: 'error',
      text1: 'Upload failed',
      text2: 'Please try again.',
    });
    setIsUploading(false);
  }
};



    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {mediaList.map((_, index) => (
                    <View key={index} style={styles.progressBarBackground}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                index === currentIndex && { flex: progressAnim, backgroundColor: '#FF0000' },
                                index < currentIndex && { flex: 1, backgroundColor: '#FFFFFF' },
                                index > currentIndex && { flex: 0, backgroundColor: '#FFFFFF' },
                            ]}
                        />
                    </View>
                ))}
            </View>


            {/* Media Content */}
            <TouchableOpacity style={styles.mediaContainer} onPress={handleNext} activeOpacity={0.9}>
                {isVideo ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: currentMedia.uri }}
                        style={styles.video}
                        resizeMode="cover"
                        isMuted={false}
                        shouldPlay
                        useNativeControls={false}
                        onPlaybackStatusUpdate={(status) => {
                            if (status.didJustFinish) {
                                handleNext();
                            }
                        }}
                    />
                ) : (
                    <Image source={{ uri: currentMedia.uri }} style={styles.image} />
                )}
            </TouchableOpacity>
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
        flexDirection: 'row',
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        height: 4,
        zIndex: 100,
        gap: 5,
    },
    progressBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        backgroundColor: '#fff',
        height: 4,
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
    uploadButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: '#FF0000',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        zIndex: 200,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    loaderWrapper: {
  position: 'absolute',
  bottom: 30,
  alignSelf: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
}


});
