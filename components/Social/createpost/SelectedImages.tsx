import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { GalleryMedia } from '@/app/create-post';
import { AntDesign } from '@expo/vector-icons';

interface SelectedImagesProps {
  selectedImages: GalleryMedia[];
  onRemoveImage: (imageId: string) => void;
}

export default function SelectedImages({ selectedImages, onRemoveImage }: SelectedImagesProps) {
  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedImages.map((image, index) => (
          <View key={image.id} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveImage(image.id)}
            >
              <AntDesign name='close' size={16} color="#fff" />
            </TouchableOpacity>
          </View>
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
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 120,
    height: 160,
    borderRadius: 12,
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