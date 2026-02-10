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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verifyOtp } from "@/utils/mutations/auth";

const VerifyOtpScreen = () => {
  const { dark } = useTheme();
  const themedark = dark;
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const otpCode = otp.join('').trim();
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (otpCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }
      
      console.log('🔐 Verifying OTP:', { email, otpLength: otpCode.length });
      
      try {
        const result = await verifyOtp({
          data: {
            email: email as string,
            otp: otpCode,
          },
        });
        
        console.log('✅ OTP verification successful:', result);
        return result;
      } catch (error: any) {
        console.error('❌ OTP verification error:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          data: error?.data,
          statusCode: error?.statusCode,
          response: error?.response,
        });
        
        // Extract error message from various possible formats
        let errorMessage = 'Invalid or expired OTP. Please try again.';
        
        // Check ApiError format (from customApiCall)
        if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Provide more specific error messages
        if (errorMessage.toLowerCase().includes('expired')) {
          errorMessage = 'OTP has expired. Please request a new one.';
        } else if (errorMessage.toLowerCase().includes('invalid')) {
          errorMessage = 'Invalid OTP. Please check and try again.';
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: async () => {
      // ✅ Mark onboarding as completed to prevent redirect loop
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      
      Toast.show({
        type: 'success',
        text1: 'OTP Verified!',
        text2: 'Account created successfully. Please login.',
      });
      // Use replace to prevent going back to signup flow
      router.replace("/login");
    },
    onError: (error: any) => {
      setOtpError(true);
      const errorMessage = error?.message || 'Invalid or expired OTP. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    },
  });

  const handleChange = (index: number, value: string) => {
    if (/^\d$/.test(value) || value === "") {
      const updated = [...otp];
      updated[index] = value;
      setOtp(updated);
      if (otpError) {
        setOtpError(false);
      }

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (otp.join('').length === 6) {
      setOtpError(false);
      verifyOtpMutation.mutate();
    } else {
      setOtpError(true);
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
                style={[
                  styles.otpBox,
                  themedark && styles.otpBoxDark,
                  otpError && styles.otpBoxError,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleChange(index, val)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
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
    color: "#940304",
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
    color: "#940304",
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
    borderColor: "#ccc",
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
  otpBoxError: {
    borderColor: "#FF4444",
  },
  verifyButton: {
    backgroundColor: "#940304",
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
