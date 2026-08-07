import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import images from '@/constants/images';

type BrandLogoProps = {
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
};

/** Light full wordmark / dark GP mark — both are OTA-updatable assets. */
export default function BrandLogo({ style, resizeMode = 'contain' }: BrandLogoProps) {
  const { dark } = useTheme();
  return (
    <Image
      source={dark ? images.logoDark : images.logo}
      style={style}
      resizeMode={resizeMode}
    />
  );
}
