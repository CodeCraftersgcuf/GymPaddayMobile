import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
} from "react-native";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, images } from "@/constants";
import { Image } from "expo-image";
import { CodeValidation } from "@/constants/validation"; // ✅ Your Yup validation schema
import { Formik } from "formik";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FloatingLabelInput from "@/components/login/FloatingLabelInput";
import ThemeText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";


//Code Related to the integration
import Toast from "react-native-toast-message";
import { useLocalSearchParams } from 'expo-router';


const codeverification = () => {
  const route = useRouter();
  const { dark } = useTheme();
  const { email } = useLocalSearchParams();
  const termsUrl = "https://gympaddy.com/terms";
  const privacyUrl = "https://gympaddy.com/privacy";

  console.log("Email from params:", email); // Debugging line to check if email is received correctly

  const handleLogin = (values: { code: string }) => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Missing email information' });
      return;
    }
    // Don't call verifyOtp here — it consumes the OTP on the server.
    // Pass the OTP directly to the reset password screen, which will
    // validate it via the reset-password endpoint.
    route.push({
      pathname: '/resetpassword',
      params: {
        email: email as string,
        otp: values.code,
      },
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#940304", "#840000"]}
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
              Input 6-digit code sent to your email
            </ThemeText>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <Formik
                initialValues={{ code: "" }}
                validationSchema={CodeValidation}
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
                      label="Input Code"
                      value={values.code}
                      onChangeText={handleChange("code")}
                      onBlur={handleBlur("code")}
                      error={touched.code && errors.code ? errors.code : ""}
                      keyboardType="default"
                      autoComplete="off"
                    />

                    {/* Login Button */}
                    <Pressable
                      onPress={() => handleSubmit()}
                      style={{
                        backgroundColor: '#940304',
                        paddingVertical: 15,
                        borderRadius: 10,
                      }}
                    >
                      <ThemeText style={{ textAlign: 'center', color: 'white', fontWeight: '500', fontSize: 16 }}>
                        Proceed
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
            <ThemeText style={{ color: 'red' }} onPress={() => Linking.openURL(termsUrl)}>
              terms of use
            </ThemeText>{" "}
            and{" "}
            <ThemeText style={{ color: 'red' }} onPress={() => Linking.openURL(privacyUrl)}>
              privacy policy
            </ThemeText>
            .
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

export default codeverification;
