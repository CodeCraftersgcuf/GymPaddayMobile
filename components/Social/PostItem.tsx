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
import { getLikenDislikePost, createShare } from "@/utils/queries/socialMedia";
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from "expo-av";
import Toast from 'react-native-toast-message';
import { useFeedVideo } from '@/contexts/FeedVideoContext';



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
    location?: string;
    likes?: any[];
    user: {
      id: number;
      username: string;
      profile_picture: string
    };
  };
  showComment?: boolean
  onCommentPress: (value: any[], postId: number) => void;
  handleMenu: (userId: number | string, postId: number) => void;
  /** When false, all videos in this post are paused (e.g. scrolled off-screen in feed). */
  isFeedVideoActive?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  onCommentPress,
  handleMenu,
  showComment,
  isFeedVideoActive = true,
}) => {
  const { dark } = useTheme();
  const router = useRouter();
  const { isMuted, toggleMuted } = useFeedVideo();

  const [token, setToken] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  /** Index for fullscreen image modal only (do not mix with feed carousel `currentIndex`). */
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisibleBottomSheet, setModalVisibleBottomSheet] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<number, boolean>>({});
  const [isBuffering, setIsBuffering] = useState<Record<number, boolean>>({});
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | undefined>(undefined);
  const [showVideoControls, setShowVideoControls] = useState<Record<number, boolean>>({});
  const [videoLoaded, setVideoLoaded] = useState<Record<number, boolean>>({});
  const controlsTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout> | null>>({});

  const [ImagesData, setImagesData] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  // Fix: Initialize likes from post.likes array length if available, otherwise from likes_count
  const [likesCount, setLikesCount] = useState(post.likes?.length || post.likes_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const videoRefs = useRef<Record<number, Video>>({});

  // console.log("post data we are getting", post);
  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      Object.values(controlsTimeoutRef.current).forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    };
  }, []);

  // Check if current user has liked this post
  useEffect(() => {
    const checkIfLiked = async () => {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData && post.likes) {
        const currentUser = JSON.parse(userData);
        const userLiked = post.likes.some(like => like.user?.id === currentUser.id);
        setIsLiked(userLiked);
      }
    };
    checkIfLiked();
  }, [post.likes]);

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

  // useEffect(() => {
  //   // Update local state from server after like/dislike
  //   if (likeData) {
  //     if (likeData.message === 'Disliked') {
  //       setIsLiked(false);
  //       setLikesCount((prev) => prev - 1);
  //     } else {
  //       setIsLiked(true);
  //       setLikesCount((prev) => prev + 1);
  //     }
  //   }
  //   // Optionally, handle other cases (e.g., error handling)
  // }, [likeData]);
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
    
    // Auto-play video if it's the first item (only when this post is the active feed row)
    if (isFeedVideoActive && post.videoUrl && mediaArray[0] === post.videoUrl) {
      setTimeout(() => {
        const videoRef = videoRefs.current[0];
        if (videoRef) {
          videoRef.playAsync().catch(console.error);
          setIsPlaying(prev => ({ ...prev, 0: true }));
          setShowVideoControls(prev => ({ ...prev, 0: false }));
        }
      }, 100);
    }
  }, [post, isFeedVideoActive]);

  // Pause every slide when this post scrolls off-screen; resume current slide when back
  useEffect(() => {
    if (isFeedVideoActive) return;
    Object.keys(videoRefs.current).forEach((key) => {
      const ref = videoRefs.current[Number(key)];
      ref?.pauseAsync?.().catch(() => {});
    });
  }, [isFeedVideoActive]);

  useEffect(() => {
    if (!isFeedVideoActive || !post.videoUrl) return;
    const t = setTimeout(() => {
      const idx = currentIndex;
      const ref = videoRefs.current[idx];
      if (!ref || !videoLoaded[idx]) return;
      ref.playAsync().catch(() => {});
      setIsPlaying((prev) => ({ ...prev, [idx]: true }));
    }, 120);
    return () => clearTimeout(t);
  }, [isFeedVideoActive]);


  const handleLike = React.useCallback(async () => {
    if (!token || likeLoading) return; // Prevent double-tap lag

    // Optimistic update - instant feedback
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => prev + (newLiked ? 1 : -1));

    // Call API in background (non-blocking)
    try {
      await toggleLike();
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(!newLiked);
      setLikesCount((prev) => prev + (!newLiked ? 1 : -1));
    }
  }, [token, isLiked, likeLoading, toggleLike]);



  const handlePress = React.useCallback(() => {
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
  }, [post.recent_comments, post.id, onCommentPress]);

  const openImageSlider = (index: number) => {
    const isVideo = ImagesData[index] === post.videoUrl;
    if (isVideo) return; // ⛔ don't open modal for video
    setSelectedImage(index);
    setModalImageIndex(index);
    setModalVisible(true);
  };

  const handleFullscreenScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex >= 0 && newIndex < ImagesData.length) {
      setModalImageIndex(newIndex);
    }
  };

  // const handleScroll = (event: any) => {
  //   const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
  //   setCurrentIndex(newIndex);
  // };
  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);

    Object.keys(videoRefs.current).forEach((key) => {
      const videoIndex = parseInt(key);
      const ref = videoRefs.current[videoIndex];
      if (videoIndex === newIndex) {
        // Play video and ensure it's visible (only if loaded)
        if (ref && videoLoaded[videoIndex]) {
          ref.playAsync().catch(console.error);
          // State will be updated by onPlaybackStatusUpdate
          // Hide controls after 3 seconds
          if (controlsTimeoutRef.current[videoIndex]) {
            clearTimeout(controlsTimeoutRef.current[videoIndex]!);
          }
          controlsTimeoutRef.current[videoIndex] = setTimeout(() => {
            setShowVideoControls(prev => {
              if (prev[videoIndex] === false) return prev;
              return { ...prev, [videoIndex]: false };
            });
          }, 3000);
        }
      } else {
        // Pause other videos (only if loaded)
        if (ref && videoLoaded[videoIndex]) {
          ref.pauseAsync().catch(console.error);
          // State will be updated by onPlaybackStatusUpdate
        }
      }
    });
  };


  const formatTimestamp = (timestamp) => {
    const postDate = new Date(timestamp);
    return `${formatDistanceToNow(postDate)} ago`; // "20 minutes ago"
  };

  // Share post content and first image
  const handleShare = React.useCallback(async () => {
    try {
      let message = post.content || '';
      if (post.imagesUrl && post.imagesUrl.length > 0) {
        message += `\n${post.imagesUrl[0]}`;
      }
      const result = await Share.share({
        message,
        url: post.imagesUrl && post.imagesUrl.length > 0 ? post.imagesUrl[0] : undefined,
        title: 'Check out this post!',
      });
      if (result.action === Share.sharedAction && token) {
        setShareCount(prev => prev + 1);
        createShare({ shareable_id: post.id, shareable_type: 'App\\Models\\Post' }, token).catch(console.error);
      }
    } catch (error) {
      Alert.alert('Share Error', 'Failed to share post.');
      console.error('Share error:', error);
    }
  }, [post.content, post.imagesUrl, post.id, token]);

  // Download image to device gallery
  // const handleDownload = async () => {
  //   try {
  //     if (!post.imagesUrl || post.imagesUrl.length === 0) {
  //       Alert.alert('No image', 'No image to download.');
  //       return;
  //     }
  //     const imageUrl = post.imagesUrl[0];
  //     // Ask for permission if needed
  //     if (Platform.OS === 'android') {
  //       const { status } = await MediaLibrary.requestPermissionsAsync();
  //       if (status !== 'granted') {
  //         Alert.alert('Permission required', 'Please allow media library access to save images.');
  //         return;
  //       }
  //     }
  //     const fileUri = FileSystem.cacheDirectory + imageUrl.split('/').pop();
  //     const downloadResumable = FileSystem.createDownloadResumable(imageUrl, fileUri);
  //     const { uri } = await downloadResumable.downloadAsync();
  //     const asset = await MediaLibrary.createAssetAsync(uri);
  //     await MediaLibrary.createAlbumAsync('Download', asset, false);
  //     Alert.alert('Downloaded', 'Image saved to your gallery.');
  //   } catch (error) {
  //     Alert.alert('Download Error', 'Failed to download image.');
  //     console.error('Download error:', error);
  //   }
  // };
  const handleDownload = async () => {
    try {
      const currentMedia = ImagesData[currentIndex];
      if (!currentMedia) {
        Alert.alert('No media', 'No image or video to download.');
        return;
      }

      Toast.show({
        type: 'info',
        text1: 'Downloading',
        text2: 'Saving to your gallery…',
        visibilityTime: 2000,
      });

      const fileExtension = currentMedia.split('.').pop()?.toLowerCase();
      const isVideo = fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'avi' || fileExtension === 'mkv';
      
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow media library access to save files.');
        return;
      }

      // Create a unique file name with current timestamp to ensure it appears as recent
      const timestamp = Date.now();
      const mediaType = isVideo ? 'video' : 'image';
      const uniqueFileName = `GymPaddy_${mediaType}_${timestamp}.${fileExtension}`;
      const downloadUri = `${FileSystem.cacheDirectory}${uniqueFileName}`;

      // Download the file
      const downloadResumable = FileSystem.createDownloadResumable(currentMedia, downloadUri);
      const downloadResult = await downloadResumable.downloadAsync();
      
      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed - no file URI returned');
      }

      // For videos, copy the file to a new location with current timestamp
      // This ensures the file gets a new creation date and appears in recent files
      let finalUri = downloadResult.uri;
      if (isVideo) {
        const finalFileName = `GymPaddy_Video_${timestamp}.${fileExtension}`;
        const finalFileUri = `${FileSystem.documentDirectory}${finalFileName}`;
        
        // Copy the downloaded file to a new location
        // This creates a new file with current system timestamp
        // Using documentDirectory ensures the file is treated as a new file by the OS
        await FileSystem.copyAsync({
          from: downloadResult.uri,
          to: finalFileUri,
        });
        
        // Verify the file was copied
        const fileInfo = await FileSystem.getInfoAsync(finalFileUri);
        if (!fileInfo.exists) {
          throw new Error('Failed to create video file copy');
        }
        
        finalUri = finalFileUri;
        console.log('📹 Video copied to new location with current timestamp:', finalUri);
      }

      // Save to media library
      // The file will now have the current timestamp as its creation date
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      
      // Try to save to a specific album, or just save to default if album creation fails
      try {
        await MediaLibrary.createAlbumAsync('GymPaddy', asset, false);
      } catch (albumError) {
        // If album already exists or creation fails, just save to default gallery
        console.log('Album creation failed, saving to default gallery:', albumError);
      }

      // Clean up temporary files
      try {
        if (downloadResult.uri !== finalUri) {
          await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        }
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }

      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: `${isVideo ? 'Video' : 'Image'} saved to your gallery.`,
        visibilityTime: 2500,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Download failed',
        text2: error?.message || 'Could not save media. Please try again.',
        visibilityTime: 3500,
      });
      console.error('Download error:', error);
    }
  };
  const WORD_LIMIT = 25;
  const words = post?.content?.trim().split(' ');
  const shouldTruncate = words?.length > WORD_LIMIT;
  const trimmedText = words?.slice(0, WORD_LIMIT).join(' ');
  const isDefaultImage = !post.user.profile_picture;
  //adding showing who liked
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);

  return (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push({ pathname: '/UserProfile', params: { user_id: post.user.id.toString() } })}>
          <View style={styles.headerLeft}>
            <Image
              source={
                post.user.profile_picture
                  ? { uri: post.user.profile_picture }
                  : require('../../assets/icons/more/User.png')
              }
              style={[
                styles.profileImage,
                isDefaultImage && { tintColor: 'black' },
              ]}
            />

            <View>
              <ThemeText style={styles.username}>{post.user.username}</ThemeText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {/* Only show location if post has a location tag */}
                {post.location && (
                  <>
                    <Text style={styles.time}>{post.location}</Text>
                    <Text style={styles.time}>•</Text>
                  </>
                )}
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
                <View style={styles.carouselVideoWrapper}>
                  <Pressable
                    onPress={() => {
                      // Toggle controls visibility on tap
                      setShowVideoControls(prev => ({ ...prev, [index]: true }));
                      // Clear existing timeout
                      if (controlsTimeoutRef.current[index]) {
                        clearTimeout(controlsTimeoutRef.current[index]!);
                      }
                      // Hide controls again after 3 seconds if video is playing
                      if (isPlaying[index]) {
                        controlsTimeoutRef.current[index] = setTimeout(() => {
                          setShowVideoControls(prev => ({ ...prev, [index]: false }));
                        }, 3000);
                      }
                    }}
                    style={styles.videoPressable}
                  >
                    <Video
                      ref={(ref) => {
                        if (ref) {
                          videoRefs.current[index] = ref;
                        }
                      }}
                      source={{ uri: item }}
                      style={styles.videoPlayer}
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                      isMuted={isMuted}
                      shouldPlay={
                        isFeedVideoActive &&
                        index === currentIndex &&
                        !!isPlaying[index] &&
                        !!videoLoaded[index]
                      }
                      useNativeControls={false}
                      onLoadStart={() => {
                        setIsBuffering(prev => ({ ...prev, [index]: true }));
                        setVideoLoaded(prev => ({ ...prev, [index]: false }));
                      }}
                      onLoad={async (data) => {
                        setIsBuffering(prev => ({ ...prev, [index]: false }));
                        setVideoLoaded(prev => ({ ...prev, [index]: true }));
                        // Calculate and set aspect ratio from video natural size
                        if (data.naturalSize) {
                          const ratio = data.naturalSize.width / data.naturalSize.height;
                          setVideoAspectRatio(ratio);
                        }
                        // Auto-play if this is the current video and post is visible in feed
                        if (index === currentIndex && isFeedVideoActive) {
                          const ref = videoRefs.current[index];
                          if (ref) {
                            try {
                              await ref.playAsync();
                            } catch (error) {
                              console.error('Error playing video:', error);
                            }
                          }
                        }
                      }}
                      onError={(error) => {
                        console.error('Video playback error:', error);
                        setIsBuffering(prev => ({ ...prev, [index]: false }));
                      }}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded && 'isPlaying' in status) {
                          const playing = status.isPlaying;
                          // Only update state if it actually changed to prevent infinite loops
                          setIsPlaying(prev => {
                            if (prev[index] === playing) return prev;
                            return { ...prev, [index]: playing };
                          });
                          
                          if (playing) {
                            // Clear existing timeout
                            if (controlsTimeoutRef.current[index]) {
                              clearTimeout(controlsTimeoutRef.current[index]!);
                            }
                            // Hide controls after 3 seconds when playing starts
                            controlsTimeoutRef.current[index] = setTimeout(() => {
                              setShowVideoControls(prev => {
                                if (prev[index] === false) return prev; // Prevent unnecessary update
                                return { ...prev, [index]: false };
                              });
                            }, 3000);
                          } else {
                            // Show controls when paused
                            if (controlsTimeoutRef.current[index]) {
                              clearTimeout(controlsTimeoutRef.current[index]!);
                            }
                            setShowVideoControls(prev => {
                              if (prev[index] === true) return prev; // Prevent unnecessary update
                              return { ...prev, [index]: true };
                            });
                          }
                        }
                      }}
                    />
                  </Pressable>

                  {/* Loader */}
                  {isBuffering[index] && (
                    <ActivityIndicator
                      size="large"
                      color="#fff"
                      style={styles.videoLoader}
                    />
                  )}

                  {/* Play Button */}
                  {!isBuffering[index] && showVideoControls[index] && (
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={async () => {
                        const ref = videoRefs.current[index];
                        if (ref && videoLoaded[index]) {
                          try {
                            if (isPlaying[index]) {
                              await ref.pauseAsync();
                              // State will be updated by onPlaybackStatusUpdate
                            } else {
                              await ref.playAsync();
                              // State will be updated by onPlaybackStatusUpdate
                              // Show controls temporarily, then hide after 3 seconds
                              setShowVideoControls(prev => ({ ...prev, [index]: false }));
                              if (controlsTimeoutRef.current[index]) {
                                clearTimeout(controlsTimeoutRef.current[index]!);
                              }
                              controlsTimeoutRef.current[index] = setTimeout(() => {
                                setShowVideoControls(prev => {
                                  if (prev[index] === false) return prev;
                                  return { ...prev, [index]: false };
                                });
                              }, 3000);
                            }
                          } catch (error) {
                            console.error('Error toggling playback:', error);
                          }
                        }
                      }}
                    >
                      <Image
                        source={isPlaying[index] ? images.pauseIcon : images.playIcon}
                        style={styles.playIcon}
                      />
                    </TouchableOpacity>
                  )}


                  {/* Mute Button */}
                  <TouchableOpacity onPress={toggleMuted} style={styles.muteButton}>
                    <Image
                      source={isMuted ? images.mute : images.unmute}
                      style={styles.muteIcon}
                    />
                  </TouchableOpacity>
                </View>

              ) : (
                <TouchableOpacity onPress={() => openImageSlider(index)}>
                  <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="contain" />
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
          <TouchableOpacity onPress={handleLike} style={styles.actionItem} disabled={likeLoading} onLongPress={() => {
            setLikeUsers(post?.likes.map(like => like.user));
            setLikeModalVisible(true);
          }}>
            <Image
              source={images.ConnectIcons}
              tintColor={isLiked ? 'red' : dark ? 'white' : 'black'}
              style={{ width: 25, height: 25 }}
            />
            <ThemeText style={styles.actionText}>{likesCount}</ThemeText>
            {/* {likeLoading && <ActivityIndicator size="small" color="#ff4444" style={{ marginLeft: 8 }} />} */}
          </TouchableOpacity>

          {showComment && <TouchableOpacity style={styles.actionItem} onPress={handlePress}>
            <Image source={images.comment} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>{post.recent_comments.length}</ThemeText>
          </TouchableOpacity>}


          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Image source={images.Share} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>{shareCount}</ThemeText>
          </TouchableOpacity>
        </ThemedView>
        <ThemedView darkColor="transparent">
          <TouchableOpacity style={styles.actionItem} onPress={handleDownload}>
            <Image source={images.downloadIcon} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
        </ThemedView>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={[styles.content, { color: dark ? 'white' : 'black' }]}>
          {isExpanded || !shouldTruncate ? post.content : `${trimmedText}... `}
          {shouldTruncate && (
            <Text
              onPress={() => setIsExpanded(!isExpanded)}
              style={{ color: dark ? '#fff' : '#000', fontWeight: '600' }}
            >
              {isExpanded ? 'See less' : 'See more'}
            </Text>
          )}
        </Text>
      </View>


      <Modal
        visible={likeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLikeModalVisible(false)}
      >
        <Pressable style={styles.bottomSheetOverlay} onPress={() => setLikeModalVisible(false)}>
          <Pressable style={styles.bottomSheetContainer} onPress={() => { }}>
            <View style={styles.dragIndicator} />
            <Text style={styles.likeModalTitle}>Liked by</Text>
            <FlatList
              data={likeUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.likeUserItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setLikeModalVisible(false); // Close modal before navigating
                    router.push({ pathname: '/UserProfile', params: { user_id: item.id.toString() } });
                  }}
                >
                  <Image source={{ uri: item.profile_picture_url }} style={styles.likeUserImage} />
                  <Text style={styles.likeUserName}>{item.fullname || item.username}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>




      {/* Full-Screen Image Slider Modal */}
      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <FlatList
            key={modalVisible ? `fs-${post.id}-${selectedImage}` : 'fs-closed'}
            data={ImagesData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImage}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item, index) => `fs-${post.id}-${item}-${index}`}
            renderItem={({ item }) => {
              const isVideo = item === post.videoUrl;
              if (isVideo) {
                return (
                  <View style={styles.fullscreenPage}>
                    <View style={styles.fullscreenVideoPlaceholder} />
                  </View>
                );
              }
              return (
                <View style={styles.fullscreenPage}>
                  <Image source={{ uri: item }} style={styles.fullscreenImage} />
                </View>
              );
            }}
            onMomentumScrollEnd={handleFullscreenScroll}
            onScroll={handleFullscreenScroll}
            scrollEventThrottle={16}
          />

          {/* Pagination Dots — same indices as ImagesData (modal pages) */}
          {ImagesData.length > 1 && (
            <View style={styles.pagination}>
              {ImagesData.map((uri, index) => (
                <View
                  key={`dot-${index}-${uri}`}
                  style={[styles.dot, modalImageIndex === index && styles.activeDot]}
                />
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
  videoPressable: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  bottomSheetContainer: {
    backgroundColor: 'white',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
  },

  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'gray',
    alignSelf: 'center',
    marginBottom: 10,
  },

  likeModal: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    borderRadius: 10,
    padding: 20,
    maxHeight: height * 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  likeModalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },

  likeUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  likeUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  likeUserName: {
    fontSize: 16,
  },

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
  videoLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },

  playButton: {
    position: 'absolute',
    top: '45%',
    left: '40%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 15,
  },

  playIcon: {
    width: 30,
    height: 30,
    tintColor: '#940304',
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
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenPage: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fullscreenImage: {
    width,
    height,
    resizeMode: 'contain',
  },
  fullscreenVideoPlaceholder: {
    width,
    height,
    backgroundColor: '#111',
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
    backgroundColor: "#940304",
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
    width: width - 20,
    height: (width - 20) * 1.12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  carouselVideoWrapper: {
    width: width - 20,
    height: (width - 20) * 1.12,
    borderRadius: 18,
    backgroundColor: '#000',
    alignSelf: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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

// Performance optimization: Memoize component with custom comparison
export default React.memo(PostItem, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id && 
         prevProps.post.likes_count === nextProps.post.likes_count &&
         prevProps.post.comments_count === nextProps.post.comments_count &&
         prevProps.isFeedVideoActive === nextProps.isFeedVideoActive &&
         prevProps.showComment === nextProps.showComment;
});