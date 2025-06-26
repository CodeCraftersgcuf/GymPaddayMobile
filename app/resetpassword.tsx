import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, images } from "@/constants";
import { Image } from "expo-image";
import { validationSignInSchema } from "@/constants/validation";
import { Formik } from "formik";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FloatingLabelInput from "@/components/login/FloatingLabelInput";
import ThemeText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";

// Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/utils/mutations/auth";
import Toast from "react-native-toast-message";

const resetpassword = () => {
  const route = useRouter();
  const { email, otp } = useLocalSearchParams();
  const { dark } = useTheme();

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (res) => {
      Toast.show({ type: 'success', text1: res.message || 'Password reset successful' });
      route.push('/login');
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to reset password' });
    }
  });

  const handleLogin = (values: { password: string; password_confirmation: string }) => {
    mutation.mutate({
      data: {
        email,
        otp,
        password: values.password,
        password_confirmation: values.password_confirmation,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#FF0000", "#840000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 150 }}
        />

        <ThemedView
          style={{
            marginHorizontal: 20,
            borderRadius: 20,
            padding: 10,
            elevation: 5,
            shadowColor: dark ? 'white' : 'black',
            transform: [{ translateY: -50 }],
          }}
        >
          {/* Logo */}
          <ThemedView
            darkColor="transparent"
            style={{
              alignSelf: "center",
              backgroundColor: "white",
              transform: [{ translateY: -60 }],
              borderRadius: 10,
              elevation: 5,
              padding: 10,
            }}
          >
            <Image
              source={images.logo}
              style={{ width: 70, height: 70 }}
            />
          </ThemedView>

          <ThemedView darkColor="transparent" style={{ transform: [{ translateY: -40 }] }}>
            <ThemeText style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
              Change Password
            </ThemeText>
            <ThemeText style={{ fontSize: 14, color: dark ? COLORS.white : "gray", textAlign: "center" }}>
              Create new password
            </ThemeText>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <Formik
                initialValues={{ password: "", password_confirmation: "" }}
                validationSchema={validationSignInSchema}
                onSubmit={handleLogin}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <ThemedView darkColor="transparent" style={styles.card}>
                    <FloatingLabelInput
                      label="Password"
                      autoComplete="off"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={touched.password && errors.password ? errors.password : ''}
                      isPassword={true}
                    />
                    <FloatingLabelInput
                      label="Confirm Password"
                      autoComplete="off"
                      value={values.password_confirmation}
                      onChangeText={handleChange("password_confirmation")}
                      onBlur={handleBlur("password_confirmation")}
                      error={touched.password_confirmation && errors.password_confirmation ? errors.password_confirmation : ''}
                      isPassword={true}
                    />

                    <Pressable
                      onPress={() => handleSubmit()}
                      disabled={mutation.isPending}
                      style={{
                        backgroundColor: mutation.isPending ? '#FF0000AA' : '#FF0000',
                        paddingVertical: 15,
                        borderRadius: 10,
                        opacity: mutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <ThemeText style={{ textAlign: 'center', color: 'white', fontWeight: '500', fontSize: 16 }}>
                        {mutation.isPending ? 'Processing...' : 'Proceed'}
                      </ThemeText>
                    </Pressable>
                  </ThemedView>
                )}
              </Formik>
            </KeyboardAvoidingView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ flex: 1, justifyContent: "flex-end" }}>
          <ThemeText style={{ textAlign: "center", paddingHorizontal: 30, paddingBottom: 20 }}>
            By continuing you agree to gym paddy’s{" "}
            <ThemeText style={{ color: 'red' }}>terms of use</ThemeText> and{" "}
            <ThemeText style={{ color: 'red' }}>privacy policy</ThemeText>.
          </ThemeText>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
});

export default resetpassword;
