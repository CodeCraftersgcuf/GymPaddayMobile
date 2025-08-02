// components/HorizontalStreamList.tsx
import React from 'react';
import { FlatList, View, StyleSheet, Dimensions } from 'react-native';
import LiveCard from './LiveCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 16) / 2; // 2 cards, 16px padding + spacing

const HorizontalStreamList = ({ streams }: { streams: any[] }) => {
  if (!streams?.length) return null;

  return (
    <FlatList
      data={streams}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
          <LiveCard
            id={item?.id}
            profileUrl={item?.user?.profile_picture_url}
            title={item?.title}
            userName={item?.user.fullname || item.user.username}
            channelName={item?.agora_channel}
          />
        </View>
      )}
      scrollEnabled={false} // prevent vertical scrolling, parent handles scroll
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default HorizontalStreamList;
