import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/themeContext';

const LiveTabScreen = () => {
  const router = useRouter();
  const { dark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? '#000' : '#FFF' }]}>
      {/* Header with back arrow so user can leave the screen (especially on iOS) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={dark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#FFF' : '#000' }]}>Live</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Placeholder content – the actual go-live / discover UI is handled in other screens */}
      <View style={styles.body}>
        <Text style={[styles.infoText, { color: dark ? '#EEE' : '#333' }]}>
          Use the Live tab button and \"Go Live\" or Live Discover actions to start or join a stream.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LiveTabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingRight: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
