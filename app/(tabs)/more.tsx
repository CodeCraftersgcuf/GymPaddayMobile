import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import WalletCard from '@/components/more/main/WalletCard';
import SettingItem from '@/components/more/main/SettingItem';
import { settingsData, otherSettingsData } from '@/components/more/main/settingsData';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";



export default function More() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });
  const { dark, setScheme } = useTheme();
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [openTheme, setopenTheme] = useState(false)
  const [refreshing, setRefreshing] = useState(false);
  const route = useRouter();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";

  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);

  const [loadingBalance, setLoadingBalance] = useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(defatulImage); // fallback to prop
          }
        } else {
          setProfileImage(defatulImage); // fallback to prop
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(defatulImage); // fallback to prop
      }
    })();
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true); // start loading
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No token founds');

        const response = await fetch('https://gympaddy.hmstech.xyz/api/user/balance', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();
        console.log('Balance fetch result:', result);

        if (response.ok && result.status === 'success') {
          setBalance(Number(result.balance));
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch balance');
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
        Alert.alert('Error', 'Unable to fetch wallet balance.');
      } finally {
        setLoadingBalance(false); // stop loading
      }
    })();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      setLoadingBalance(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token found');

      const response = await fetch('https://gympaddy.hmstech.xyz/api/user/balance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setBalance(Number(result.balance));
      }

      // Also refresh user profile data including profile image
      const userDataStr = await SecureStore.getItemAsync('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.profile_picture_url) {
          setProfileImage(userData.profile_picture_url);
        }
      }
    } catch (error) {
      console.error('Refresh balance error:', error);
    } finally {
      setLoadingBalance(false);
      setRefreshing(false);
    }
  }, []);


  const userProfile = {
    name: 'Sarah Johnson',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  };

  const handleToggleBalance = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handleTopup = () => {
    route.push('/deposit');
    // Alert.alert('Topup', 'Topup functionality will be implemented here');
  };

  const handleWithdraw = () => {
    // Alert.alert('Withdraw', 'Withdraw functionality will be implemented here');
    route.push('/withdraw');
  };

  const handleTransaction = () => {
    route.push('/transactionHistory');
    // Alert.alert('Transaction', 'Transaction history will be shown here');
  };

  const handleSettingPress = async (id: string) => {
    switch (id) {
      case 'notifications':
        // Alert.alert('Notifications', 'Notification settings');
        route.push('/notification');
        break;
      case 'edit-profile':
        // Alert.alert('Edit Profile', 'Profile editing screen');
        route.push('/EditProfile')
        break;
      case 'gifts-history':
        route.push('/giftHistory');
        break;
      case 'business-settings':
        // Alert.alert('Business Settings', 'Business account settings');
        route.push('/bussinessRegister');
        break;
      case 'view-ads':
        // Alert.alert('View Ads', 'Advertisement preferences');
        route.push('/adsProfile')
        break;
      case 'support':
        // Alert.alert('Support', 'Contact customer support');
        route.push('/support')
        break;
      case 'theme':
        Alert.alert('Theme', 'Switch between light and dark theme');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: async () => {
                try {
                  await SecureStore.deleteItemAsync('auth_token');
                  await SecureStore.deleteItemAsync('user_data');
                  // Optionally clear other sensitive data here
                  route.replace('/login');
                } catch (e) {
                  Alert.alert('Error', 'Failed to logout. Please try again.');
                }
              }
            }
          ]
        );
        break;
      case 'delete-account':
        Alert.alert(
          'Delete Account',
          'This action cannot be undone. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive' }
          ]
        );
        break;
      default:
        Alert.alert('Feature', `${id} feature coming soon`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : '#FAFAFA' }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF3B30']}
            tintColor="#FF3B30"
            title="Pull to refresh"
            titleColor={dark ? '#fff' : '#000'}
          />
        }
      >
        {/* Header */}
        <ThemedView darkColor='#181818' style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_400Regular', }]}>Wallet</Text>
          <TouchableOpacity onPress={() => route.push('/EditProfile')}>
            <Image source={{ uri: profileImage }} style={styles.headerProfileImage} />
          </TouchableOpacity>
        </ThemedView>

        {/* Wallet Card */}
        <WalletCard
          balance={balance}
          isBalanceHidden={isBalanceHidden}
          onToggleBalance={handleToggleBalance}
          onTopup={handleTopup}
          onWithdraw={handleWithdraw}
          onTransaction={handleTransaction}
          userName={userProfile.name}
          userImage={profileImage} // Use profileImage state instead of userProfile.image
          loading={loadingBalance}
        />

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <ThemeText lightColor='#8E8E93' style={styles.sectionTitle}>Settings</ThemeText>
          <ThemedView lightColor='#FAFAFA' darkColor='#181818' style={styles.settingsContainer}>
            {settingsData.map((item) => (
              <SettingItem
                key={item.id}
                item={item}
                onPress={handleSettingPress}
              />
            ))}
          </ThemedView>
        </View>

        {/* Other Section */}
        <View style={styles.settingsSection}>
          <ThemeText style={styles.sectionTitle}>Other</ThemeText>
          <View style={styles.settingsContainer}>
            <View>
              <SettingItem
                item={{
                  id: 'theme',
                  title: 'Theme',
                  icon: 'moon',
                  iconFamily: 'Feather',
                  backgroundColor: 'transparent',
                }}
                onPress={() => setopenTheme(!openTheme)}
              />
              {openTheme && (
                <View style={{ padding: 10, backgroundColor: dark ? '#222' : '#FAFAFA', borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <SettingItem
                    item={{
                      id: 'light-theme',
                      title: 'Light Theme',
                      icon: 'sun',
                      iconFamily: 'Feather',
                      backgroundColor: 'transparent',
                    }}
                    onPress={() => setScheme('light')}
                  />
                  <SettingItem
                    item={{
                      id: 'dark-theme',
                      title: 'Dark Theme',
                      icon: 'moon',
                      iconFamily: 'Feather',
                      backgroundColor: 'transparent',
                    }}
                    onPress={() => setScheme('dark')}
                  />
                </View>
              )}
            </View>
            {otherSettingsData.map((item) => (
              <SettingItem
                key={item.id}
                item={item}
                onPress={handleSettingPress}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,


  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    // fontWeight: 'bold',
    color: '#FF3B30',
    // fontStyle: 'italic',
    // paddingVertical:10
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // paddingVertical:10
  },
  settingsSection: {
    marginTop: 50,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 20,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsContainer: {
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  bottomSpacing: {
    height: 100,
  },
});