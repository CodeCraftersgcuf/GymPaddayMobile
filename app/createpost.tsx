import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-media-library';
import Header from '@/components/Social/createpost/Header';
import UserSection from '@/components/Social/createpost/UserSection';
import SelectedMedia from '@/components/Social/createpost/SelectedMedia';
import GalleryGrid from '@/components/Social/createpost/GalleryGrid';
import MediaViewModal from '@/components/Social/createpost/MediaViewModal';
import { useTheme } from '@/contexts/themeContext';
import { useLocalSearchParams } from 'expo-router';

//Code related to integration
import { useMutation, useQuery } from '@tanstack/react-query';
import { createPost, updatePost } from '@/utils/mutations/posts';
import { getPostById } from '@/utils/queries/posts';
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
}

export default function CreatePostScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const isEditMode = Boolean(postId);
  console.log("is Edit mode ", isEditMode);

  const [galleryMedia, setGalleryMedia] = useState<GalleryMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<GalleryMedia[]>([]);
  const [postText, setPostText] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingMedia, setViewingMedia] = useState<GalleryMedia | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const { dark } = useTheme();
  const router = useRouter();
  const  tokenn = async ()=>{
    const token = await SecureStore.getItemAsync('auth_token');
    return token;
  }
  // Fetch existing post data if in edit mode
  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(parseInt(postId), tokenn()),
    enabled: isEditMode && !!postId,
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

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      console.log('🎉 Post Created Successfully:', data);
      Toast.show({
        type: 'success',
        text1: 'Post Created!',
        text2: 'Your post has been shared successfully',
        visibilityTime: 500,
      });
      setTimeout(() => router.back(), 600);
    },
    onError: (error: any) => {
      console.error('❌ Post Creation Error:', error);
      handleMutationError(error, 'Failed to Create Post');
    },
  });

  // Update post mutation
  // const updatePostMutation = ()=>{
  //   console.log('📝 Updating Post...')
  // }
  const updatePostMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (data) => {
      console.log('🎉 Post Updated Successfully:', data);
      Toast.show({
        type: 'success',
        text1: 'Post Updated!',
        text2: 'Your post has been updated successfully',
        visibilityTime: 500,
      });
      setTimeout(() => router.back(), 600);
    },
    onError: (error: any) => {
      console.error('❌ Post Update Error:', error);
      handleMutationError(error, 'Failed to Update Post');
    },
  });

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
        setPermissionStatus(MediaLibrary.PermissionStatus.GRANTED);
        setLoading(false);
        console.log('Web platform detected - using placeholder media');
        return;
      }

      // Request permission for mobile platforms
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status);
      console.log('Media library permission status:', status);

      if (status === MediaLibrary.PermissionStatus.GRANTED) {
        await loadGalleryMedia();
      } else {
        Alert.alert(
          'Permission Required',
          'This app needs access to your photo library to display media.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => MediaLibrary.requestPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryMedia = async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: [MediaType.photo, MediaType.video],
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
      console.log(`Loaded ${media.length} media items from gallery`);
    } catch (error) {
      console.error('Error loading gallery media:', error);
      Alert.alert('Error', 'Failed to load gallery media');
    }
  };

  const handleMediaSelect = (media: GalleryMedia) => {
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
            { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
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
      let mediaTypes = ImagePicker.MediaTypeOptions.All;
      if (type === 'photo') {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else if (type === 'video') {
        mediaTypes = ImagePicker.MediaTypeOptions.Videos;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoQuality: ImagePicker.VideoQuality?.High || 1,
        videoMaxDuration: 30,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMedia: GalleryMedia[] = result.assets.map((asset, index) => ({
          id: `picked_${Date.now()}_${index}`,
          uri: asset.uri,
          width: asset.width || 300,
          height: asset.height || 400,
          mediaType: asset.type === 'video' ? 'video' : 'photo',
          duration: asset.duration,
        }));

        setSelectedMedia(prev => [...prev, ...newMedia]);
        console.log('Media picked successfully:', newMedia.length, 'items');

        Alert.alert(
          'Success',
          `${newMedia.length} media item(s) added to your post!`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('Media selection cancelled or no assets selected');
      }
    } catch (error) {
      console.error('Error picking media:', error);

      if (error.message?.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Unable to access media library. Please check your permissions in device settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to select media. Please try again or select from gallery below.',
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
      // Validation
      if (!postText.trim() && selectedMedia.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Empty Post',
          text2: 'Please add some content or media to your post',
        });
        return;
      }

      // Get auth token
      const token = await SecureStore.getItemAsync('auth_token');
      console.log("The Token is: ", token);
      if (!token) {
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
      if (selectedMedia.length > 0) {
        for (let i = 0; i < selectedMedia.length; i++) {
          const media = selectedMedia[i];

          try {
            // Skip existing media that hasn't changed (starts with 'existing_')
            if (media.id.startsWith('existing_') && isEditMode) {
              continue;
            }

            const fileExtension = media.mediaType === 'video' ? 'mp4' : 'jpg';
            const mimeType = media.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
            const fileName = `media_${Date.now()}_${i}.${fileExtension}`;

            formData.append('media[]', {
              uri: media.uri,
              name: fileName,
              type: mimeType,
            } as any);
          } catch (error) {
            console.error(`Error processing media ${i}:`, error);
            Toast.show({
              type: 'error',
              text1: 'Media Processing Error',
              text2: `Failed to process media file ${i + 1}`,
            });
            return;
          }
        }
      }

      // If no media, add media_url as fallback (for API compatibility)
      if (selectedMedia.length === 0 && postText.trim()) {
        formData.append('media_url', '');
      }

      // Call appropriate mutation based on mode
      if (isEditMode && postId) {
        console.log('🔄 Updating post with ID:', postId);
        // updatePostMutation();
        updatePostMutation.mutate({
          postId,
          data: formData,
          token,
        });
      } else {
        console.log('✨ Creating new post');
        createPostMutation.mutate({
          data: formData,
          token,
        });
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: 'Failed to prepare post data. Please try again.',
      });
    }
  };

  // Show loading state while fetching post data in edit mode
  if (loading || (isEditMode && isLoadingPost)) {
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

  if (permissionStatus !== MediaLibrary.PermissionStatus.GRANTED && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs access to your photo library to display media.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
      <Header
        onSubmit={handleSubmit}
        // || updatePostMutation.isPending
        isLoading={createPostMutation.isPending}
        isEditMode={isEditMode}
      />
      <UserSection postText={postText} onTextChange={setPostText} />
      <SelectedMedia
        selectedMedia={selectedMedia}
        onRemoveMedia={handleMediaRemove}
        onViewMedia={handleMediaView}
      />
      <GalleryGrid
        media={galleryMedia}
        selectedMedia={selectedMedia}
        onMediaSelect={handleMediaSelect}
        onGalleryButtonPress={handleGalleryButtonPress}
        onViewMedia={handleMediaView}
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});