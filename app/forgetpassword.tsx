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
import { forgetValidation } from "@/constants/validation"; // ✅ Your Yup validation schema
import { Formik } from "formik";
import { Link, useNavigation, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FloatingLabelInput from "@/components/login/FloatingLabelInput";
import ThemeText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/utils/mutations/auth";
import Toast from "react-native-toast-message";



const forgetpassword = () => {
  const route = useRouter();
  const { dark } = useTheme();

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (res, variables) => {
      const email = variables.data.email; // Access email from variables
      Toast.show({ type: 'success', text1: res.message });
      route.push({ pathname: '/codeverification', params: { email } });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to send reset link' });
   
    }
  });


  const handleLogin = (values: { email: string }) => {
    console.log("Forgot password data:", values);
    mutation.mutate({ data: { email: values.email } });
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
              style={{
                width: 70,
                height: 70,
              }}
            />
          </ThemedView>

          <ThemedView darkColor="transparent" style={{ transform: [{ translateY: -40 }] }}>
            <ThemeText
              style={{
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Forget Password
            </ThemeText>
            <ThemeText
              style={{
                fontSize: 14,
                color: dark ? COLORS.white : "gray",
                textAlign: "center",
              }}
            >
              Input your account email
            </ThemeText>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <Formik
                initialValues={{ email: "" }}
                validationSchema={forgetValidation}
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
                      error={touched.email && errors.email ? errors.email : ""}
                      keyboardType="email-address"
                      autoComplete="off"
                    />

                    {/* Login Button */}
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
    paddingHorizontal: 15
  },
});

export default forgetpassword;
