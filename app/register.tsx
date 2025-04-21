import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/themeContext";
import { Image } from "expo-image";
import { Formik } from "formik";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Yup from "yup";
import ThemeText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import FloatingLabelInput from "@/components/login/FloatingLabelInput";
import FloatingLabelGenderPicker from "@/components/login/FloatingLabelGenderPicker";
import { images } from "@/constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  age: Yup.number()
    .required("Age is required")
    .min(13, "Must be at least 13 years old"),
  gender: Yup.string().required("Gender is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

let themedark = false;

export default function Register() {
  const [formSetFieldValue, setFormSetFieldValue] = useState<(field: string, value: any) => void>(() => () => { });
  const [gender, setGender] = useState('');

  const [SelectGender, setSelectGender] = useState('')
  const { dark } = useTheme();
  themedark = dark;
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleRegister = (values: any) => {
    console.log("Register Data:", values);
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { height: 150 },
    cardContainer: {
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 10,
      elevation: 5,
      shadowColor: themedark ? 'white' : 'black',
      transform: [{ translateY: -50 }],
    },
    logoContainer: {
      alignSelf: "center",
      backgroundColor: "white",
      transform: [{ translateY: -60 }],
      borderRadius: 10,
      elevation: 5,
      shadowColor: themedark ? 'white' : 'black',
      padding: 10,
    },
    logo: { width: 70, height: 70 },
    formContainer: { transform: [{ translateY: -40 }] },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: "gray",
      textAlign: "center",
      marginBottom: 20,
    },
    form: { marginTop: 20, paddingHorizontal: 15 },
    registerButton: {
      backgroundColor: "#FF0000",
      paddingVertical: 15,
      borderRadius: 10,
      marginTop: 16,
    },
    registerButtonText: {
      textAlign: "center",
      color: "white",
      fontWeight: "500",
      fontSize: 16,
    },
    loginText: {
      color: "#FF0000",
      textAlign: "center",
      fontSize: 14,
      marginTop: 16,
    },
    footer: {
      justifyContent: "flex-end",
      paddingBottom: 20,
    },
    termsText: {
      textAlign: "center",
      paddingHorizontal: 30,
      fontSize: 12,
    },
    linkText: { color: "#FF0000" },
  });

  const genderStyles = StyleSheet.create({
    genderCard: {
      width: 140,
      borderRadius: 20,
      backgroundColor: dark ? '#252525' : 'white',
      justifyContent: "space-between",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#ccc",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    selectedCard: {
      borderColor: "#FF0000",
      borderWidth: 2,
    },
    genderImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginVertical: 20
    },
    genderTextWrapper: {
      width: "100%",
      backgroundColor: "#FF0000",
      paddingVertical: 10,
      alignItems: "center",
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    genderText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <ThemedView>
            <LinearGradient
              colors={["#FF0000", "#840000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            />

            <ThemedView style={styles.cardContainer}>
              <ThemedView style={styles.logoContainer}>
                <Image source={images.logo} style={styles.logo} />
              </ThemedView>

              <ThemedView style={styles.formContainer}>
                <ThemeText style={styles.title}>Register</ThemeText>
                <ThemeText style={styles.subtitle}>
                  Create an account for free
                </ThemeText>

                <Formik
                  initialValues={{
                    username: "",
                    fullName: "",
                    email: "",
                    phone: "",
                    age: "",
                    gender: "",
                    password: "",
                  }}
                  validationSchema={validationSchema}
                  onSubmit={handleRegister}
                >
                  {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched,
                    setFieldValue,
                  }) => {
                    useEffect(() => {
                      setFormSetFieldValue(() => setFieldValue);
                    }, [setFieldValue]);
                    return (<>
                      <ThemedView style={styles.form}>
                        <FloatingLabelInput
                          label="Username"
                          value={values.username}
                          onChangeText={handleChange("username")}
                          autoComplete="off"
                          onBlur={handleBlur("username")}
                          error={touched.username && errors.username ? errors.username : ""}
                        />
                        <FloatingLabelInput
                          label="Full Name"
                          value={values.fullName}
                          onChangeText={handleChange("fullName")}
                          autoComplete="off"
                          onBlur={handleBlur("fullName")}
                          error={touched.fullName && errors.fullName ? errors.fullName : ""}
                        />
                        <FloatingLabelInput
                          label="Email"
                          value={values.email}
                          onChangeText={handleChange("email")}
                          autoComplete="off"
                          onBlur={handleBlur("email")}
                          keyboardType="email-address"
                          error={touched.email && errors.email ? errors.email : ""}
                        />
                        <FloatingLabelInput
                          label="Phone Number"
                          value={values.phone}
                          onChangeText={handleChange("phone")}
                          autoComplete="off"
                          onBlur={handleBlur("phone")}
                          keyboardType="phone-pad"
                          error={touched.phone && errors.phone ? errors.phone : ""}
                        />
                        <FloatingLabelInput
                          label="Age"
                          value={values.age}
                          onChangeText={handleChange("age")}
                          autoComplete="off"
                          onBlur={handleBlur("age")}
                          keyboardType="numeric"
                          error={touched.age && errors.age ? errors.age : ""}
                        />
                        <FloatingLabelGenderPicker
                          label="Gender"
                          value={values.gender}
                          error={touched.gender && errors.gender ? errors.gender : ""}
                          onPress={() => bottomSheetRef.current?.snapToIndex(0)}
                        />

                        <FloatingLabelInput
                          label="Password"
                          value={values.password}
                          onChangeText={handleChange("password")}
                          autoComplete="off"
                          onBlur={handleBlur("password")}
                          isPassword
                          error={touched.password && errors.password ? errors.password : ""}
                        />

                        <Pressable onPress={() => handleSubmit()} style={styles.registerButton}>
                          <ThemeText style={styles.registerButtonText}>Register</ThemeText>
                        </Pressable>

                        <TouchableOpacity onPress={() => router.push("/")}>
                          <ThemeText style={styles.loginText}>Login</ThemeText>
                        </TouchableOpacity>
                      </ThemedView>

                      {/* BottomSheet for Gender */}

                    </>)
                  }}
                </Formik>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.footer}>
              <ThemeText style={styles.termsText}>
                By continuing you agree to Gym Paddy's{" "}
                <ThemeText style={styles.linkText}>terms of use</ThemeText> and{" "}
                <ThemeText style={styles.linkText}>privacy policy</ThemeText>.
              </ThemeText>
            </ThemedView>
          </ThemedView>
        </SafeAreaView>
      </ScrollView>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['35%']}
        index={-1}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: dark ? "#252525" : 'white',
        }}
        handleIndicatorStyle={{
          backgroundColor: dark ? "#666" : 'gray',
        }}
      >
        <BottomSheetView
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            paddingVertical: 20,
            backgroundColor: dark ? "#252525" : 'white',
          }}

        >
          <Pressable
            onPress={() => {
              formSetFieldValue("gender", "Male");
              bottomSheetRef.current?.close();
              setGender("Male");
            }}
            style={[
              genderStyles.genderCard,
              gender === "Male" && genderStyles.selectedCard,
            ]}
          >
            <Image source={images.male} style={genderStyles.genderImage} />
            <View style={genderStyles.genderTextWrapper}>
              <ThemeText style={genderStyles.genderText}>Male</ThemeText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              formSetFieldValue("gender", "Female");
              bottomSheetRef.current?.close();
              setGender("Female");
            }}
            style={[
              genderStyles.genderCard,
              gender === "Female" && genderStyles.selectedCard,
            ]}
          >
            <Image source={images.female} style={genderStyles.genderImage} />
            <View style={genderStyles.genderTextWrapper}>
              <ThemeText style={genderStyles.genderText}>Female</ThemeText>
            </View>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
