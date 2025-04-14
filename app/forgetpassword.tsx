import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/themeContext";
import { COLORS, images } from "@/constants";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Formik } from "formik";
import React from "react";
import Input from "@/utils/CustomInput";
import Button from "@/utils/Button";
import { useRouter } from "expo-router";

const ForgetPassword = () => {
  const { dark } = useTheme();
  const { back, push } = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.arrowLeftContainer} onPress={back}>
        <Image source={images.arrowLeft} style={styles.arrowLeft} />
      </TouchableOpacity>

      <Formik
        initialValues={{ email: "" }}
        onSubmit={() => {
          push("/resetpassword");
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <View style={styles.formContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: dark ? COLORS.white : COLORS.black },
              ]}
            >
              Email
            </Text>
            <Input
              value={values.email}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              label="Enter your email"
              keyboardType="email-address"
              showCheckbox={false}
              prefilledValue={values.email}
              id="email"
            />
            <Button title="Proceed" onPress={() => handleSubmit()} />
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  arrowLeftContainer: {
    position: "absolute",
    top: 30,
    left: 20,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 50,
    zIndex: 2,
  },
  arrowLeft: {
    width: 18,
    height: 18,
    tintColor: COLORS.dark1,
  },
  formContainer: {
    width: "100%",
    paddingTop: 100,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default ForgetPassword;
