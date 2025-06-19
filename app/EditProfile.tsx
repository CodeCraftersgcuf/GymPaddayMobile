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

export default function EditProfileScreen() {
  const { dark } = useTheme();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    gender: '',
    age: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  const handleSave = () => {
    if (validateForm()) {
      // Here you would typically save to your backend
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleImagePress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera pressed') },
        { text: 'Gallery', onPress: () => console.log('Gallery pressed') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
            onBackPress={()=>{}}
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
                  uri: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
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
          >
            <Text style={styles.saveButtonText}>Save</Text>
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