import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/themeContext";
import ThemedView from "@/components/ThemedView";
import ThemeText from "@/components/ThemedText";
import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

const VerifyOtpScreen = () => {
  const { dark } = useTheme();
  const themedark = dark;
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<TextInput[]>([]);

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('https://gympaddy.hmstech.xyz/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join('') }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.message || 'Verification failed');
      }

      return response.json();
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'OTP Verified!',
        text2: 'Account created successfully. Please login.',
      });
      // Use replace to prevent going back to signup flow
      router.replace("/login");
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: error.message,
      });
    },
  });

  const handleChange = (index: number, value: string) => {
    if (/^\d$/.test(value) || value === "") {
      const updated = [...otp];
      updated[index] = value;
      setOtp(updated);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (!value && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (otp.join('').length === 6) {
      verifyOtpMutation.mutate();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Please enter the full OTP',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemeText style={styles.title}>Enter OTP</ThemeText>
          <ThemeText style={styles.subtitle}>
            We’ve sent a 6-digit OTP to{" "}
            <ThemeText style={styles.emailHighlight}>{email}</ThemeText>
          </ThemeText>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, themedark && styles.otpBoxDark]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleChange(index, val)}
              />
            ))}
          </View>

          <Pressable onPress={handleSubmit} style={styles.verifyButton}>
            <ThemeText style={styles.verifyText}>Verify</ThemeText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default VerifyOtpScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF0000",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
    marginBottom: 30,
  },
  emailHighlight: {
    color: "#FF0000",
    fontWeight: "bold",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 30,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 10,
    borderColor: "#FF0000",
    borderWidth: 2,
    textAlign: "center",
    fontSize: 20,
    color: "#000",
    backgroundColor: "#fff",
  },
  otpBoxDark: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  verifyButton: {
    backgroundColor: "#FF0000",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 16,
  },
  verifyText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
