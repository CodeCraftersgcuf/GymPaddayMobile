import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/Colors";

interface ThemeContextType {
  dark: boolean;
  colors: typeof Colors.light;
  setScheme: (scheme: "light" | "dark") => void;
}

const defaultThemeContext: ThemeContextType = {
  dark: false,
  colors: Colors.light,
  setScheme: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === "dark");

  // Load stored theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedScheme = await AsyncStorage.getItem("app-theme");
      if (savedScheme === "light" || savedScheme === "dark") {
        setIsDark(savedScheme === "dark");
      } else {
        setIsDark(colorScheme === "dark");
      }
    };
    loadTheme();
  }, [colorScheme]);

  // Save manually selected theme
  const setScheme = async (scheme: "light" | "dark") => {
    await AsyncStorage.setItem("app-theme", scheme);
    setIsDark(scheme === "dark");
  };

  const theme: ThemeContextType = {
    dark: isDark,
    colors: isDark ? Colors.dark : Colors.light,
    setScheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
