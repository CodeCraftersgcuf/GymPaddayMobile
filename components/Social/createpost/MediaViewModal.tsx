import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  StatusBar,
  Platform,
} from 'react-native';
import { X, Play, Pause } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { GalleryMedia } from '@/app/create-post';
import { AntDesign, Entypo, FontAwesome } from '@expo/vector-icons';

interface MediaViewModalProps {
  media: GalleryMedia | null;
  visible: boolean;
  onClose: () => void;
}

export default function MediaViewModal({ media, visible, onClose }: MediaViewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<Video | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const handlePlayPause = async () => {
    if (videoRef) {
      if (isPlaying) {
        await videoRef.pauseAsync();
      } else {
        await videoRef.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoLoad = () => {
    setIsPlaying(false);
  };

  if (!media) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden={Platform.OS === 'ios'} />
      <View style={styles.modalContainer}>
        <View style={styles.backdrop} />
        
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <AntDesign name='close' size={24} color="#fff" />
        </TouchableOpacity>

        {/* Media content */}
        <View style={styles.mediaContainer}>
          {media.mediaType === 'photo' ? (
            <Image
              source={{ uri: media.uri }}
              style={[
                styles.fullscreenMedia,
                {
                  width: screenWidth,
                  height: screenHeight,
                }
              ]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoContainer}>
              <Video
                ref={setVideoRef}
                source={{ uri: media.uri }}
                style={[
                  styles.fullscreenMedia,
                  {
                    width: screenWidth,
                    height: screenHeight,
                  }
                ]}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={true}
                onLoad={handleVideoLoad}
                onPlaybackStatusUpdate={(status) => {
                  if ('isPlaying' in status) {
                    setIsPlaying(status.isPlaying || false);
                  }
                }}
              />
              
              {/* Video controls */}
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <FontAwesome name='pause' size={32} color="#fff" />
                ) : (
                  <Entypo name='controller-play' size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Media info */}
        <View style={styles.infoContainer}>
          <Text style={styles.mediaType}>
            {media.mediaType === 'photo' ? 'Photo' : 'Video'}
          </Text>
          {media.mediaType === 'video' && media.duration && (
            <Text style={styles.duration}>
              Duration: {Math.floor(media.duration / 1000)}s
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMedia: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
  videoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  mediaType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  duration: {
    color: '#ccc',
    fontSize: 14,
  },
});