import React, { useState } from 'react';
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
  quantity?: number;
}

interface GiftsPanelProps {
  dark: boolean;
  balance: number;
  onGiftSelect: (gift: GiftItem) => void;
  onTopupPress: () => void;
}

const GiftsPanel: React.FC<GiftsPanelProps> = ({
  dark,
  balance,
  onGiftSelect,
  onTopupPress,
}) => {
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [giftQuantities, setGiftQuantities] = useState<{ [key: string]: number }>({});

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
    cardBackground: dark ? '#2a2a2a' : '#ffffff',
  };

  const giftItems: GiftItem[] = [
    { id: '1', emoji: '🍩', name: 'Donut', price: 10, currency: 'GP' },
    { id: '2', emoji: '🔥', name: 'Fire', price: 10, currency: 'GP' },
    { id: '3', emoji: '🍦', name: 'Ice Cream', price: 10, currency: 'GP' },
    { id: '4', emoji: '💎', name: 'Diamond', price: 10, currency: 'GP' },
    { id: '5', emoji: '❤️', name: 'Heart', price: 10, currency: 'GP Coins' },
    { id: '6', emoji: '🧢', name: 'Cap', price: 10, currency: 'GP' },
    { id: '7', emoji: '🍕', name: 'Pizza', price: 10, currency: 'GP' },
    { id: '8', emoji: '🍩', name: 'Donut Pro', price: 10, currency: 'GP' },
    { id: '9', emoji: '🦁', name: 'Lion', price: 10, currency: 'GP Coins' },
    { id: '10', emoji: '🐱', name: 'Cat', price: 10, currency: 'GP' },
    { id: '11', emoji: '🐋', name: 'Whale', price: 10, currency: 'GP' },
    { id: '12', emoji: '🌻', name: 'Sunflower', price: 10, currency: 'GP' },
  ];

  const renderGiftItem = ({ item }: { item: GiftItem }) => {
    const isSelected = selectedGiftId === item.id;
    const quantity = giftQuantities[item.id] || 1;

    return (
      <TouchableOpacity
        style={[
          styles.giftCard,
          { backgroundColor: themeStyles.cardBackground },
          isSelected && { borderWidth: 2, borderColor: '#FF0000' },
        ]}
        onPress={() => {
          const totalCost = item.price * quantity;
          if (totalCost > balance) {
            alert("You don’t have enough balance, please top up first.");
            return;
          }

          setSelectedGiftId(item.id);
          onGiftSelect({ ...item, quantity });
        }}

      >
        <Text style={styles.giftEmoji}>{item.emoji}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={[styles.priceText, { color: themeStyles.textColor }]}>
            {item.price > 0 ? `${item.price} ${item.currency}` : item.currency}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.quantityControl}>
            <TouchableOpacity
              onPress={() => {
                const newQty = quantity + 1;
                const totalCost = item.price * newQty;

                if (totalCost > balance) {
                  alert("Not enough balance for this quantity.");
                  return;
                }

                setGiftQuantities((prev) => ({
                  ...prev,
                  [item.id]: newQty,
                }));
              }}

            >
              <Text style={styles.quantityBtn}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => {
                setGiftQuantities((prev) => ({
                  ...prev,
                  [item.id]: quantity + 1,
                }));
              }}
            >
              <Text style={styles.quantityBtn}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
  topupBtn: {
    padding: 10,
    paddingVertical: 16,
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
    flex: 1,
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
    fontSize: 8,
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  quantityBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#888',
    color: '#FF0000',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 6,
    color: '#444',
  },
});

export default GiftsPanel;
