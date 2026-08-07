import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { MediaType } from 'expo-media-library';
import { requestMediaLibraryReadPermissions } from '@/utils/mediaLibraryPermissions';
import Header from '@/components/Social/createpost/Header';
import UserSection from '@/components/Social/createpost/UserSection';
import SelectedMedia from '@/components/Social/createpost/SelectedMedia';
import GalleryGrid from '@/components/Social/createpost/GalleryGrid';
import MediaViewModal from '@/components/Social/createpost/MediaViewModal';
import { useTheme } from '@/contexts/themeContext';
import { useLocalSearchParams } from 'expo-router';

//Code related to integration
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updatePost } from '@/utils/mutations/posts';
import { getPostById, patchPostInUserPostsInfiniteCache } from '@/utils/queries/posts';
import { notifyUploadStarted } from '@/utils/backgroundUpload';
import {
  POST_VIDEO_LIMIT_LABEL,
  POST_VIDEO_MAX_SIZE_BYTES,
  POST_VIDEO_MAX_SIZE_MB,
} from '@/utils/uploadLimits';
import { ensureLocalFileUri } from '@/utils/ensureLocalFileUri';
import type { PostUploadFile } from '@/utils/postUpload';
import { enqueuePostUpload } from '@/utils/postUploadQueue';
import {
  addPendingPost,
  getCurrentUserId,
} from '@/utils/pendingPosts';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export interface GalleryMedia {
  id: string;
  uri: string;
  width: number;
  height: number;
  mediaType: 'photo' | 'video';
  duration?: number;
  fileSizeBytes?: number | null;
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams<{ postId?: string | string[] }>();
  const postIdRaw = params.postId;
  const postId =
    postIdRaw === undefined ? undefined : Array.isArray(postIdRaw) ? postIdRaw[0] : postIdRaw;
  const postIdNumeric = postId ? parseInt(String(postId), 10) : NaN;
  const isEditMode = Boolean(postId && Number.isFinite(postIdNumeric));

  const [galleryMedia, setGalleryMedia] = useState<GalleryMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<GalleryMedia[]>([]);
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingMedia, setViewingMedia] = useState<GalleryMedia | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const theme = useTheme();
  const dark = theme?.dark ?? false; // Safety check in case theme context isn't initialized
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch existing post data if in edit mode (must await token — passing tokenn() was a Promise → Bearer [object Object])
  const {
    data: existingPost,
    isLoading: isLoadingPost,
    isError: isPostLoadError,
    error: postLoadError,
    refetch: refetchPost,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('Not authenticated');
      return getPostById(postIdNumeric, token);
    },
    enabled: isEditMode && !!postId && Number.isFinite(postIdNumeric),
  });

  // Populate form with existing post data
  useEffect(() => {
    if (isEditMode && existingPost && !initialDataLoaded) {
      setPostText(existingPost.content || existingPost.title || '');

      // Convert existing media to GalleryMedia format
      if (existingPost.media && existingPost.media.length > 0) {
        const existingMedia: GalleryMedia[] = existingPost.media.map((mediaItem: any, index: number) => ({
          id: `existing_${mediaItem.id || index}`,
          uri: mediaItem.url || mediaItem.media_url,
          width: 300,
          height: 400,
          mediaType: mediaItem.type === 'video' ? 'video' : 'photo',
          duration: mediaItem.duration,
        }));
        setSelectedMedia(existingMedia);
      }

      setInitialDataLoaded(true);
      console.log('📝 Form populated with existing post data');
    }
  }, [existingPost, isEditMode, initialDataLoaded]);

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: async (updatedPost: unknown) => {
      if (postId) {
        patchPostInUserPostsInfiniteCache(
          queryClient,
          postId,
          updatedPost as Record<string, unknown>
        );
        await queryClient.invalidateQueries({ queryKey: ['post', postId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      await queryClient.refetchQueries({ queryKey: ['userPosts'] });
      await queryClient.invalidateQueries({ queryKey: ['postComments'] });
      Toast.show({
        type: 'success',
        text1: 'Post Updated!',
        text2: 'Your post has been updated successfully',
        visibilityTime: 500,
      });
      setIsSubmittingLocal(false);
      setTimeout(() => router.back(), 600);
    },
    onError: (error: any) => {
      console.warn('❌ Post Update Error:', error?.message || String(error));
      setIsSubmittingLocal(false); // Re-enable input on error
      handleMutationError(error, 'Failed to Update Post');
    },
  });

  const isSubmitting = isSubmittingLocal || updatePostMutation.isPending;

  const handleMutationError = (error: any, defaultMessage: string) => {
    if (error?.response) {
      console.log('📡 Backend Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error?.request) {
      console.log('📤 Request Made But No Response:', error.request);
    } else {
      console.log('💥 General Error:', error.message);
    }

    Toast.show({
      type: 'error',
      text1: defaultMessage,
      text2: error?.response?.data?.message || error.message || 'Something went wrong. Please try again.',
      visibilityTime: 3000,
    });
  };

  useEffect(() => {
    requestPermissionAndLoadGallery();
  }, []);

  const openAppSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const getLocalFileSizeBytes = async (uri: string): Promise<number | null> => {
    if (!uri || uri.startsWith('http')) return null;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof info.size === 'number') {
        return info.size;
      }
    } catch {
      /* content:// URIs may not be readable on some Android builds */
    }
    return null;
  };

  const validateSelectedMedia = async (): Promise<string | null> => {
    const newVideos = selectedMedia.filter(
      (m) => m.mediaType === 'video' && !m.id.startsWith('existing_'),
    );
    if (newVideos.length > 1) {
      return 'Only one video is allowed per post.';
    }

    for (const media of newVideos) {
      const sizeBytes = media.fileSizeBytes ?? await getLocalFileSizeBytes(media.uri);
      if (sizeBytes != null && sizeBytes > POST_VIDEO_MAX_SIZE_BYTES) {
        return `Video is too large. Maximum size is ${POST_VIDEO_MAX_SIZE_MB}MB.`;
      }
    }
    return null;
  };

  const requestPermissionAndLoadGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web platform, use placeholder media
        const placeholderMedia: GalleryMedia[] = [
          { id: '1', uri: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=300', width: 300, height: 400, mediaType: 'photo' },
          { id: '2', uri: 'https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=300', width: 300, height: 400, mediaType: 'photo' },
          { id: '3', uri: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4', width: 300, height: 400, mediaType: 'video', duration: 15000 },
          { id: '4', uri: 'https://images.pexels.com/photos/1366973/pexels-photo-1366973.jpeg?auto=compress&cs=tinysrgb&w=300', width: 300, height: 400, mediaType: 'photo' },
          { id: '5', uri: 'https://videos.pexels.com/video-files/2278095/2278095-uhd_2560_1440_30fps.mp4', width: 300, height: 400, mediaType: 'video', duration: 20000 },
          { id: '6', uri: 'https://images.pexels.com/photos/1484771/pexels-photo-1484771.jpeg?auto=compress&cs=tinysrgb&w=300', width: 300, height: 400, mediaType: 'photo' },
          { id: '7', uri: 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=300', width: 300, height: 400, mediaType: 'photo' },
          { id: '8', uri: 'https://videos.pexels.com/video-files/1851190/1851190-uhd_2560_1440_30fps.mp4', width: 300, height: 400, mediaType: 'video', duration: 12000 },
        ];
        setGalleryMedia(placeholderMedia);
        setLoading(false);
        console.log('Web platform detected - using placeholder media');
        return;
      }

      // Android: use ImagePicker (Add Media / Camera) — avoids MediaLibrary granular permission issues.
      if (Platform.OS === 'android') {
        setGalleryMedia([]);
        setLoading(false);
        return;
      }

      const granted = await requestMediaLibraryReadPermissions();
      console.log('Media library permission status:', granted ? 'granted' : 'denied');

      if (granted) {
        await loadGalleryMedia();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryMedia = async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: [MediaType.photo, MediaType.video], // Get both photos and videos from all folders
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const media: GalleryMedia[] = assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mediaType: asset.mediaType === MediaType.photo ? 'photo' : 'video',
        duration: asset.duration,
      }));

      setGalleryMedia(media);
      console.log(`Loaded ${media.length} media items from gallery (photos & videos from all folders)`);
    } catch (error) {
      console.error('Error loading gallery media:', error);
      Alert.alert('Error', 'Failed to load gallery media');
    }
  };

  const handleMediaSelect = (media: GalleryMedia) => {
    if (isSubmitting) return;
    setSelectedMedia(prev => {
      const isSelected = prev.find(item => item.id === media.id);
      if (isSelected) {
        return prev.filter(item => item.id !== media.id);
      } else {
        return [...prev, media];
      }
    });
    console.log('Media selected:', media.id, media.mediaType);
  };

  const handleMediaRemove = (mediaId: string) => {
    if (isSubmitting) return;
    setSelectedMedia(prev => prev.filter(item => item.id !== mediaId));
    console.log('Media removed:', mediaId);
  };

  const handleGalleryButtonPress = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Media picker is not available on web. Please select from the gallery below.');
        return;
      }

      // Request image picker permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to select media. Please grant permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openAppSettings },
          ]
        );
        return;
      }

      if (Platform.OS === 'android') {
        await pickMedia('mixed');
        return;
      }

      // Show action sheet to choose media type
      Alert.alert(
        'Select Media',
        'Choose the type of media you want to add',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Photo', onPress: () => pickMedia('photo') },
          { text: 'Video', onPress: () => pickMedia('video') },
          { text: 'Photo or Video', onPress: () => pickMedia('mixed') },
        ]
      );
    } catch (error) {
      console.error('Error handling gallery button press:', error);
      Alert.alert('Error', 'Failed to open media picker. Please try again.');
    }
  };
  const pickMedia = async (type: 'photo' | 'video' | 'mixed') => {
  try {
    let mediaTypes = ImagePicker.MediaTypeOptions.Images;
    if (type === 'video') {
      mediaTypes = ImagePicker.MediaTypeOptions.Videos;
    } else if (type === 'mixed') {
      mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 0,
      aspect: [18, 32],
      quality: 0.6,
      videoQuality: ImagePicker.VideoQuality?.High || 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newMedia: GalleryMedia[] = [];
      for (let index = 0; index < result.assets.length; index++) {
        const asset = result.assets[index];
        const mediaType = asset.type === 'video' ? 'video' : 'photo';
        const sizeBytes = mediaType === 'video' ? await getLocalFileSizeBytes(asset.uri) : null;
        if (mediaType === 'video') {
          if (sizeBytes != null && sizeBytes > POST_VIDEO_MAX_SIZE_BYTES) {
            Alert.alert(
              'Video too large',
              `Maximum video size is ${POST_VIDEO_MAX_SIZE_MB}MB.`,
            );
            continue;
          }
        }
        newMedia.push({
          id: `picker_${Date.now()}_${index}`,
          uri: asset.uri,
          width: asset.width || 300,
          height: asset.height || 400,
          mediaType,
          duration: asset.duration,
          fileSizeBytes: sizeBytes,
        });
      }

      if (newMedia.length === 0) return;

      const hasNewVideo = newMedia.some((m) => m.mediaType === 'video');
      const existingVideos = selectedMedia.filter((m) => m.mediaType === 'video');
      if (hasNewVideo && existingVideos.length > 0) {
        Alert.alert('One video only', 'This post already has a video. Remove it before adding another.');
        return;
      }
      if (newMedia.filter((m) => m.mediaType === 'video').length > 1) {
        Alert.alert('One video only', 'You can add only one video per post.');
        return;
      }

      setSelectedMedia(prev => [...prev, ...newMedia]);
      console.log('Media picked successfully:', newMedia.length, 'items');
    } else {
      console.log('Media picker cancelled');
    }
  } catch (error) {
    console.error('Error picking media:', error);
    Alert.alert('Error', 'Failed to pick media. Please try again.');
  }
};


  const handleCameraButtonPress = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Camera is not available on web platform.');
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera access to take photos and videos. Please grant permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openAppSettings },
          ]
        );
        return;
      }

      // Show action sheet to choose camera type
      Alert.alert(
        'Camera',
        'Choose what you want to capture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => takeFromCamera('photo') },
          { text: 'Record Video', onPress: () => takeFromCamera('video') },
        ]
      );
    } catch (error) {
      console.error('Error handling camera button press:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const takeFromCamera = async (type: 'photo' | 'video') => {
    try {
      let mediaTypes = ImagePicker.MediaTypeOptions.Images;
      if (type === 'video') {
        mediaTypes = ImagePicker.MediaTypeOptions.Videos;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoQuality: ImagePicker.VideoQuality?.High || 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'photo';
        const sizeBytes = mediaType === 'video' ? await getLocalFileSizeBytes(asset.uri) : null;
        if (mediaType === 'video') {
          if (sizeBytes != null && sizeBytes > POST_VIDEO_MAX_SIZE_BYTES) {
            Alert.alert('Video too large', `Maximum video size is ${POST_VIDEO_MAX_SIZE_MB}MB.`);
            return;
          }
          if (selectedMedia.some((m) => m.mediaType === 'video')) {
            Alert.alert('One video only', 'This post already has a video. Remove it before recording another.');
            return;
          }
        }

        const newMedia: GalleryMedia[] = [{
          id: `camera_${Date.now()}_0`,
          uri: asset.uri,
          width: asset.width || 300,
          height: asset.height || 400,
          mediaType,
          duration: asset.duration,
          fileSizeBytes: sizeBytes,
        }];

        setSelectedMedia(prev => [...prev, ...newMedia]);
        console.log('Camera media captured successfully:', newMedia.length, 'items');
      } else {
        console.log('Camera capture cancelled');
      }
    } catch (error) {
      console.error('Error taking from camera:', error);

      if (error.message?.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Unable to access camera. Please check your permissions in device settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to capture media. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleMediaView = (media: GalleryMedia) => {
    setViewingMedia(media);
  };

  const handleSubmit = async () => {
    try {
      if (isSubmitting) return;
      
      // Disable input immediately when share button is clicked
      setIsSubmittingLocal(true);
      
      // Validation
      if (!postText.trim() && selectedMedia.length === 0) {
        setIsSubmittingLocal(false); // Re-enable if validation fails
        Toast.show({
          type: 'error',
          text1: 'Add content',
          text2: 'Write a caption or select at least one photo/video.',
        });
        return;
      }
      
      // Validate character limit
      if (postText.length > 500) {
        setIsSubmittingLocal(false);
        const excessChars = postText.length - 500;
        Toast.show({
          type: 'error',
          text1: 'Text Too Long',
          text2: `Your post exceeds the 500 character limit by ${excessChars} character${excessChars > 1 ? 's' : ''}. Please shorten your text to continue.`,
          visibilityTime: 4000,
        });
        return;
      }

      const mediaError = await validateSelectedMedia();
      if (mediaError) {
        setIsSubmittingLocal(false);
        Toast.show({
          type: 'error',
          text1: 'Invalid media',
          text2: mediaError,
          visibilityTime: 4000,
        });
        return;
      }

      // Get auth token
      const token = await SecureStore.getItemAsync('auth_token');
      console.log("The Token is: ", token);
      if (!token) {
        setIsSubmittingLocal(false); // Re-enable if auth fails
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please log in again to create posts',
        });
        return;
      }

      // Prepare FormData
      const formData = new FormData();

      // Add text content
      if (postText.trim()) {
        formData.append('title', postText.trim());
        formData.append('content', postText.trim());
      }

      // Process and add media files
      const uploadFiles: PostUploadFile[] = [];
      if (selectedMedia.length > 0) {
        console.log(`📸 Processing ${selectedMedia.length} media file(s)...`);
        for (let i = 0; i < selectedMedia.length; i++) {
          const media = selectedMedia[i];

          try {
            // Skip existing media that hasn't changed (starts with 'existing_')
            if (media.id.startsWith('existing_') && isEditMode) {
              console.log(`⏭️ Skipping existing media: ${media.id}`);
              continue;
            }

            const fileExtension = media.mediaType === 'video' ? 'mp4' : 'jpg';
            const mimeType = media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const fileName = `media_${Date.now()}_${i}.${fileExtension}`;
            const localUri = await ensureLocalFileUri(media.uri, fileExtension);

            console.log(`📎 Adding media ${i + 1}/${selectedMedia.length}: ${fileName} (${media.mediaType})`);

            const file: PostUploadFile = {
              uri: localUri,
              name: fileName,
              type: mimeType,
            };
            uploadFiles.push(file);
            formData.append('media[]', file as any);
          } catch (error) {
            console.warn(`❌ Error processing media ${i}:`, error instanceof Error ? error.message : error);
            Toast.show({
              type: 'error',
              text1: 'Media Processing Error',
              text2: `Failed to process media file ${i + 1}`,
            });
            setIsSubmittingLocal(false);
            return;
          }
        }
        console.log(`✅ All media files processed successfully`);
      }

      // If no media, add media_url as fallback (for API compatibility)
      if (selectedMedia.length === 0 && postText.trim()) {
        formData.append('media_url', '');
      }

      // Log FormData contents for debugging
      console.log('📦 FormData prepared:', {
        hasText: !!postText.trim(),
        mediaCount: selectedMedia.length,
        isEditMode,
      });

      // Call appropriate mutation based on mode
      if (isEditMode && postId) {
        console.log('🔄 Updating post with ID:', postId);
        updatePostMutation.mutate({
          postId,
          data: formData,
          token,
        });
      } else {
        console.log('✨ Creating new post');
        const clientId = `upload-${Date.now()}`;
        const userId = await getCurrentUserId();
        if (!userId) {
          setIsSubmittingLocal(false);
          Toast.show({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'Please log in again to create posts',
          });
          return;
        }

        await addPendingPost({
          clientId,
          userId,
          status: 'uploading',
          createdAt: Date.now(),
          caption: postText.trim() || undefined,
          thumbnailUri: null,
        });

        const fields = postText.trim()
          ? { title: postText.trim(), content: postText.trim() }
          : undefined;

        // Start upload in module scope BEFORE navigating — screen unmount must not cancel it.
        enqueuePostUpload({
          clientId,
          userId,
          token,
          data: formData,
          files: uploadFiles,
          fields,
        });

        notifyUploadStarted('post');
        setIsSubmittingLocal(false);
        router.replace('/(tabs)');
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setIsSubmittingLocal(false); // Re-enable input on error
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: 'Failed to prepare post data. Please try again.',
      });
    }
  };

  // Show loading state while fetching post data in edit mode
  if (isEditMode && isLoadingPost) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isEditMode ? 'Loading post data...' : 'Loading gallery...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isEditMode && isPostLoadError && !isLoadingPost) {
    const errMsg =
      postLoadError instanceof Error && postLoadError.message === 'Not authenticated'
        ? 'Please sign in again to edit this post.'
        : 'Could not load this post. Check your connection or try again.';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <View style={[styles.loadingContainer, { paddingHorizontal: 24 }]}>
          <Text style={[styles.loadingText, { textAlign: 'center', marginBottom: 20 }]}>{errMsg}</Text>
          <TouchableOpacity
            style={styles.errorActionBtn}
            onPress={() => refetchPost()}
          >
            <Text style={styles.errorActionBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.errorActionBtn, styles.errorActionBtnSecondary]} onPress={() => router.back()}>
            <Text style={[styles.errorActionBtnText, { color: dark ? '#fff' : '#333' }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !isEditMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
      <Header
        onSubmit={handleSubmit}
        // || updatePostMutation.isPending
        isLoading={isSubmitting}
        isEditMode={isEditMode}
      />
      <UserSection postText={postText} onTextChange={setPostText} disabled={isSubmitting} />
      <Text
        style={[
          styles.mediaHint,
          { color: theme.dark ? '#aaa' : '#666' },
        ]}
      >
        {POST_VIDEO_LIMIT_LABEL} Photos and videos are shown in full in the feed (letterboxed if needed).
      </Text>
      {Platform.OS === 'android' && galleryMedia.length === 0 && (
        <Text style={[styles.androidPickerHint, { color: theme.dark ? '#888' : '#777' }]}>
          Tap Add Media or Camera below to choose photos and videos.
        </Text>
      )}
      <SelectedMedia
        selectedMedia={selectedMedia}
        onRemoveMedia={handleMediaRemove}
        onViewMedia={handleMediaView}
        disabled={isSubmitting}
      />
      <GalleryGrid
        media={galleryMedia}
        selectedMedia={selectedMedia}
        onMediaSelect={handleMediaSelect}
        onGalleryButtonPress={handleGalleryButtonPress}
        onCameraButtonPress={handleCameraButtonPress}
        onViewMedia={handleMediaView}
        helperText={Platform.OS === 'android' ? POST_VIDEO_LIMIT_LABEL : undefined}
        disabled={isSubmitting}
      />
      <MediaViewModal
        media={viewingMedia}
        visible={!!viewingMedia}
        onClose={() => setViewingMedia(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mediaHint: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 16,
    marginBottom: 4,
    marginTop: 4,
  },
  androidPickerHint: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorActionBtn: {
    backgroundColor: '#C61F3A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  errorActionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  errorActionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});