// ✅ Fully optimized AddToStoryScreen with:
// 1. Camera picker
// 2. Full gallery access from all folders
// 3. Pagination for better performance

export const options = {
  headerShown: false,
};

import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3;

export default function AddToStoryScreen() {
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await loadMoreAssets();
      }
      setLoading(false);
    })();
  }, []);

  const loadMoreAssets = async () => {
    if (!hasNextPage) return;
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'all',
      first: 30,
      sortBy: [['creationTime', false]],
      after: endCursor || undefined,
    });
    setMediaAssets((prev) => [...prev, ...media.assets]);
    setEndCursor(media.endCursor || null);
    setHasNextPage(media.hasNextPage);
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSelected((prev) => [...prev, result.assets[0]]);
    }
  };

  const toggleSelect = (item: any) => {
    const isSelected = selected.find((s) => s.id === item.id);
    if (isSelected) {
      setSelected((prev) => prev.filter((s) => s.id !== item.id));
    } else {
      setSelected((prev) => [...prev, item]);
    }
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      router.push({
        pathname: '/story-preview',
        params: {
          selected: JSON.stringify(
            selected.map((i) => ({
              id: i.id,
              uri: i.uri,
              mediaType: i.mediaType,
            }))
          ),
        },
      });
    }
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color="#FF0000" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add to Story</Text>
        <TouchableOpacity onPress={openCamera} style={styles.cameraButton}>
          <Text style={styles.cameraButtonText}>📷 Open Camera</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mediaAssets}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => {
          const isSelected = selected.find((s) => s.id === item.id);
          const isVideo = item.mediaType === 'video';
          return (
            <TouchableOpacity onPress={() => toggleSelect(item)} style={{ position: 'relative' }}>
              <Image
                source={{ uri: item.uri }}
                style={[styles.image, isSelected && styles.selected]}
              />
              {isVideo && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoText}>▶</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        onEndReached={loadMoreAssets}
        onEndReachedThreshold={0.5}
      />

      {selected.length > 0 && (
        <TouchableOpacity onPress={handleContinue} style={styles.button}>
          <Text style={styles.buttonText}>Continue ({selected.length})</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  cameraButton: {
    marginTop: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  image: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  videoText: {
    color: '#fff',
    fontSize: 12,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
