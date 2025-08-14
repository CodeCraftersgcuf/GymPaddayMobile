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
