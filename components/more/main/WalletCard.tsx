import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants';
import { useTheme } from '@/contexts/themeContext';
import ThemeText from '@/components/ThemedText';

interface WalletCardProps {
  balance: number;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onTopup: () => void;
  onWithdraw: () => void;
  onTransaction: () => void;
  userName: string;
  userImage: string;
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
}: WalletCardProps) {
  const {dark} = useTheme();
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.cardContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: userImage }} style={styles.userImage} />
            <Text style={styles.walletTitle}>My Wallet</Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              GP {isBalanceHidden ? '***,***' : formatBalance(balance)}
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
            Saldo saat ini tersimpan secara aman
          </Text>
        </View>
      </LinearGradient>

      <View style={[styles.actionsContainer,{backgroundColor:dark ? '#181818' : 'white'}]}>
        <TouchableOpacity style={styles.actionButton} onPress={onTopup}>
          <Image  source={images.topUp}  style={{width:20,height:20}}  tintColor={dark ? 'white' : "#007AFF"} />
          <ThemeText style={styles.actionText}>Topup</ThemeText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onWithdraw}>
          <Image  source={images.withdraw}  style={{width:18,height:18}}  tintColor={dark ? 'white' : "#007AFF"} />
          <ThemeText style={styles.actionText}>Withdraw</ThemeText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onTransaction}>
          <Image  source={images.transactions}  style={{width:20,height:20}}  tintColor={dark ? 'white' : "#007AFF"} />
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
    position:'relative',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    paddingBottom:40
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
    color: '#a0a0a0',
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
    position:'absolute',
    bottom:-20,
    left:'50%',
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
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    // color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});