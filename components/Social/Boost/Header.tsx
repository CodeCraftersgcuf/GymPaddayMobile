import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from './colors';

type HeaderProps = {
  title: string;
  onBack: () => void;
  isDark: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
};

const Header: React.FC<HeaderProps> = ({ title, onBack, isDark, rightIcon, onRightPress }) => {
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Icon name="arrow-back-ios" size={24} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
          <Icon name={rightIcon} size={24} color={theme.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

type Style = {
  container: ViewStyle;
  backButton: ViewStyle;
  title: TextStyle;
  rightButton: ViewStyle;
};

const styles = StyleSheet.create<Style>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  rightButton: {
    padding: 8,
  },
});

export default Header;
