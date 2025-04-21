import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/themeContext';

const defaultLightThemeColors = {
  background: '#FFFFFF',
};

const defaultDarkThemeColors = {
  background: '#121212',
};

interface ThemeViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
}

const ThemedView: React.FC<ThemeViewProps> = ({
  style,
  children,
  lightColor,
  darkColor,
  ...rest
}) => {
  const { dark } = useTheme();

  let themeBasedColor: string;
  if (dark) {
    themeBasedColor = darkColor || defaultDarkThemeColors.background;
  } else {
    themeBasedColor = lightColor || defaultLightThemeColors.background;
  }

  const combinedStyle: ViewStyle = StyleSheet.flatten([
    { backgroundColor: themeBasedColor },
    style,
  ]);

  return (
    <View style={combinedStyle} {...rest}>
      {children}
    </View>
  );
};

export default ThemedView;