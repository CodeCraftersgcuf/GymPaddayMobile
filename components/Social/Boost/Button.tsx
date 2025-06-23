import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';

type ButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary';
  isDark: boolean;
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isDark,
  disabled = false,
}) => {
  const theme = isDark ? colors.dark : colors.light;

  const getButtonStyle = (): ViewStyle => {
    if (disabled) {
      return { backgroundColor: theme.textSecondary };
    }

    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.light.primary };
      case 'secondary':
        return { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border };
      default:
        return { backgroundColor: colors.light.primary };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'secondary') {
      return theme.text;
    }
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: getTextColor() }]}>{title}</Text>
    </TouchableOpacity>
  );
};

type Styles = {
  button: ViewStyle;
  buttonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
