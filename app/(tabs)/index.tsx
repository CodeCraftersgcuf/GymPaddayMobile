import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { SafeAreaView } from 'react-native';
import useCustomFonts from '../../contexts/hooks/useCustomFonts';
export default function index() {
  const fontsLoaded = useCustomFonts();

  if (!fontsLoaded) return null; // or a loader
  return (
    <SafeAreaView>
      <ThemedView>
        <ThemeText style={{ fontFamily: 'CustomFont' }}>socials</ThemeText>
      </ThemedView>
    </SafeAreaView>
  );
}