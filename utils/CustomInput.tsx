import React, { useState, FC, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/contexts/themeContext';
import { Image } from 'expo-image';
import FONTS from '@/constants/fonts';
import Icons from '@/constants/icons';

type InputType = string | number | boolean;

interface InputProps extends TextInputProps {
  id: string;
  icon?: string;
  label: string;
  errorText?: string;
  checked?: boolean;
  isEditable?: boolean;
  prefilledValue?: string;
  sendCode?: boolean; // Prop to control Send Code button visibility
  onEditPress?: () => void;
  onSendCodePress?: () => void;
  showCheckbox?: boolean;
  fontWeight?: 'normal' | 'bold' | '500';
}

const Input: FC<InputProps> = (props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [labelPosition] = useState(new Animated.Value(18));
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { dark } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelPosition, {
      toValue: 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
    if (!props.value) {
      Animated.timing(labelPosition, {
        toValue: 5,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: dark ? '#161616' : 'transparent' },
          props.errorText
            ? styles.errorInput
            : {
                borderColor: isFocused
                  ? COLORS.primary
                  : dark
                  ? 'transparent'
                  : COLORS.greyscale300,
              },
        ]}
      >
        {props.icon && (
          <Image
            source={props.icon}
            style={[styles.icon, { tintColor: isFocused ? COLORS.primary : '#BCBCBC' }]}
          />
        )}

        <TextInput
          {...props}
          secureTextEntry={props.id === 'password' && !isPasswordVisible}
          editable={props.isEditable !== false}
          onFocus={handleFocus}
          id={props.id}
          ref={inputRef}
          placeholderTextColor={isFocused ? COLORS.primary : '#BCBCBC'}
          style={[
            styles.input,
            {
              color: dark ? COLORS.white : COLORS.black,
              fontWeight: props.fontWeight || FONTS.Regular,
              paddingLeft: props.icon ? 40 : 15,
              paddingRight: props.sendCode ? 90 : 40, // Adjust padding for button
              borderColor: props.errorText
                ? COLORS.error
                : isFocused
                ? COLORS.primary
                : COLORS.greyscale300,
            },
          ]}
        />

        {props.id === 'password' && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconContainer}
          >
            <Image
              source={isPasswordVisible ? Icons.eye : Icons.eye}
              style={[styles.icon, { tintColor: isFocused ? COLORS.primary : '#BCBCBC' }]}
            />
          </TouchableOpacity>
        )}

        {props.sendCode && (
          <TouchableOpacity
            onPress={props.onSendCodePress}
            style={[styles.sendCodeButton, { borderColor: COLORS.primary }]}
          >
            <Text style={styles.sendCodeText}>Send Code</Text>
          </TouchableOpacity>
        )}

        {props.label && (
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelPosition,
                fontSize: isFocused || props.value ? 12 : 16,
                color: props.errorText
                  ? COLORS.red
                  : isFocused || props.value
                  ? COLORS.primary
                  : dark
                  ? COLORS.gray
                  : COLORS.greyscale600,
              },
            ]}
            onPress={() => inputRef.current?.focus()}
          >
            {props.label}
          </Animated.Text>
        )}
      </View>

      {props.errorText && <Text style={styles.errorText}>{props.errorText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 10,
  },
  inputContainer: {
    borderRadius: SIZES.padding,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  input: {
    width: '100%',
    fontSize: SIZES.body3,
    paddingVertical: 16,
    color: COLORS.black,
    position: 'relative',
    borderRadius: SIZES.padding,
  },
  iconContainer: {
    position: 'absolute',
    right: 10,
    top: '35%',
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    position: 'absolute',
    left: 15,
    top: 13,
    bottom: 5,
    fontSize: 16,
    transitionProperty: 'all',
    transitionDuration: '0.3s',
    transitionTimingFunction: 'ease-in-out',
  },
  sendCodeButton: {
    position: 'absolute',
    right: 15,
    top: '30%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCodeText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    fontWeight: '400',
  },
});

export default Input;
