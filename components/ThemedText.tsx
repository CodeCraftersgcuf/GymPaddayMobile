import React from 'react';
import { Text, StyleSheet, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/themeContext';

const defaultLightThemeColors = {
  text: '#121212',
};

const defaultDarkThemeColors = {
  text: '#FFFFFF',
};

interface ThemeTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

const ThemeText: React.FC<ThemeTextProps> = ({
  style,
  children,
  lightColor,
  darkColor,
  ...rest
}) => {

  const { dark } = useTheme();
  let themeBasedColor: string;
  if (dark) {

    themeBasedColor = darkColor || defaultDarkThemeColors.text;
  } else {
    themeBasedColor = lightColor || defaultLightThemeColors.text;
  }
  const combinedStyle: TextStyle = StyleSheet.flatten([
    { color: themeBasedColor },
    style,
  ]);
  return (
    <Text style={combinedStyle} {...rest}>
      {children}
    </Text>
  );
};

export default ThemeText;