import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, icons, images } from "@/constants";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { validationRegistrationSchema } from "@/utils/validation";
import { Formik } from "formik";
import React from "react";
import Input from "@/utils/CustomInput";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import Button from "@/utils/Button";
import { useRouter } from "expo-router";

const Register = () => {
  const { dark } = useTheme();
  const { push } = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text
          style={[
            styles.inputLabel,
            { color: dark ? COLORS.white : COLORS.black },
          ]}
        >
          Example Field
        </Text>

        <Input
          value=""
          onChangeText={() => {}}
          label="Example Input"
          keyboardType="default"
          showCheckbox={false}
          errorText=""
          prefilledValue=""
          id="example"
        />

        <Button title="Register" onPress={() => console.log("Submitted")} />

        <View style={styles.bottomBoxText}>
          <Text
            style={{
              textAlign: "center",
              color: dark ? COLORS.white : COLORS.black,
            }}
          >
            Already have an account ?
            <TouchableOpacity onPress={() => push("/login")}>
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "bold",
                  position: "relative",
                  top: 4,
                }}
              >
                Sign In
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
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  bottomBoxText: {
    fontSize: 16,
    marginTop: 20,
  },
});

export default Register;