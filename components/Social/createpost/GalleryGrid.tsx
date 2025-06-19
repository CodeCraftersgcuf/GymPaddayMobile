import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  Dimensions,
} from 'react-native';
import { GalleryMedia } from '@/app/create-post';
import { Entypo, Ionicons } from '@expo/vector-icons';

interface GalleryGridProps {
  media: GalleryMedia[];
  selectedMedia: GalleryMedia[];
  onMediaSelect: (media: GalleryMedia) => void;
  onGalleryButtonPress: () => void;
  onViewMedia: (media: GalleryMedia) => void;
}

export default function GalleryGrid({ 
  media, 
  selectedMedia, 
  onMediaSelect, 
  onGalleryButtonPress,
  onViewMedia 
}: GalleryGridProps) {
  const screenWidth = Dimensions.get('window').width;
  const imageSize = (screenWidth - 64) / 5; // 5 images per row with padding

  const isSelected = (mediaId: string) => {
    return selectedMedia.some(item => item.id === mediaId);
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gallery picker button */}
        <TouchableOpacity 
          style={[styles.galleryButton, { width: imageSize, height: imageSize }]}
          onPress={onGalleryButtonPress}
        >
          <Ionicons name='image-outline' size={24} color="#666" />
          <Text style={styles.galleryButtonText}>Add Media</Text>
        </TouchableOpacity>

        {/* Gallery media */}
        {media.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.mediaButton,
              { width: imageSize, height: imageSize },
              isSelected(item.id) && styles.selectedMedia
            ]}
            onPress={() => onMediaSelect(item)}
            onLongPress={() => onViewMedia(item)}
          >
            <Image 
              source={{ uri: item.uri }} 
              style={styles.media}
            />
            
            {/* Video overlay */}
            {item.mediaType === 'video' && (
              <View style={styles.videoOverlay}>
                <Entypo name='controller-play' size={20} color="#fff" fill="#fff" />
                {item.duration && (
                  <Text style={styles.durationText}>
                    {formatDuration(item.duration)}
                  </Text>
                )}
              </View>
            )}
            
            {/* Selection indicator */}
            {isSelected(item.id) && (
              <View style={styles.selectedOverlay}>
                <View style={styles.selectedDot} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  galleryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  galleryButtonText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  mediaButton: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedMedia: {
    borderWidth: 3,
    borderColor: '#ff3333',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3333',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});