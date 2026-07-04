import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { ThemeProvider } from "@/contexts/themeContext";
import { MessageProvider } from "@/components/messages/MessageContext";import AppQueryProvider from "@/components/AppQueryProvider";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import { AppBootProvider, useAppBoot } from "@/contexts/AppBootContext";
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";
import NotificationManager from "./NotificationManager";

// Prevent the splash screen from auto-hiding before boot preload completes
SplashScreen.preventAutoHideAsync();

function BootAwareRoot({ token, userDetails }: { token: string | null; userDetails: any }) {
  const boot = useAppBoot();

  useEffect(() => {
    if (boot.phase === 'ready') {
      SplashScreen.hideAsync();
    }
  }, [boot.phase]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="OnboardingScreen" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="forgetpassword" options={{ headerShown: false }} />
        <Stack.Screen name="codeverification" options={{ headerShown: false }} />
        <Stack.Screen name="resetpassword" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="messageChat" options={{ headerShown: false }} />
        <Stack.Screen name="deposit" options={{ headerShown: false }} />
        <Stack.Screen name="topup" options={{ headerShown: false }} />
        <Stack.Screen name="withdraw" options={{ headerShown: false }} />
        <Stack.Screen name="transactionHistory" options={{ headerShown: false }} />
        <Stack.Screen name="giftHistory" options={{ headerShown: false }} />
        <Stack.Screen name="notification" options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="adsProfile" options={{ headerShown: false }} />
        <Stack.Screen name="adsDetail" options={{ headerShown: false }} />
        <Stack.Screen name="bussinessForm" options={{ headerShown: false }} />
        <Stack.Screen name="createpost" options={{ headerShown: false }} />
        <Stack.Screen name="bussinessRegister" options={{ headerShown: false }} />
        <Stack.Screen name="marketView" options={{ headerShown: false }} />
        <Stack.Screen name="addListing" options={{ headerShown: false }} />
        <Stack.Screen name="marketProfile" options={{ headerShown: false }} />
        <Stack.Screen name="AgoraCallScreen" options={{ headerShown: false }} />
        <Stack.Screen name="UserListing" options={{ headerShown: false }} />
        <Stack.Screen name="UserProfile" options={{ headerShown: false }} />
        <Stack.Screen name="goLive" options={{ headerShown: false }} />
        <Stack.Screen name="BoostPostScreen" options={{ headerShown: false }} />
        <Stack.Screen name="BoostPostScreen_review" options={{ headerShown: false }} />
        <Stack.Screen name="BoostPostScreen_Final" options={{ headerShown: false }} />
        <Stack.Screen name="BoostPostScreen_audience" options={{ headerShown: false }} />
        <Stack.Screen name="userLiveViewMain" options={{ headerShown: false }} />
        <Stack.Screen name="MediaViewer" options={{ headerShown: false }} />
        <Stack.Screen name="daily-call-screen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {token && userDetails && (
        <NotificationManager token={token} user={userDetails} />
      )}
      <Toast />
    </>
  );
}

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [isAppReady, setAppReady] = useState(false);
  const [cacheHydrated, setCacheHydrated] = useState(false);

  const [fontsLoaded] = useFonts({
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // If no fonts are loaded, consider fonts as loaded
  const fontsReady = fontsLoaded !== false;
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const checkOnboardingAndAuth = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        const storedToken = await SecureStore.getItemAsync("auth_token");
        const storedUser = await SecureStore.getItemAsync("user_data");

        if (storedToken) setToken(storedToken);
        if (storedUser) {
          try {
            setUserDetails(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse user_data from SecureStore", e);
          }
        }

        setAppReady(true);
      } catch (error) {
        console.error("Error in checkOnboardingAndAuth:", error);
        setAppReady(true); // Still set ready to prevent infinite loading
      }
    };

    checkOnboardingAndAuth();
  }, []);

  if (!isAppReady || !fontsReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#940304" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AppQueryProvider onHydrated={() => setCacheHydrated(true)}>
      <AppBootProvider cacheHydrated={cacheHydrated}>
      <ThemeProvider>
        <MessageProvider>
          <AppSessionProviders>
          <SafeAreaProvider>
            <BootAwareRoot token={token} userDetails={userDetails} />
          </SafeAreaProvider>
          </AppSessionProviders>
        </MessageProvider>
      </ThemeProvider>
      </AppBootProvider>
    </AppQueryProvider>
    </GestureHandlerRootView>
  );
}
