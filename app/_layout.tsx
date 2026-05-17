import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
// import { StatusBar } from "expo-status-bar";
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


import { useEffect, useState } from "react";
import "react-native-reanimated";
import { ThemeProvider, useTheme } from "@/contexts/themeContext";
import { FeedVideoProvider } from "@/contexts/FeedVideoContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MessageProvider } from "@/components/messages/MessageContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import NotificationManager from "./NotificationManager";
import { Ionicons } from "@expo/vector-icons";

// ✅ Create the client only once
const queryClient = new QueryClient();
const IOS_GLOBAL_BACK_EXCLUDED_ROUTES = new Set([
  '/',
  '/index',
  '/OnboardingScreen',
  '/login',
  '/register',
  '/forgetpassword',
  '/codeverification',
  '/resetpassword',
  '/verify-otp',
  '/(tabs)',
  '/goLive',
  '/BoostPostScreen',
  '/BoostPostScreen_review',
  '/BoostPostScreen_audience',
  '/BoostPostScreen_Final',
  '/deposit',
  '/topup',
  '/withdraw',
  '/transactionHistory',
  '/giftHistory',
  '/notification',
  '/EditProfile',
  '/support',
  '/adsProfile',
  '/adsDetail',
  '/bussinessForm',
  '/bussinessRegister',
  '/marketView',
  '/addListing',
  '/marketProfile',
  '/UserListing',
  '/UserProfile',
  '/messageChat',
  '/createpost',
  '/MediaViewer',
  '/daily-call-screen',
  '/voiceCall',
  '/VoiceCallScreen',
  '/StreamIncomingCall',
  '/StreamCallInitiateScreen',
]);

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();

  const [isAppReady, setAppReady] = useState(false);

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

        // Navigate after app is ready and router is available
        if (!hasSeen) {
          // Small delay to ensure Stack is mounted
          setTimeout(() => {
            router.replace("/OnboardingScreen");
          }, 200);
        }
      } catch (error) {
        console.error("Error in checkOnboardingAndAuth:", error);
        setAppReady(true); // Still set ready to prevent infinite loading
      }
    };

    checkOnboardingAndAuth();
  }, []);

  useEffect(() => {
    if (isAppReady && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady, fontsReady]);

  if (!isAppReady || !fontsReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const showGlobalIosBack =
    Platform.OS === "ios" &&
    !!pathname &&
    !pathname.startsWith('/(tabs)') &&
    !IOS_GLOBAL_BACK_EXCLUDED_ROUTES.has(pathname);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FeedVideoProvider>
        <MessageProvider>
          <SafeAreaProvider>

            {/* <StatusBar style={dark ? 'dark' : 'light'} /> */}
            <Stack screenOptions={{
              headerShown: false, // default behavior
            }}>
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
            {showGlobalIosBack && (
              <TouchableOpacity
                style={styles.globalBackButton}
                onPress={() => {
                  if (router.canGoBack()) router.back();
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#111" />
              </TouchableOpacity>
            )}
            {token && userDetails && (
              <NotificationManager token={token} user={userDetails} />
            )}


            <Toast /> {/* ✅ Add this here */}
          </SafeAreaProvider>

        </MessageProvider>
        </FeedVideoProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  globalBackButton: {
    position: "absolute",
    top: 52,
    left: 12,
    zIndex: 9999,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
  },
});
