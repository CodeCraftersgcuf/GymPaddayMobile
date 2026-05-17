import { Platform } from 'react-native';

/** Android package from app.json */
export const ANDROID_APP_PACKAGE = 'com.pejul.gympaddy';

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_APP_PACKAGE}`;

/** Set to your App Store product link when available; search works without an ID. */
export const IOS_APP_STORE_URL = 'https://apps.apple.com/search?term=GymPaddy';

export function getAppDownloadUrl(): string {
  return Platform.OS === 'ios' ? IOS_APP_STORE_URL : PLAY_STORE_URL;
}

export function getAppShareMessage(): string {
  return `Join me on GymPaddy — fitness, marketplace & more. Download the app: ${getAppDownloadUrl()}`;
}
