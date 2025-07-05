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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
// ✅ 👇 This must be OUTSIDE the component

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3;

export default function AddToStoryScreen() {
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: 'all', // ✅ Allow both images and videos
          first: 100,
          sortBy: [['creationTime', false]],
        });
        setMediaAssets(media.assets);
      }
      setLoading(false);
    })();
  }, []);

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#FF0000" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add to Story</Text>
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
            <TouchableOpacity
              onPress={() => toggleSelect(item)}
              style={{ position: 'relative' }}
            >
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

  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 80, // Space for continue button
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
