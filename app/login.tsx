import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, images } from "@/constants";
import { Image } from "expo-image";
import { validationSignInSchema } from "@/constants/validation";
import { Formik } from "formik";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FloatingLabelInput from "@/components/login/FloatingLabelInput";
import ThemeText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";

// ✅ Import toast & mutation
import Toast from "react-native-toast-message";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "@/utils/mutations/auth";

import * as SecureStore from 'expo-secure-store';

const Login = () => {
  const route = useRouter();
  const { dark } = useTheme();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      console.log("🎉 Login Success:", data);

      if (data?.access_token) {
        // ✅ Save token securely
        await SecureStore.setItemAsync("auth_token", data.access_token);
        await SecureStore.setItemAsync("user_data", JSON.stringify(data.user));
        await SecureStore.setItemAsync("user_id", data.user.id.toString());
        await SecureStore.setItemAsync("username", data.user.username || "");
        console.log("User data saved:", data.user);

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: `Welcome back, ${data.user?.fullname || 'user'}!`,
        });

        route.push("/(tabs)");
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Invalid response from server.",
        });
      }
    },
    onError: (error: any) => {
      console.error("❌ Login Error:", error);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error?.message || "Something went wrong",
      });
    },
  });

  const handleLogin = (values: { email: string; password: string }) => {
    console.log("Login Data:", values);
    mutation.mutate({ data: values });
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
            shadowColor: dark ? "white" : "black",
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
              style={{
                width: 70,
                height: 70,
              }}
            />
          </ThemedView>

          <ThemedView
            darkColor="transparent"
            style={{ transform: [{ translateY: -40 }] }}
          >
            <ThemeText
              style={{
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Login
            </ThemeText>
            <ThemeText
              style={{
                fontSize: 14,
                color: dark ? COLORS.white : "gray",
                textAlign: "center",
              }}
            >
              Login to your account
            </ThemeText>

                    {/* Login Button */}
                    <Pressable
                      onPress={() => route.push("/(tabs)")}
                      style={{
                        backgroundColor: "#FF0000",
                        paddingVertical: 15,
                        borderRadius: 10,
                      }}
                    >
                      <ThemeText
                        style={{
                          textAlign: "center",
                          color: "white",
                          fontWeight: "500",
                          fontSize: 16,
                        }}
                      >
                        {mutation.isPending ? "Logging in..." : "Login"}
                      </ThemeText>
                    </Pressable>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSignInSchema}
                onSubmit={handleLogin}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <ThemedView darkColor="transparent" style={styles.card}>
                    <FloatingLabelInput
                      label="Email"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      error={
                        touched.email && errors.email ? errors.email : ""
                      }
                      keyboardType="email-address"
                      autoComplete="off"
                    />

                    <FloatingLabelInput
                      label="Password"
                      autoComplete="off"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={
                        touched.password && errors.password
                          ? errors.password
                          : ""
                      }
                      isPassword={true}
                    />

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={() => route.push("/forgetpassword")}>
                      <ThemeText style={styles.forgotPassword}>
                        Forgot Password?
                      </ThemeText>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <Pressable
                      onPress={() => handleSubmit()}
                      style={{
                        backgroundColor: "#FF0000",
                        paddingVertical: 15,
                        borderRadius: 10,
                      }}
                    >
                      <ThemeText
                        style={{
                          textAlign: "center",
                          color: "white",
                          fontWeight: "500",
                          fontSize: 16,
                        }}
                      >
                        {mutation.isPending ? "Logging in..." : "Login"}
                      </ThemeText>
                    </Pressable>

                    {/* Register Redirect */}
                    <Link
                      href={"/register"}
                      style={{ paddingVertical: 15, borderRadius: 10 }}
                    >
                      <ThemeText style={styles.registerText}>Register</ThemeText>
                    </Link>
                    {/* <Link
                      href={"/AgoraCallScreen"}
                      style={{ paddingVertical: 15, borderRadius: 10 }}
                    > */}
                    <Link
                      href={"/(tabs)"}
                      style={{ paddingVertical: 15, borderRadius: 10 }}
                    >
                      {/* <ThemeText style={styles.registerText}>Login</ThemeText> */}
                    </Link>
                    {/* <Pressable onPress={() => route.push("/(tabs)")}>
                      <ThemeText>Login now</ThemeText>
                    </Pressable> */}
                  </ThemedView>
                )}
              </Formik>
            </KeyboardAvoidingView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ flex: 1, justifyContent: "flex-end" }}>
          <ThemeText
            style={{ textAlign: "center", paddingHorizontal: 30, paddingBottom: 20 }}
          >
            By continuing you agree to gym paddy’s{" "}
            <ThemeText style={{ color: "red" }}>terms of use</ThemeText> and{" "}
            <ThemeText style={{ color: "red" }}>privacy policy</ThemeText>.
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
  forgotPassword: {
    color: "#EF4444",
    textAlign: "right",
    marginBottom: 16,
    fontSize: 14,
  },
  registerText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
    marginTop: 16,
  },
});

export default Login;
