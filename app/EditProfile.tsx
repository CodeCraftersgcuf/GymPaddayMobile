import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useTheme } from '@/contexts/themeContext';
// import { ArrowLeft, Camera } from 'lucide-react-native';
import FloatingLabelInput from '@/components/login/FloatingLabelInput';
import FloatingLabelGenderPicker from '@/components/login/FloatingLabelGenderPicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Header from '@/components/more/withdraw/Header';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

//Code Related to the intgration
import { useMutation } from '@tanstack/react-query';
import { editUserProfile } from '@/utils/mutations/profile';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

export default function EditProfileScreen() {
  const { dark } = useTheme();
  const navigation = useNavigation();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    gender: '',
    age: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Load user_data from SecureStore on mount
  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          setFormData({
            username: user.username || '',
            fullName: user.fullname || '',
            gender: user.gender || '',
            age: user.age ? String(user.age) : '',
          });
          setProfileImage(user.profile_picture_url || null);
        } else {
          setProfileImage(null);
        }
      } catch (e) {
        setProfileImage(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // React Query mutation for profile update
  const mutation = useMutation({
    mutationFn: editUserProfile,
    onSuccess: async (response: any) => {
      // ✅ Update SecureStore with latest data if available
      if (response?.user) {
        await SecureStore.setItemAsync('user_data', JSON.stringify(response.user));
      }
      Toast.show({
        type: 'success',
        text1: 'Profile updated!',
        visibilityTime: 500,
      });
      setTimeout(() => {
        navigation.goBack();
      }, 600);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: error?.message || 'Something went wrong',
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenderSelect = (gender: string) => {
    handleInputChange('gender', gender);
    bottomSheetRef.current?.close();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gallery picker
  const handleImagePress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Not authenticated' });
        return;
      }
      const form = new FormData();
      form.append('username', formData.username);
      form.append('fullname', formData.fullName);
      form.append('gender', formData.gender);
      form.append('age', formData.age);

      if (profileImage) {
        // Only append if it's a new image (uri not starting with http)
        if (!profileImage.startsWith('http')) {
          const fileName = profileImage.split('/').pop() || 'profile.jpg';
          form.append('profile_picture', {
            uri: profileImage,
            name: fileName,
            type: 'image/jpeg',
          } as any);
        }
      }

      mutation.mutate({ token, data: form });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not update profile.' });
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

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

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? 'black' : '#fff' }}>
        <Text style={{ color: dark ? '#fff' : '#000' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[
        styles.container,
        dark ? styles.containerDark : styles.containerLight
      ]}>
        {/* Header */}
        <Header
          title='Edit Profile'
          showBackButton={true}
          onBackPress={() => { }}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image */}
          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={handleImagePress}
            >
              <Image
                source={{
                  uri: profileImage || 'https://ui-avatars.com/api/?name=User'
                }}
                style={styles.profileImage}
              />
              <View style={styles.cameraOverlay}>
                <FontAwesome name='camera' size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <FloatingLabelInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FloatingLabelInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              error={errors.fullName}
              autoCapitalize="words"
            />

            <FloatingLabelGenderPicker
              label="Gender"
              value={formData.gender}
              onPress={() => bottomSheetRef.current?.snapToIndex(0)}
              error={errors.gender}
            />

            <FloatingLabelInput
              label="Age"
              value={formData.age}
              onChangeText={(text) => handleInputChange('age', text)}
              error={errors.age}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={mutation.isPending}
          >
            <Text style={styles.saveButtonText}>{mutation.isPending ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>

        {/* Gender Bottom Sheet */}
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
              onPress={() => handleGenderSelect("Male")}
              style={[
                genderStyles.genderCard,
                formData.gender === "Male" && genderStyles.selectedCard,
              ]}
            >
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'
                }}
                style={genderStyles.genderImage}
              />
              <View style={genderStyles.genderTextWrapper}>
                <Text style={genderStyles.genderText}>Male</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleGenderSelect("Female")}
              style={[
                genderStyles.genderCard,
                formData.gender === "Female" && genderStyles.selectedCard,
              ]}
            >
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'
                }}
                style={genderStyles.genderImage}
              />
              <View style={genderStyles.genderTextWrapper}>
                <Text style={genderStyles.genderText}>Female</Text>
              </View>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitleLight: {
    color: '#111827',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});