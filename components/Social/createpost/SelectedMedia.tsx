import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { GalleryMedia } from '@/app/create-post';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';

interface SelectedMediaProps {
  selectedMedia: GalleryMedia[];
  onRemoveMedia: (mediaId: string) => void;
  onViewMedia: (media: GalleryMedia) => void;
}

export default function SelectedMedia({ selectedMedia, onRemoveMedia, onViewMedia }: SelectedMediaProps) {
  if (selectedMedia.length === 0) {
    return null;
  }
  const {dark} = useTheme();

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container,{ backgroundColor:  dark ? 'black': 'white'}]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedMedia.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.mediaContainer}
            onPress={() => onViewMedia(item)}
          >
            <Image source={{ uri: item.uri }} style={styles.media} />
            
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
            
            {/* Remove button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveMedia(item.id)}
            >
              <AntDesign name='close' size={16} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    gap: 12,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});