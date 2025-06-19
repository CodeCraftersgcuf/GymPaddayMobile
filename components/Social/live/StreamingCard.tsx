import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';import { LinearGradient } from 'expo-linear-gradient';


interface StreamingCardProps {
  dark: boolean;
  selectedDuration: string;
  onDurationSelect: () => void;
  onGoLive: () => void;
}

export default function StreamingCard({ 
  dark, 
  selectedDuration, 
  onDurationSelect, 
  onGoLive 
}: StreamingCardProps) {
  const hasMinFollowers = false; // Set to true if user has 500+ followers

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <ImageBackground
          source={{ uri: 'https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
          style={styles.cameraPreview}
          imageStyle={styles.cameraImage}
        >
          <TouchableOpacity style={styles.flipCamera}>
            <MaterialIcons name="flip-camera-ios" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      {/* Streaming Info Card */}
      <LinearGradient
        colors={['#FF0000', '#8B00FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.infoCard}
      >
        <Text style={styles.durationText}>Live streaming duration left this month</Text>
        <Text style={styles.hoursText}>5 Hrs</Text>
        
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        
        <Text style={styles.purchaseText}>
          Get more streaming minutes by purchasing with your GP coins.
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>30GP/30 Minute</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Error Message */}
      {!hasMinFollowers && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            You need a minimum of 500 followers to start going live
          </Text>
        </View>
      )}

      {/* Duration Selector */}
      <TouchableOpacity 
        style={[styles.durationSelector, { backgroundColor: dark ? '#181818' : '#F5F5F5' }]}
        onPress={onDurationSelect}
      >
        <Text style={[styles.durationSelectorText, { color: dark ? '#FFFFFF' : '#666666' }]}>
          Select Duration
        </Text>
        <MaterialIcons 
          name="keyboard-arrow-down" 
          size={24} 
          color={dark ? '#FFFFFF' : '#666666'} 
        />
      </TouchableOpacity>

      {/* Go Live Button */}
      <TouchableOpacity 
        style={[
          styles.goLiveButton, 
          { 
            backgroundColor: hasMinFollowers ? '#FF0000' : '#CCCCCC',
            opacity: hasMinFollowers ? 1 : 0.6 
          }
        ]}
        onPress={onGoLive}
        disabled={!hasMinFollowers}
      >
        <Text style={styles.goLiveButtonText}>Go Live</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    marginBottom: 20,
  },
  cameraPreview: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cameraImage: {
    borderRadius: 20,
  },
  flipCamera: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  hoursText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  purchaseText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buyButtonText: {
    color: '#FF0000',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF9999',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#CC0000',
    textAlign: 'center',
    fontSize: 14,
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  durationSelectorText: {
    fontSize: 16,
  },
  goLiveButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  goLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});