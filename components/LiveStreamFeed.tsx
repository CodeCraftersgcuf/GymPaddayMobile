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

        // Backend (Laravel) uses is_active + status; some clients may still send is_live / ended_at.
        const isActiveValue =
          item?.is_active === true ||
          item?.is_active === 1 ||
          item?.is_active === '1' ||
          item?.is_active === 'true';
        const legacyIsLive =
          item?.is_live === true ||
          item?.is_live === 1 ||
          item?.is_live === '1' ||
          item?.is_live === 'true';
        const statusEnded = item?.status === 'ended' || item?.status === 'paused';
        const hasNotEnded =
          item?.ended_at === null || item?.ended_at === undefined || item?.ended_at === '';
        const isActuallyLive =
          (isActiveValue || legacyIsLive) && !statusEnded && hasNotEnded;

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
