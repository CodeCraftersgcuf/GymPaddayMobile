import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextStyle } from "react-native";
import { useTheme } from "@/contexts/themeContext";

interface Props {
  label: string;
  value: string;
  error?: string;
  onPress: () => void;
}

const FloatingLabelGenderPicker: React.FC<Props> = ({ label, value, error, onPress }) => {
  const { dark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useState(new Animated.Value(value ? 1 : 0))[0];

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle: Animated.WithAnimatedObject<TextStyle> = {
    position: "absolute",
    left: 5,
    backgroundColor: dark ? 'black' : 'white' ,
    color: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: dark ? ["white", "#FF0000"] : ["black", "#FF0000"],
    }),
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    paddingHorizontal:5
  };
  const styles = StyleSheet.create({
    container: {
      height: 56,
      borderWidth: 1,
      borderColor: "black",
      borderRadius: 6,
      paddingHorizontal: 10,
      justifyContent: "center",
      marginBottom: 20,
      backgroundColor: dark ? value != '' ? 'transparent':'#252525' : 'white',
    },
    focusContainer :{
      borderColor: 'red',
    },
    valueText: {
      color: dark ? 'white' : 'black',
      fontSize: 16,
    },
    icon: {
      position: "absolute",
      right: 10,
      top: 18,
    },
    errorBorder: {
      borderColor: "#FF0000",
    },
    errorText: {
      color: "#FF0000",
      fontSize: 12,
      marginTop: 4,
    },
    labelbg :{
      backgroundColor:dark ? 'black' : 'white',
    }
  });

  return (
    <Pressable onPress={onPress} onPressIn={() => setIsFocused(true)} onPressOut={() => setIsFocused(false)}>
      <View style={[styles.container, error && styles.errorBorder , isFocused && styles.focusContainer , value && styles.focusContainer ]}>
        <Animated.Text style={[labelStyle ,!isFocused && styles.labelbg ]}>{label}</Animated.Text>
        <Text style={styles.valueText}>{value || ""}</Text>
        {/* <Ionicons name="chevron-down" size={18} color="#999" style={styles.icon} /> */}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Pressable>
  );
};

export default FloatingLabelGenderPicker;
