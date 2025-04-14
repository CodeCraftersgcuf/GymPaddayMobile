import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/themeContext";
import { COLORS } from "@/constants";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Formik } from "formik";
import React from "react";
import Input from "@/utils/CustomInput";
import Button from "@/utils/Button";
import { useRouter } from "expo-router";

const ResetPassword = () => {
  const { dark } = useTheme();
  const { push } = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
          Reset Password
        </Text>

        <Formik
          initialValues={{ password: "" }}
          onSubmit={(values) => {
            console.log(values);
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>
                New Password
              </Text>
              <Input
                value={values.password}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                label="Enter new password"
                errorText={
                  touched.password && errors.password ? errors.password : ""
                }
                showCheckbox={false}
                prefilledValue={values.password}
                id="password"
              />

              <View style={{ marginVertical: 20 }}>
                <Button title="Proceed" onPress={handleSubmit} />
              </View>

              <TouchableOpacity onPress={() => push("/forgotPassword")}>
                <Text style={[styles.forgotText, { color: COLORS.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  inner: {
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  forgotText: {
    textAlign: "center",
    fontSize: 14,
  },
});

export default ResetPassword;
