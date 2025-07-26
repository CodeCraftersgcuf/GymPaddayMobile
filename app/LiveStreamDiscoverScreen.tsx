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
import { Ionicons } from '@expo/vector-icons';
import HorizontalStreamList from '@/components/HorizontalStreamList';
import { useLiveStreams } from '@/utils/useLiveStreams';
import { router } from 'expo-router';

const Section = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const EmptyStreamPlaceholder = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>No live streams available</Text>
  </View>
);

export default function LiveStreamDiscoverScreen() {
  const { data, isLoading, error } = useLiveStreams();

  const renderSectionContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="red" />;
    }

    if (error) {
      return <Text style={styles.errorText}>Failed to load</Text>;
    }

    if (data && data.length > 0) {
      return <HorizontalStreamList streams={data} />;
    }

    return <EmptyStreamPlaceholder />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Section title="Top Live Streams" />
        {renderSectionContent()}

        <Section title="Followers Live Streams" />
        {renderSectionContent()}

        <Section title="Discover" />
        {renderSectionContent()}

        {/* You can add more filtered sections if needed */}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={
        ()=>router.push('/goLive')
      }>
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
    fontSize: 14,
    fontWeight: '400',
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
  placeholderContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
});
