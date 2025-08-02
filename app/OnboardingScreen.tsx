import React, { useState } from 'react';
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
  const [step, setStep] = useState(0);

  const handleNext = () => setStep(prev => prev + 1);

  const handleProceed = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  // Your slide data
  const slides = [
    {
      image: require('../assets/images/iphone-mock.png'),
      title: 'Connect via Socials',
      description:
        'With gym paddy socials, share your thoughts, comment on post, like a post and meet people of like interests via socials',
    },
    {
      image: require('../assets/images/onboarding2.png'), // ✅ use correct path & name
      title: 'Buy and Sell With Ease',
      description:
        'With gym paddy socials, share your thoughts, comment on post, like a post and meet people of like interests via socials',
    },
  ];

  const { image, title, description } = slides[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Image source={image} resizeMode="contain" style={styles.phoneImage} />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, step === index && styles.activeDot]}
            />
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={step === slides.length - 1 ? handleProceed : handleNext}
        >
          <Text style={styles.buttonText}>
            {step === slides.length - 1 ? 'Proceed' : 'Next'}
          </Text>
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
