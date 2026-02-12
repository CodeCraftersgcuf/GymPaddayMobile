import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Text,
  Linking,
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
import FloatingLabelPhoneInput from "@/components/login/FloatingLabelPhoneInput";
import FloatingLabelGenderPicker from "@/components/login/FloatingLabelGenderPicker";
import { images } from "@/constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/utils/mutations/auth";
import Toast from "react-native-toast-message";
import { showApiErrorToast, extractFieldErrors } from "@/utils/showApiErrorToast";
import * as ImagePicker from 'expo-image-picker';



const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .test("phone-length", "Phone number must be 10 or 11 digits (excluding country code)", (value) => {
      if (!value) return false;
      // Remove country code (starts with + and 1-4 digits)
      const phoneDigits = value.replace(/^\+\d{1,4}/, "");
      // Check if remaining digits are 10 or 11
      return /^\d{10,11}$/.test(phoneDigits);
    }),
  age: Yup.number()
    .typeError("Age must be a number")
    .required("Age is required")
    .min(13, "Must be at least 13 years old")
    .max(120, "Age must be less than 120"),
  gender: Yup.string().required("Gender is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  profileImage: Yup.string().required("Profile image is required"),
});

let themedark = false;

export default function Register() {
  const [formSetFieldValue, setFormSetFieldValue] = useState<(field: string, value: any) => void>(() => () => { });
  const [formSetFieldTouched, setFormSetFieldTouched] = useState<(field: string, touched?: boolean) => void>(() => () => { });
  const [gender, setGender] = useState('');

  const [SelectGender, setSelectGender] = useState('')
  const { dark } = useTheme();
  themedark = dark;
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string>('');
  const termsUrl = "https://gympaddy.com/terms";
  const privacyUrl = "https://gympaddy.com/privacy";

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setProfileImageError(''); // Clear error when image is selected
      // Update formik field value
      if (formSetFieldValue) {
        formSetFieldValue('profileImage', result.assets[0].uri);
      }
    }
  };

  const handleRegister = (values: any) => {
    // Check if profile image is selected
    if (!profileImage) {
      setProfileImageError('Profile image is required');
      return;
    }

    const formData = new FormData();

    formData.append('username', values.username);
    formData.append('fullname', values.fullName);
    formData.append('email', values.email);
    // Only append optional fields if they have values
    if (values.phone && values.phone.trim()) {
      formData.append('phone', values.phone);
    }
    if (values.age && values.age.toString().trim()) {
      formData.append('age', values.age.toString());
    }
    // Gender is now required, so always append it
    formData.append('gender', values.gender.toLowerCase());
    formData.append('password', values.password);
    formData.append('password_confirmation', values.password);

    // Profile image is now required
    const uriParts = profileImage.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('profile_picture', {
      uri: profileImage,
      name: `profile.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    mutation.mutate({ data: formData });
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
      marginBottom: -40,
      shadowColor: themedark ? 'white' : 'black',
      padding: 10,
    },
    logo: { width: 70, height: 70 },
    formContainer: { transform: [{ translateY: 0 }] },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: "gray",
      textAlign: "center",
      marginBottom: 0,
    },
    form: { marginTop: 20, paddingHorizontal: 15 },
    registerButton: {
      backgroundColor: "#940304",
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
      color: "#940304",
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
    linkText: { color: "#940304" },
    imagePickerContainer: {
      position: 'relative',
      alignSelf: 'center',
    },
    profileImagePreview: {
      width: 100,
      height: 100,
      borderRadius: 50,
      // borderWidth: 2,
    },
    addImageOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: 15,
      backgroundColor: '#940304',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageText: {
      color: 'white',
      fontSize: 15,
      fontWeight: 'bold',
    },
    requiredText: {
      textAlign: 'center',
      fontSize: 12,
      marginTop: 5,
    },
    errorText: {
      color: '#940304',
      fontSize: 12,
      textAlign: 'center',
      marginTop: 2,
    },
    disabledButton: {
      opacity: 0.6,
    },
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
      borderColor: "#940304",
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
      backgroundColor: "#940304",
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

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      const formData = variables.data as FormData;
      const email = formData.get("email") as string;

      Toast.show({
        type: "success",
        text1: "Registered successfully!",
      });

      router.replace({ pathname: "/verify-otp", params: { email } });
    },
    onError: (error, variables, context) => {
      // Extract field-specific errors and show toast
      const fieldErrors = extractFieldErrors(error);
      
      // Show toast with all errors
      showApiErrorToast(error, "Registration failed");
      
      // Set field errors in Formik if we have access to setFieldError
      // This will be handled in the Formik render function
      if (Object.keys(fieldErrors).length > 0) {
        // Store errors to be applied in Formik
        (error as any).fieldErrors = fieldErrors;
      }
    },
  });


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        <SafeAreaView style={styles.container}>
          <ThemedView>
            <LinearGradient
              colors={["#940304", "#840000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            />

            <ThemedView style={styles.cardContainer}>
              <ThemedView style={styles.logoContainer}>
                <Image source={images.logo} style={styles.logo} />
              </ThemedView>

              {/* Required Profile Image Section */}
              <View style={{ alignSelf: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                  <Image
                    source={profileImage ? { uri: profileImage } : require('../assets/icons/more/profileImage.png')}
                    style={[
                      styles.profileImagePreview,

                    ]}
                  />
                  {!profileImage && (
                    <View style={styles.addImageOverlay}>
                      <Text style={styles.addImageText}>+</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Required text and error message */}
                <Text style={[styles.requiredText, { color: dark ? "#999" : "#666" }]}>
                  Profile Photo Required *
                </Text>
                {profileImageError ? (
                  <Text style={styles.errorText}>{profileImageError}</Text>
                ) : null}
              </View>

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
                    phone: "+234",
                    countryCode: "+234",
                    age: "",
                    gender: "",
                    password: "",
                    profileImage: "",
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
                    setFieldTouched,
                    setFieldError,
                  }) => {
                    useEffect(() => {
                      setFormSetFieldValue(() => setFieldValue);
                      setFormSetFieldTouched(() => setFieldTouched);
                    }, [setFieldValue, setFieldTouched]);

                    // Apply backend validation errors to form fields
                    useEffect(() => {
                      if (mutation.error && (mutation.error as any).fieldErrors) {
                        const fieldErrors = (mutation.error as any).fieldErrors;
                        
                        // Map backend field names to form field names
                        const fieldMapping: Record<string, string> = {
                          'fullname': 'fullName',
                          'profile_picture': 'profileImage',
                          'password_confirmation': 'password',
                        };
                        
                        Object.keys(fieldErrors).forEach((backendField) => {
                          const formField = fieldMapping[backendField] || backendField;
                          // Only set error if field exists in form
                          if (formField in values || formField === 'profileImage') {
                            setFieldError(formField, fieldErrors[backendField]);
                            setFieldTouched(formField, true);
                          }
                        });
                      }
                    }, [mutation.error, setFieldError, setFieldTouched, values]);

                    // Update profile image validation
                    useEffect(() => {
                      if (profileImage) {
                        setFieldValue('profileImage', profileImage);
                      }
                    }, [profileImage, setFieldValue]);

                    return (
                      <>
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
                          <FloatingLabelPhoneInput
                            label="Phone Number"
                            value={values.phone}
                            onChangeText={handleChange("phone")}
                            onBlur={handleBlur("phone")}
                            countryCode={values.countryCode}
                            onCountryCodeChange={(code) => {
                              setFieldValue("countryCode", code);
                              // Update phone with new country code
                              const phoneDigits = values.phone.replace(/^\+\d{1,4}/, "");
                              setFieldValue("phone", code + phoneDigits);
                            }}
                            error={touched.phone && errors.phone ? errors.phone : ""}
                          />
                          <FloatingLabelInput
                            label="Age"
                            value={values.age}
                            onChangeText={(text) => handleChange("age")(text.replace(/[^\d]/g, ""))}
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

                          <Pressable
                            onPress={() => {
                              if (!profileImage) {
                                setProfileImageError('Profile image is required');
                                setFieldTouched("profileImage", true);
                              }
                              handleSubmit();
                            }}
                            style={[
                              styles.registerButton,
                              (Object.keys(errors).length > 0 || mutation.isPending) && styles.disabledButton
                            ]}
                            disabled={Object.keys(errors).length > 0 || mutation.isPending}
                          >
                            <ThemeText style={styles.registerButtonText}>
                              {mutation.isPending ? "Registering..." : "Register"}
                            </ThemeText>
                          </Pressable>

                          <TouchableOpacity onPress={() => router.push("/")}>
                            <ThemeText style={styles.loginText}>Login</ThemeText>
                          </TouchableOpacity>
                        </ThemedView>
                      </>
                    );
                  }}
                </Formik>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.footer}>
              <ThemeText style={styles.termsText}>
                By continuing you agree to Gym Paddy's{" "}
                <ThemeText style={styles.linkText} onPress={() => Linking.openURL(termsUrl)}>
                  terms of use
                </ThemeText>{" "}
                and{" "}
                <ThemeText style={styles.linkText} onPress={() => Linking.openURL(privacyUrl)}>
                  privacy policy
                </ThemeText>
                .
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
              formSetFieldTouched("gender", false);
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
              formSetFieldTouched("gender", false);
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
