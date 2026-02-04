import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/themeContext";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  Platform,
} from "react-native";

// Common country codes - focusing on African countries and major ones
const COUNTRIES = [
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+1", name: "US/CA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+86", name: "China", flag: "🇨🇳" },
];

interface FloatingLabelPhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

const FloatingLabelPhoneInput: React.FC<FloatingLabelPhoneInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  countryCode: externalCountryCode,
  onCountryCodeChange,
}) => {
  const { dark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  // Extract phone number from value (remove country code)
  const extractPhoneNumber = (fullPhone: string, code: string) => {
    if (!fullPhone) return "";
    // Remove the country code if it exists
    const codePattern = code.replace("+", "\\+");
    const regex = new RegExp(`^${codePattern}`);
    return fullPhone.replace(regex, "");
  };

  // Detect country code from value if present
  const detectCountryCode = (val: string): string => {
    if (!val) return externalCountryCode || "+234";
    const codeMatch = val.match(/^\+?\d{1,4}/);
    if (codeMatch) {
      return codeMatch[0].startsWith("+") ? codeMatch[0] : "+" + codeMatch[0];
    }
    return externalCountryCode || "+234";
  };

  const initialCountryCode = value ? detectCountryCode(value) : (externalCountryCode || "+234");
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(() => extractPhoneNumber(value || "", initialCountryCode));

  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || phoneNumber ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, phoneNumber]);

  useEffect(() => {
    if (externalCountryCode) {
      setCountryCode(externalCountryCode);
    }
  }, [externalCountryCode]);

  useEffect(() => {
    // Update parent with full phone number (country code + phone)
    const fullPhone = countryCode + phoneNumber;
    onChangeText(fullPhone);
  }, [countryCode, phoneNumber]);

  const handlePhoneChange = (text: string) => {
    // Only allow digits, limit to 11 digits
    const digitsOnly = text.replace(/[^\d]/g, "").slice(0, 11);
    setPhoneNumber(digitsOnly);
  };

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    if (onCountryCodeChange) {
      onCountryCodeChange(code);
    }
    setShowCountryPicker(false);
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const labelStyle = {
    position: "absolute" as const,
    left: 90, // Adjusted for country code button
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
      outputRange: [dark ? "white" : "black", dark ? "#cfcfcf" : "#444"],
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

  const styles = StyleSheet.create({
    inputContainer: {
      position: "relative",
      marginBottom: 20,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#252525" : "#FAFAFA",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: error ? "#FF4444" : isFocused ? (dark ? "#666" : "#888") : "#ccc",
    },
    countryCodeButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 18,
      borderRightWidth: 1,
      borderRightColor: dark ? "#444" : "#ddd",
    },
    countryCodeButtonText: {
      fontSize: 16,
      color: dark ? "white" : "#121212",
      marginRight: 4,
    },
    input: {
      flex: 1,
      paddingTop: 18,
      paddingBottom: 10,
      paddingHorizontal: 15,
      fontSize: 16,
      color: dark ? "white" : "#121212",
    },
    error: {
      color: "#FF4444",
      fontSize: 12,
      marginTop: 4,
      paddingLeft: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: dark ? "#252525" : "white",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      paddingTop: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#444" : "#eee",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: dark ? "white" : "#121212",
    },
    countryItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#333" : "#f0f0f0",
    },
    countryFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    countryInfo: {
      flex: 1,
    },
    countryName: {
      fontSize: 16,
      color: dark ? "white" : "#121212",
    },
    countryCodeDisplay: {
      fontSize: 14,
      color: dark ? "#999" : "#666",
      marginTop: 2,
    },
  });

  return (
    <View style={styles.inputContainer}>
      <Animated.Text onPress={() => setIsFocused(true)} style={labelStyle}>
        {label}
      </Animated.Text>

      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.countryCodeButton}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.countryCodeButtonText}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCodeButtonText}>{countryCode}</Text>
          <Ionicons name="chevron-down" size={16} color={dark ? "#999" : "#666"} />
        </TouchableOpacity>

        <TextInput
          autoComplete="off"
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          placeholder=""
          placeholderTextColor={dark ? "#666" : "#999"}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={dark ? "white" : "#121212"} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item.code)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryCodeDisplay}>{item.code}</Text>
                  </View>
                  {countryCode === item.code && (
                    <Ionicons name="checkmark" size={20} color="#940304" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FloatingLabelPhoneInput;

