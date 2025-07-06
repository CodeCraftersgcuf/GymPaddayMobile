// components/HorizontalStreamList.tsx
import React from 'react';
import { FlatList } from 'react-native';
import LiveCard from './LiveCard';

const HorizontalStreamList = ({ streams }: { streams: any[] }) => {
  return (
    <FlatList
      horizontal
      data={streams}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <LiveCard
        id={item?.id}
          profileUrl={item?.user?.profile_picture_url}
          title={item?.title}
          userName={item?.user.fullname || item.user.username}
          channelName={item?.agora_channel}
        />
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }}
    />
  );
};

export default HorizontalStreamList;
