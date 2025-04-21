import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/themeContext";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
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

  const toggleSecure = () => setSecure(!secure);
  const styles = StyleSheet.create({
    inputContainer: {
      position: "relative",
      marginBottom: 20,
    },
    label: {
      color: dark ? 'white' : "black",
      position: "absolute",
      top:16,
      left: 10,
      fontSize: 16,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      zIndex:1
    },
    hoverLabel: {
      top: -8,
      left: 10,
      fontSize: 12,
      backgroundColor: dark ? 'black' : "white",
      color: dark ? 'red' : "black",
      paddingHorizontal: 5,
      zIndex: 1,
      height: 16,
    },
    focusedLabel: {
      color: "red",
    },
    errorLabel: {
      color: "red",
    },
    input: {
      backgroundColor: dark ? '#252525' : "#FAFAFA",
      paddingTop: 18,
      paddingBottom: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      // borderColor: "red",
      color: dark ? 'white' : '#121212'
    },
    hoverInput: {
      backgroundColor: "transparent",
      paddingTop: 18,
      borderColor:'red',
      paddingBottom: 10,
    },
    focusedInput: {
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
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      zIndex: 3,
    },
    inputWrapper: {
      position: "relative",
      justifyContent: 'center',
    },
  });


  return (

    <View style={styles.inputContainer}>

      {/* Label */}
      <Text
        onPress={() => setIsFocused(true)}
        style={[
          styles.label,
          (isFocused || value) && styles.hoverLabel,
        ]}
      >
        {label}
      </Text>

      <View style={styles.inputWrapper}>

        {/* Input */}

        <TextInput
          autoComplete="off"
          style={[
            styles.input,
            (isFocused || value) && styles.hoverInput,
            isPassword && { paddingRight: 40 }, // Add space for eye icon
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          secureTextEntry={isPassword && secure}
          {...props}
        />
        {/* Eye Icon for Password */}
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
      {/* Error */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};



export default FloatingLabelInput;
