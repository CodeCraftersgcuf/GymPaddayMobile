import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert
} from 'react-native';
import WalletCard from '@/components/more/main/WalletCard';
import SettingItem from '@/components/more/main/SettingItem';
import { settingsData, otherSettingsData } from '@/components/more/main/settingsData';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useRouter } from 'expo-router';

import * as SecureStore from 'expo-secure-store';


export default function More() {
  const { dark, setScheme } = useTheme();
  const [balance] = useState(250000);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [openTheme, setopenTheme] = useState(false)
  const route = useRouter();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";
  
  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);


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

  const handleSettingPress = (id: string) => {
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
            { text: 'Logout', style: 'destructive' }
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
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView darkColor='#181818' style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: 'CustomFont', }]}>Wallet</Text>
          <Image source={{ uri: profileImage }} style={styles.headerProfileImage} />
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
          userImage={userProfile.image}
        />

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <ThemeText lightColor='#8E8E93' style={styles.sectionTitle}>Settings</ThemeText>
          <ThemedView lightColor='#ffffff' darkColor='#181818' style={styles.settingsContainer}>
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
                <View style={{ padding: 10, backgroundColor: dark ? '#222' : '#f0f0f0', borderRadius: 8 ,borderTopLeftRadius:0,borderTopRightRadius:0}}>
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
    paddingBottom: 100,
    marginTop: 30,
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