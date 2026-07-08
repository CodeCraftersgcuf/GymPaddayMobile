import React from 'react';
import { StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import images from '@/constants/images';

/**
 * Shared cached image built on expo-image.
 * - Disk + memory cache so images never re-download on scroll-back.
 * - `recyclingKey` lets FlatList reuse decoded bitmaps correctly on cell recycle.
 * - Small crossfade transition to avoid harsh pop-in (Instagram-like).
 */
export type CachedImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  transition?: number;
  /** When false, the uri is used as-is (already-resolved or local). */
  resolve?: boolean;
  recyclingKey?: string | null;
  placeholder?: any;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: () => void;
};

function CachedImageComponent({
  uri,
  style,
  contentFit = 'cover',
  transition = 150,
  resolve = true,
  recyclingKey,
  placeholder,
  priority = 'normal',
  onLoad,
  onError,
}: CachedImageProps) {
  const src = resolve ? resolveMediaUrl(uri) : uri ?? null;
  return (
    <Image
      source={src ? { uri: src } : undefined}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey ?? src ?? undefined}
      placeholder={placeholder}
      priority={priority}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

export const CachedImage = React.memo(CachedImageComponent);

const DEFAULT_AVATAR = images.moreUser;

export type CachedAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  transition?: number;
};

/**
 * Cached circular avatar. Falls back to a local user icon when no uri.
 * Use everywhere avatars appear in lists to stop re-downloads / flicker.
 */
function CachedAvatarComponent({
  uri,
  size = 40,
  style,
  borderRadius,
  borderWidth,
  borderColor,
  transition = 150,
}: CachedAvatarProps) {
  const resolved = resolveMediaUrl(uri);
  const radius = borderRadius ?? size / 2;

  const baseStyle: ViewStyle & ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    backgroundColor: '#e1e1e1',
  };
  if (borderWidth) {
    baseStyle.borderWidth = borderWidth;
    baseStyle.borderColor = borderColor ?? '#fff';
  }

  return (
    <Image
      source={resolved ? { uri: resolved } : DEFAULT_AVATAR}
      style={[baseStyle, style]}
      contentFit="cover"
      transition={transition}
      cachePolicy="memory-disk"
      recyclingKey={resolved ?? 'default-avatar'}
    />
  );
}

export const CachedAvatar = React.memo(CachedAvatarComponent);

export default CachedImage;
