import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

import * as SecureStore from 'expo-secure-store';

import { ImageBackground } from 'react-native';

interface WalletCardProps {
  balance: number;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onTopup: () => void;
  onWithdraw: () => void;
  onTransaction: () => void;
  userName: string;
  userImage: string | null; // Allow null type
  loading?: boolean; // optional loading state
}

export default function WalletCard({
  balance,
  isBalanceHidden,
  onToggleBalance,
  onTopup,
  onWithdraw,
  onTransaction,
  userName,
  userImage,
  loading = false,
}: WalletCardProps) {
  const { dark } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(userImage);


  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };
  const getHiddenBalance = (amount: number) => {
    if (amount === 0) return '*';
    const balanceString = amount.toString();
    return '*'.repeat(balanceString.length);
  };

  React.useEffect(() => {
    setProfileImage(userImage); // Update when userImage prop changes
  }, [userImage]);

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(userImage); // fallback to prop
          }
        } else {
          setProfileImage(userImage); // fallback to prop
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(userImage); // fallback to prop
      }
    })();
  }, [userImage]); // Add userImage as dependency



  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/walletbg.jpg')}
        resizeMode="cover"
        style={styles.cardContainer}
        imageStyle={{ borderRadius: 20 }}>

        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: profileImage }} style={styles.userImage} />
            <Text style={styles.walletTitle}>My Wallet</Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {loading ? 'Fetching...' : `GP ${isBalanceHidden ? getHiddenBalance(balance) : formatBalance(balance)}`}
            </Text>
            <TouchableOpacity onPress={onToggleBalance} style={styles.eyeButton}>
              <AntDesign
                name={isBalanceHidden ? 'eyeo' : 'eye'}
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceSubtext}>
            {/* Saldo saat ini tersimpan secara aman */}
          </Text>
        </View>
      </ImageBackground>

      <View style={[styles.actionsContainer, { backgroundColor: dark ? '#181818' : 'white' }]}>
        <TouchableOpacity style={[styles.actionButton,{ borderRightWidth: 1,}]} onPress={onTopup}>
          <Image source={images.topUp} style={{ width: 20, height: 20, objectFit: 'contain' }} tintColor={dark ? 'white' : "black"} />
          <ThemeText style={styles.actionText}>Topup</ThemeText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton,{ borderRightWidth: 1,}]} onPress={onWithdraw}>
          <Image source={images.withdraw} style={{ width: 18, height: 18, objectFit: 'contain' }} tintColor={dark ? 'white' : "black"} />
          <ThemeText style={styles.actionText}>Withdraw</ThemeText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onTransaction}>
          <Image source={images.transactions} style={{ width: 20, height: 20, objectFit: 'contain' }} tintColor={dark ? 'white' : "black"} />
          <ThemeText style={styles.actionText}>Transaction</ThemeText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    position: 'relative',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    paddingBottom: 40
  },
  header: {
    marginBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
  },
  eyeButton: {
    padding: 8,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  actionsContainer: {
    paddingVertical: 20,
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    flexDirection: 'row',
    // backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '90%'
  },
  actionButton: {
    flex: 1,
    // backgroundColor: 'red',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
   
    marginRight: 10,
  },
  actionText: {
    fontSize: 12,
    // color: '#333',
    // marginTop: 8,
    fontWeight: '500',
  },
});