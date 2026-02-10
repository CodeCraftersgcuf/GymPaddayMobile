// components/LiveStreamFeed.tsx
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import LiveCard from './LiveCard';

const LiveStreamFeed = ({ streams }: { streams: any[] }) => {
  if (!streams?.length) return null;

  return (
    <FlatList
      data={streams}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const latestImage =
          item?.user?.latest_image_post?.media?.[0]?.url ??
          item?.user?.profile_picture_url;

        // Check if stream is actually live: is_live must be true AND ended_at must be null/undefined
        // Handle both boolean and string values for is_live
        const isLiveValue = item?.is_live === true || item?.is_live === 1 || item?.is_live === '1' || item?.is_live === 'true';
        const hasNotEnded = item?.ended_at === null || item?.ended_at === undefined || item?.ended_at === '';
        const isActuallyLive = isLiveValue && hasNotEnded;

        return (
          <View style={styles.cardWrapper}>
           <LiveCard
  id={item?.id}
  postImageUrl={
    item?.user?.latest_image_post?.media?.[0]?.url ||
    item?.user?.profile_picture_url
  }
  profilePictureUrl={item?.user?.profile_picture_url}
  title={item?.title}
  userName={item?.user?.fullname || item?.user?.username}
  viewers={item?.audiences?.length || 0}
  channelName={item?.agora_channel}
  timeAgo={isActuallyLive ? 'Live now' : 'Offline'}
/>

          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
  },
});

export default LiveStreamFeed;
