import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLiveStreams } from '@/utils/useLiveStreams';
import { router } from 'expo-router';
import LiveStreamFeed from '@/components/LiveStreamFeed';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isLiveStreamDiscoverable } from '@/utils/liveStreamStatus';

const Section = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const EmptyStreamPlaceholder = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>No live streams available</Text>
  </View>
);

export default function LiveStreamDiscoverScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, isRefetching, refetch } = useLiveStreams();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
    }, [queryClient])
  );

  const renderSectionContent = () => {
    if (isLoading && !data) {
      return <ActivityIndicator size="large" color="red" />;
    }

    if (error) {
      return <Text style={styles.errorText}>Failed to load</Text>;
    }

    const streams = Array.isArray(data) ? data : [];
    const activeCount = streams.filter((s) =>
      isLiveStreamDiscoverable(s as Record<string, unknown>)
    ).length;

    if (activeCount > 0) {
      return <LiveStreamFeed streams={streams} />;
    }

    return <EmptyStreamPlaceholder />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back arrow so user can easily leave this screen (especially on iOS) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Streams</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#940304" />
        }
      >
        <Section title="Top Live Streams" />
        {renderSectionContent()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingRight: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    marginLeft: 12,
    marginTop: 16,
    marginBottom:10,
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
