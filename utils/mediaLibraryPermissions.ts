import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import type { GranularPermission } from 'expo-media-library';

const READ_GRANULAR: GranularPermission[] = ['photo', 'video'];

/** Read photos/videos via MediaLibrary (dev builds only on Android SDK 54+). */
export async function requestMediaLibraryReadPermissions(): Promise<boolean> {
  try {
    const granular = Platform.OS === 'android' ? READ_GRANULAR : undefined;
    const { status } = await MediaLibrary.requestPermissionsAsync(false, granular);
    return status === 'granted';
  } catch (err) {
    console.warn('MediaLibrary read permission unavailable:', err);
    return false;
  }
}

/** Save downloaded media to the gallery. */
export async function requestMediaLibraryWritePermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    return status === 'granted';
  } catch (err) {
    console.warn('MediaLibrary write permission unavailable:', err);
    return false;
  }
}
