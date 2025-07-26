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
import { useColorScheme } from "@/hooks/useColorScheme";
import { MessageProvider } from "@/components/messages/MessageContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";
import NotificationManager from "./NotificationManager";

// ✅ Create the client only once
const queryClient = new QueryClient();

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
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const checkOnboardingAndAuth = async () => {
      const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      const storedToken = await SecureStore.getItemAsync("auth_token");
      const storedUser = await SecureStore.getItemAsync("user_data");

      if (!hasSeen && pathname !== "/OnboardingScreen") {
        router.replace("/OnboardingScreen");
      }
      console.log("stored user", JSON.parse(storedUser))

      if (storedToken) setToken(storedToken);
      if (storedUser) {
        try {
          setUserDetails(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user_data from SecureStore", e);
        }
      }

      setAppReady(true);
    };

    checkOnboardingAndAuth();
  }, []);

  useEffect(() => {
    if (isAppReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady, fontsLoaded]);

  if (!isAppReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageProvider>
          <SafeAreaProvider>

            {/* <StatusBar style={dark ? 'dark' : 'light'} /> */}
            <Stack screenOptions={{
              headerShown: false, // default behavior
            }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="forgetpassword" options={{ headerShown: false }} />
              <Stack.Screen name="codeverification" options={{ headerShown: false }} />
              <Stack.Screen name="resetpassword" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="messageChat" options={{ headerShown: false }} />
              <Stack.Screen name="deposit" options={{ headerShown: false }} />
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


            <Toast /> {/* ✅ Add this here */}
          </SafeAreaProvider>

        </MessageProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
