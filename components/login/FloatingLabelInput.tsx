import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/themeContext";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";

// 🔹 Props
interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  error?: string;
  isPassword?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  error,
  isPassword = false,
  ...props
}) => {
  const { dark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(true);

  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: "absolute" as const,
    left: 10,
    color: dark ? "white" : "black",
    backgroundColor: "transparent",
    zIndex: 1,
    paddingHorizontal: 0,
    transform: [
      {
        translateY: animatedIsFocused.interpolate({
          inputRange: [0, 1],
          outputRange: [16, -8],
        }),
      },
    ],
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [dark ? "white" : "black", dark ? "red" : "black"],
    }),
    backgroundColor: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["transparent", dark ? "black" : "white"],
    }),
    paddingLeft: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 5],
    }),
    height: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 16],
    }),
  };

  const toggleSecure = () => setSecure(!secure);

  const styles = StyleSheet.create({
    inputContainer: {
      position: "relative",
      marginBottom: 20,
    },
    input: {
      backgroundColor: dark ? "#252525" : "#FAFAFA",
      paddingTop: 18,
      paddingBottom: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: isFocused ? "red" : "#ccc",
      color: dark ? "white" : "#121212",
    },
    hoverInput: {
      backgroundColor: "transparent",
      borderColor: "red",
    },
    errorInput: {
      borderColor: "#FF4444",
    },
    error: {
      color: "#FF4444",
      fontSize: 12,
      marginTop: 4,
      paddingLeft: 5,
    },
    eyeIcon: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      width: 40,
      zIndex: 3,
    },
    inputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
  });

  return (
    <View style={styles.inputContainer}>
      {/* Animated Label */}
      <Animated.Text
        onPress={() => setIsFocused(true)}
        style={labelStyle}
      >
        {label}
      </Animated.Text>

      <View style={styles.inputWrapper}>
        <TextInput
          autoComplete="off"
          style={[
            styles.input,
            (isFocused || value) && styles.hoverInput,
            isPassword && { paddingRight: 40 },
            error && styles.errorInput,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          secureTextEntry={isPassword && secure}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default FloatingLabelInput;
