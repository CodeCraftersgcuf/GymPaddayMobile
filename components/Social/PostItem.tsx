import { images } from "@/constants";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Share,
  Pressable,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import ThemedView from "../ThemedView";
import ThemeText from "../ThemedText";
import { useTheme } from "@/contexts/themeContext";
import { dummyImage } from "@/constants/help";
import PostDetailBottomsheet from "./PostDetailBottomsheet";
import { formatDistanceToNow } from 'date-fns';

import { useRouter } from "expo-router";
// import { Heart, MessageCircle, Star, Share2, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useQuery } from "@tanstack/react-query";
import { getLikenDislikePost } from "@/utils/queries/socialMedia";
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from "expo-av";



const { width, height } = Dimensions.get("window");

interface PostItemProps {
  post: {
    comments_count: number;
    content: string;
    id: number;
    likes_count: number;
    recent_comments: any[];
    timestamp: string;
    imagesUrl: string[];
    videoUrl?: string;
    view_count: number;
    share_count: number;
    user: {
      id: number;
      username: string;
      profile_picture: string
    };
  };
  onCommentPress: (value: any[], postId: number) => void;
  handleMenu: (userId: number | string, postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onCommentPress, handleMenu }) => {
  const { dark } = useTheme();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = () => setIsMuted(prev => !prev);

  const [token, setToken] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisibleBottomSheet, setModalVisibleBottomSheet] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [ImagesData, setImagesData] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const videoRefs = useRef<Record<number, Video>>({});


  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  const {
    data: likeData,
    refetch: toggleLike,
    isFetching: likeLoading,
  } = useQuery({
    queryKey: ['like-post', post.id, token],
    queryFn: () => {
      if (!token) throw new Error('No token');
      return getLikenDislikePost(post.id, token);
    },
    enabled: false, // only run when triggered by user
  });

  useEffect(() => {
    // Update local state from server after like/dislike
    if (likeData) {
      if (likeData.message === 'Disliked') {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    }
    // Optionally, handle other cases (e.g., error handling)
  }, [likeData]);
  // Extract images from post
  const imagesUrl = post.imagesUrl;

  // useEffect(() => {
  //   setImagesData(imagesUrl);
  // }, [post]);
  useEffect(() => {
    const mediaArray: string[] = [];

    if (post.videoUrl) {
      mediaArray.push(post.videoUrl); // add video first
    }

    if (post.imagesUrl && post.imagesUrl.length > 0) {
      mediaArray.push(...post.imagesUrl);
    }

    setImagesData(mediaArray);
  }, [post]);


  const handleLike = async () => {
    if (likeLoading || !token) return;
    await toggleLike(); // this will call the API and update likeData
  };

  const handlePress = () => {
    // Map recent comments to the correct structure
    const commentsForThisPost = post.recent_comments.map(comment => ({
      id: comment.id.toString(),
      username: comment.user.username,
      profileImage: dummyImage(),
      text: comment.text,
      time: "Just now",
      replies: Array.isArray(comment.replies) ? comment.replies.map((comment: any) => ({
        id: comment.id.toString(),
        username: comment.user.username,
        profileImage: dummyImage(),
        text: comment.text,
        time: "Just now",
        likes: 0,
      })) : [],
      likes: 0,
    }));

    onCommentPress(commentsForThisPost, post.id);
  };

  const openImageSlider = (index: number) => {
    const isVideo = ImagesData[index] === post.videoUrl;
    if (isVideo) return; // ⛔ don't open modal for video
    setSelectedImage(index);
    setCurrentIndex(index);
    setModalVisible(true);
  };

  // const handleScroll = (event: any) => {
  //   const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
  //   setCurrentIndex(newIndex);
  // };
  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);

    Object.keys(videoRefs.current).forEach((key) => {
      const ref = videoRefs.current[parseInt(key)];
      if (parseInt(key) === newIndex) {
        ref?.playAsync();
      } else {
        ref?.pauseAsync();
      }
    });
  };


  const formatTimestamp = (timestamp) => {
    const postDate = new Date(timestamp);
    return `${formatDistanceToNow(postDate)} ago`; // "20 minutes ago"
  };

  // Share post content and first image
  const handleShare = async () => {
    try {
      let message = post.content || '';
      if (post.imagesUrl && post.imagesUrl.length > 0) {
        message += `\n${post.imagesUrl[0]}`;
      }
      await Share.share({
        message,
        url: post.imagesUrl && post.imagesUrl.length > 0 ? post.imagesUrl[0] : undefined,
        title: 'Check out this post!',
      });
    } catch (error) {
      Alert.alert('Share Error', 'Failed to share post.');
      console.error('Share error:', error);
    }
  };

  // Download image to device gallery
  const handleDownload = async () => {
    try {
      if (!post.imagesUrl || post.imagesUrl.length === 0) {
        Alert.alert('No image', 'No image to download.');
        return;
      }
      const imageUrl = post.imagesUrl[0];
      // Ask for permission if needed
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow media library access to save images.');
          return;
        }
      }
      const fileUri = FileSystem.cacheDirectory + imageUrl.split('/').pop();
      const downloadResumable = FileSystem.createDownloadResumable(imageUrl, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      Alert.alert('Downloaded', 'Image saved to your gallery.');
    } catch (error) {
      Alert.alert('Download Error', 'Failed to download image.');
      console.error('Download error:', error);
    }
  };

  return (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push({ pathname: '/UserProfile', params: { user_id: post.user.id.toString() } })}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: post.user.profile_picture }} style={styles.profileImage} />
            <View>
              <ThemeText style={styles.username}>{post.user.username}</ThemeText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.time}>Lagos, Nigeria</Text>
                <Text style={styles.time}>•</Text>
                <Text style={styles.time}>{formatTimestamp(post.timestamp)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleMenu(post.user.id, post.id)}>
          <Image source={images.menuIcon} style={{ width: 25, height: 25 }} tintColor={dark ? "white" : 'black'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {/* <ThemeText style={styles.content}>{post.content}</ThemeText> */}

      {/* Image Grid */}
      {ImagesData && ImagesData.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            data={ImagesData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
              const isVideo = item === post.videoUrl;

              return isVideo ? (
                <View style={styles.carouselImage}>
                  <Video
                    ref={(ref) => {
                      if (ref) videoRefs.current[index] = ref;
                    }}
                    source={{ uri: item }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    isLooping
                    isMuted={isMuted}
                  />

                  {/* Mute/Unmute button */}
                  <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                    <Image
                      source={isMuted ? images.mute : images.unmute}
                      style={styles.muteIcon}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => openImageSlider(index)}>
                  <Image source={{ uri: item }} style={styles.carouselImage} />
                </TouchableOpacity>
              );

            }}


            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          />
          {ImagesData.length > 1 && (
            <View style={styles.carouselPagination}>
              {ImagesData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.carouselDot,
                    currentIndex === index && styles.carouselActiveDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}


      {/* Post Actions */}
      <View style={styles.actions}>
        <ThemedView darkColor="transparent" style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={handleLike} style={styles.actionItem} disabled={likeLoading}>
            <Image
              source={images.ConnectIcons}
              tintColor={isLiked ? 'red' : dark ? 'white' : 'black'}
              style={{ width: 25, height: 25 }}
            />
            <ThemeText style={styles.actionText}>{likesCount}</ThemeText>
            {likeLoading && <ActivityIndicator size="small" color="#ff4444" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>


          <TouchableOpacity style={styles.actionItem} onPress={handlePress}>
            <Image source={images.comment} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>{post.recent_comments.length}</ThemeText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Image source={images.Share} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}></ThemeText>
          </TouchableOpacity>
        </ThemedView>
        <ThemedView darkColor="transparent">
          <TouchableOpacity style={styles.actionItem} onPress={handleDownload}>
            <Image source={images.downloadIcon} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
        </ThemedView>
      </View>
      <Text
        numberOfLines={isExpanded ? undefined : 2}
        onTextLayout={(e) => {
          // Detect if content exceeds 2 lines
          if (e.nativeEvent.lines.length > 2 && !showSeeMore) {
            setShowSeeMore(true);
          }
        }}
        style={styles.content}
      >
        {post.content}
      </Text>

      {showSeeMore && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={{ color: '#007BFF', marginTop: -4 }}>
            {isExpanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>

      )}

      {/* Full-Screen Image Slider Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <FlatList
            data={ImagesData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImage}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.fullscreenImage} />
            )}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Pagination Dots */}
          {imagesUrl && imagesUrl.length > 1 && (
            <View style={styles.pagination}>
              {imagesUrl?.map((_, index) => (
                <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
              ))}
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <View style={styles.closeButtonCircle}>
              <Image source={images.CreatePlus} style={styles.closeButtonImage} />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  time: {
    color: "gray",
    fontSize: 12,
  },
  content: {
    marginTop: 10,
    marginBottom: 10,
  },
  imageGrid: {
    marginTop: 10,
  },
  // fullWidthImage: {
  //   width: "100%",
  //   height: 300,
  //   borderRadius: 8,
  // },
  fullWidthImage: {
    width: width - 20, // to give padding
    height: width - 20,
    borderRadius: 8,
    alignSelf: 'center',
  }
  ,
  threeImagesGrid: {
    flexDirection: "row",
    gap: 5,
  },
  largeImageWrapper: {
    flex: 2,
  },
  largeImage: {
    width: '100%',
    aspectRatio: 1, // this forces 1:1 square
    borderRadius: 8,
  }
  ,
  smallImagesWrapper: {
    flex: 1,
    justifyContent: "space-between",
  },
  smallImageWrapper: {
    flex: 1,
  },
  smallImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 5,
  },
  twoColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },

  imageWrapper: {
    flexBasis: "48%",
    position: "relative",
    overflow: "hidden",
    marginBottom: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  overlayText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width,
    height: height * 0.8,
    resizeMode: "contain",
  },
  pagination: {
    marginBottom: 20,
    flexDirection: "row",
    alignSelf: "center",
    padding: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "gray",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#ff0000",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  closeButtonImage: {
    width: 20,
    height: 20,
    transform: [{ rotate: '45deg' }]
  },
  carouselContainer: {
    marginTop: 10,
    position: 'relative',
  },
  carouselImage: {
    width: width - 20,  // to account for padding
    height: width - 20, // keep it square
    borderRadius: 18,
    overflow: 'hidden',
    resizeMode: 'cover',
  },


  carouselPagination: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'gray',
    marginHorizontal: 4,
  },
  carouselActiveDot: {
    backgroundColor: '#fff',
  },
muteButton: {
  position: 'absolute',
  bottom: 10,
  right: 10,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 8,
  borderRadius: 20,
},

muteIcon: {
  width: 20,
  height: 20,
  tintColor: '#fff',
},

});

export default PostItem;