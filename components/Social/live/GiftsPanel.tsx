import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useWindowDimensions,
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

const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 10;
const CARD_HEIGHT = 108;
const EMOJI_SIZE = 34;

const GiftsPanel: React.FC<GiftsPanelProps> = ({
  dark,
  balance,
  onGiftSelect,
  onTopupPress,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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

  const cardWidth = useMemo(() => {
    const available =
      windowWidth - HORIZONTAL_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1);
    return Math.floor(available / NUM_COLUMNS);
  }, [windowWidth]);

  const listHeight = useMemo(() => {
    const rowCount = Math.ceil(giftItems.length / NUM_COLUMNS);
    const contentHeight = rowCount * (CARD_HEIGHT + CARD_GAP) + CARD_GAP;
    const maxHeight = Math.max(220, windowHeight * 0.34);
    return Math.min(contentHeight, maxHeight);
  }, [giftItems.length, windowHeight]);

  const renderGiftItem = ({ item }: { item: GiftItem }) => {
    const isSelected = selectedGiftId === item.id;
    const quantity = giftQuantities[item.id] || 1;

    return (
      <TouchableOpacity
        style={[
          styles.giftCard,
          {
            width: cardWidth,
            height: CARD_HEIGHT,
            backgroundColor: themeStyles.cardBackground,
          },
          isSelected && { borderWidth: 2, borderColor: '#C61F3A' },
        ]}
        onPress={() => {
          const totalCost = item.price * quantity;
          if (totalCost > balance) {
            alert("You don't have enough balance, please top up first.");
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
                const newQty = Math.max(1, quantity - 1);
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
                const newQty = quantity + 1;
                const totalCost = item.price * newQty;
                if (totalCost > balance) {
                  alert('Not enough balance for this quantity.');
                  return;
                }
                setGiftQuantities((prev) => ({
                  ...prev,
                  [item.id]: newQty,
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

      <FlatList
        data={giftItems}
        keyExtractor={(item) => item.id}
        renderItem={renderGiftItem}
        numColumns={NUM_COLUMNS}
        key={`gift-grid-${NUM_COLUMNS}`}
        style={[styles.giftsList, { height: listHeight }]}
        contentContainerStyle={styles.giftsGrid}
        columnWrapperStyle={styles.giftsRow}
        scrollEnabled
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        bounces
      />

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
  giftsList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  giftsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
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
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#C61F3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  topupText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  giftsGrid: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
  },
  giftsRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  giftCard: {
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  giftEmoji: {
    fontSize: EMOJI_SIZE,
    lineHeight: EMOJI_SIZE + 4,
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
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'space-between',
    width: '100%',
  },
  quantityBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#888',
    color: '#C61F3A',
  },
  quantityValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 4,
    color: '#444',
  },
});

export default GiftsPanel;
