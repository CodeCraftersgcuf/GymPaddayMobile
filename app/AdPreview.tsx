import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');

export default function AdPreview() {
  const router = useRouter();
  const { postId, campaignId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<Record<number, Video>>(Object.create(null));

  const getToken = async () => {
    const storedToken = await SecureStore.getItemAsync('auth_token');
    setToken(storedToken);
  };

  useEffect(() => {
    getToken();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!token || !postId) return;
      try {
        const response = await axios.get(`https://gympaddy.hmstech.xyz/api/user/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPost(response.data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [token, postId]);

  if (loading || !token) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF0000" />;
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Post not found or failed to load.</Text>
      </View>
    );
  }

  const user = post.user || {};
  const mediaItems = post.media || [];

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);

    Object.keys(videoRefs.current).forEach((key) => {
      const ref = videoRefs.current[parseInt(key)];
      if (parseInt(key) === index) {
        ref?.playAsync();
      } else {
        ref?.pauseAsync();
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boost Post</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      <Text style={styles.heading}>Boost your post to reach more audience</Text>

      {/* Post Card */}
      <View style={styles.card}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.profile_picture_url || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{user?.username || 'Unknown User'}</Text>
            <Text style={styles.sponsored}>Sponsored post</Text>
          </View>
        </View>

        {/* Media Carousel */}
        {mediaItems.length > 0 ? (
          <View>
            <FlatList
              data={mediaItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              onMomentumScrollEnd={handleScroll}
              renderItem={({ item, index }) => {
                const isVideo = item.media_type === 'video';
                return (
                  <View style={styles.mediaWrapper}>
                    {isVideo ? (
                      <>
                        <Video
                          ref={(ref) => {
                            if (ref) videoRefs.current[index] = ref;
                          }}
                          source={{ uri: item.url }}
                          style={styles.media}
                          resizeMode="cover"
                          useNativeControls={false}
                          isMuted={isMuted}
                          shouldPlay={false}
                          onPlaybackStatusUpdate={(status) => {
                            if ('isPlaying' in status) {
                              setIsPlaying(status.isPlaying);
                            }
                          }}
                        />
                        <TouchableOpacity
                          style={styles.playPauseButton}
                          onPress={async () => {
                            const ref = videoRefs.current[index];
                            if (ref) {
                              isPlaying ? await ref.pauseAsync() : await ref.playAsync();
                            }
                          }}
                        >
                          <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={28}
                            color="white"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.muteButton}
                          onPress={() => setIsMuted((prev) => !prev)}
                        >
                          <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={24}
                            color="white"
                          />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.media}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                );
              }}
            />
            {/* Pagination */}
            <View style={styles.pagination}>
              {mediaItems.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, currentIndex === i && styles.activeDot]}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.media, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#aaa' }}>No media available</Text>
          </View>
        )}

        {/* Caption */}
        <View style={styles.captionBox}>
          <Text style={styles.caption}>
            {post?.content || 'No description available'}
          </Text>
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          router.push({
            pathname: '/BoostPostScreen_review',
            params: { postId, campaignId },
          })
        }
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginVertical: 20,
  },
  progressBarFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
  },
  sponsored: {
    color: 'red',
    fontSize: 12,
  },
  mediaWrapper: {
    width,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playPauseButton: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  muteButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF0000',
  },
  captionBox: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  caption: {
    fontSize: 14,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
