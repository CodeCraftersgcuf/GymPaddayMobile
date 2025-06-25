import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { ThemeProvider, useTheme } from "@/contexts/themeContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MessageProvider } from "@/components/messages/MessageContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

// ✅ Create the client only once
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { dark } = useTheme();
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageProvider>
          <StatusBar style={dark ? 'dark' : 'light'} />
          <Stack>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <Toast /> {/* ✅ Add this here */}

        </MessageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
