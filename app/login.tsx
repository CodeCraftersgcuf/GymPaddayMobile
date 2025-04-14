import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, images } from "@/constants";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { validationSignInSchema } from "@/utils/validation";
import { Formik } from "formik";
import React from "react";
import Input from "@/utils/CustomInput";
import Button from "@/utils/Button";
import { useRouter, router } from "expo-router";

const Login = () => {
  const { dark } = useTheme();
  const { push } = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            color: dark ? COLORS.white : COLORS.black,
            textAlign: "center",
          }}
        >
          Login
        </Text>
  
        <TouchableOpacity onPress={() => push("/forgetpassword")}>
          <Text
            style={{
              color: COLORS.primary,
              textAlign: "right",
              marginBottom: 20,
            }}
          >
            Forget Password?
          </Text>
        </TouchableOpacity>
  
        <Button title="Login" onPress={() => push("/(tabs)")} />
  
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              textAlign: "center",
              color: dark ? COLORS.white : COLORS.black,
            }}
          >
            Don't have an account?
            <TouchableOpacity onPress={() => push("/register")}>
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "bold",
                }}
              >
                {" "}
                Sign Up
              </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

});

export default Login;
