import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { requestMediaLibraryWritePermissions } from '@/utils/mediaLibraryPermissions';

/**
 * Downloads a remote image/video URL to the device gallery (GymPaddy album).
 * Shared by the feed post item and the Reels viewer.
 */
export async function downloadMedia(mediaUrl?: string | null): Promise<void> {
  try {
    if (!mediaUrl) {
      Alert.alert('No media', 'No image or video to download.');
      return;
    }

    const fileExtension = mediaUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'm3u8'].includes(fileExtension);

    const granted = await requestMediaLibraryWritePermissions();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow media library access to save files.');
      return;
    }

    const timestamp = Date.now();
    const mediaType = isVideo ? 'video' : 'image';
    const safeExt = fileExtension === 'm3u8' ? 'mp4' : fileExtension;
    const uniqueFileName = `GymPaddy_${mediaType}_${timestamp}.${safeExt}`;
    const downloadUri = `${FileSystem.cacheDirectory}${uniqueFileName}`;

    const downloadResumable = FileSystem.createDownloadResumable(mediaUrl, downloadUri);
    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || !downloadResult.uri) {
      throw new Error('Download failed - no file URI returned');
    }

    let finalUri = downloadResult.uri;
    if (isVideo) {
      const finalFileUri = `${FileSystem.documentDirectory}GymPaddy_Video_${timestamp}.${safeExt}`;
      await FileSystem.copyAsync({ from: downloadResult.uri, to: finalFileUri });
      const fileInfo = await FileSystem.getInfoAsync(finalFileUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to create video file copy');
      }
      finalUri = finalFileUri;
    }

    const asset = await MediaLibrary.createAssetAsync(finalUri);
    try {
      await MediaLibrary.createAlbumAsync('GymPaddy', asset, false);
    } catch (albumError) {
      console.log('Album creation failed, saving to default gallery:', albumError);
    }

    try {
      if (downloadResult.uri !== finalUri) {
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      }
    } catch (cleanupError) {
      console.log('Cleanup error (non-critical):', cleanupError);
    }

    Alert.alert('Downloaded', `${isVideo ? 'Video' : 'Image'} saved to your gallery.`);
  } catch (error: any) {
    Alert.alert('Download Error', error?.message || 'Failed to download media. Please try again.');
    console.error('Download error:', error);
  }
}
