import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const handleProceed = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/login"); // 👈 go to your main screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/iphone-mock.png')} // ✅ Your mock image
          resizeMode="contain"
          style={styles.phoneImage}
        />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>Connect via Socials</Text>
        <Text style={styles.description}>
          With gym paddy socials, share your thoughts, comment on post, like a post and meet people of like interests via socials
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleProceed}>
          <Text style={styles.buttonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff0000',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: -30,
  },
  phoneImage: {
    width: width * 0.95,
    height: height * 0.55,
    marginTop: 30,
  },
  bottomSheet: {
    backgroundColor: '#fff0f0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'red',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'red',
    fontFamily: 'Cursive',
    marginBottom: 15,
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#444',
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'red',
    borderRadius: 15,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
