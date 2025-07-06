import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import HorizontalStreamList from '@/components/HorizontalStreamList';
// import { useLiveStreams } from '@/hooks/useLiveStreams';
import { Ionicons } from '@expo/vector-icons';
import { useLiveStreams } from '@/utils/useLiveStreams';

const Section = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

export default function LiveStreamDiscoverScreen() {
  const { data, isLoading, error } = useLiveStreams();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Section title="Top Live Streams" />

        {isLoading ? (
          <ActivityIndicator size="large" color="red" />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center' }}>Failed to load</Text>
        ) : (
          <HorizontalStreamList streams={data} />
        )}

        {/* You can add more sections later and filter accordingly */}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="videocam" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#A700FF',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
