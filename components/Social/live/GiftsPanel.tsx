import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  currency: string;
}

interface GiftsPanelProps {
  dark: boolean;
  balance: number;
  onGiftSelect: (gift: GiftItem) => void;
  onTopupPress: () => void;
}

const GiftsPanel: React.FC<GiftsPanelProps> = ({ dark, balance, onGiftSelect, onTopupPress }) => {
  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    cardBackground: dark ? '#2a2a2a' : '#ffffff',
  };

  const giftItems: GiftItem[] = [
    { id: '1', emoji: '🍩', name: 'Donut', price: 20, currency: 'GP' },
    { id: '2', emoji: '🔥', name: 'Fire', price: 100, currency: 'GP' },
    { id: '3', emoji: '🍦', name: 'Ice Cream', price: 100, currency: 'GP' },
    { id: '4', emoji: '💎', name: 'Diamond', price: 100, currency: 'GP' },
    { id: '5', emoji: '❤️', name: 'Heart', price: 0, currency: 'GP Coins' },
    { id: '6', emoji: '🧢', name: 'Cap', price: 100, currency: 'GP' },
    { id: '7', emoji: '🍕', name: 'Pizza', price: 100, currency: 'GP' },
    { id: '8', emoji: '🍩', name: 'Donut Pro', price: 100, currency: 'GP' },
    { id: '9', emoji: '🦁', name: 'Lion', price: 0, currency: 'GP Coins' },
    { id: '10', emoji: '🐱', name: 'Cat', price: 100, currency: 'GP' },
    { id: '11', emoji: '🐋', name: 'Whale', price: 100, currency: 'GP' },
    { id: '12', emoji: '🌻', name: 'Sunflower', price: 100, currency: 'GP' },
    { id: '8', emoji: '🍩', name: 'Donut Pro', price: 100, currency: 'GP' },
    { id: '9', emoji: '🦁', name: 'Lion', price: 0, currency: 'GP Coins' },
    { id: '10', emoji: '🐱', name: 'Cat', price: 100, currency: 'GP' },
    { id: '11', emoji: '🐋', name: 'Whale', price: 100, currency: 'GP' },
    { id: '12', emoji: '🌻', name: 'Sunflower', price: 100, currency: 'GP' },
    { id: '8', emoji: '🍩', name: 'Donut Pro', price: 100, currency: 'GP' },
    { id: '9', emoji: '🦁', name: 'Lion', price: 0, currency: 'GP Coins' },
    { id: '10', emoji: '🐱', name: 'Cat', price: 100, currency: 'GP' },
  ];

  const renderGiftItem = ({ item }: { item: GiftItem }) => (
    <TouchableOpacity 
      style={[styles.giftCard, { backgroundColor: themeStyles.cardBackground }]}
      onPress={() => onGiftSelect(item)}
    >
      <Text style={styles.giftEmoji}>{item.emoji}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={[styles.priceText, { color: themeStyles.textColor }]}>
          {item.price > 0 ? `${item.price} ${item.currency}` : item.currency}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.giftsPanel, { backgroundColor: themeStyles.secondaryBackground }]}>
      <View style={styles.giftsPanelHeader}>
        <Text style={[styles.giftsTitle, { color: themeStyles.textColor }]}>Gifts</Text>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: themeStyles.textColorSecondary }]}>
            Balance :
          </Text>
          <Text style={[styles.balanceAmount, { color: themeStyles.textColor }]}>
            {balance.toLocaleString()}
          </Text>
          <Text style={styles.coinEmoji}>🪙</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={giftItems}
          renderItem={renderGiftItem}
          numColumns={4}
          contentContainerStyle={styles.giftsGrid}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <TouchableOpacity style={styles.topupBtn} onPress={onTopupPress}>
            <Text style={styles.topupText}>Topup</Text>
          </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  giftsPanel: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  giftsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  giftsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  coinEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  topupBtn:{
    padding: 10,
    paddingVertical:16,
    borderRadius: 8,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  topupText: {
    color: 'white',
    fontSize: 14,
  },
  giftsGrid: {
    paddingHorizontal: 16,
    flex:1,
  },
  giftCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  giftEmoji: {
    fontSize: 32,
    // marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GiftsPanel;