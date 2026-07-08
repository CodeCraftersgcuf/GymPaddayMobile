import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { safeGoBack } from '@/utils/safeNavigation';

/** Hardware + programmatic back that falls back to tabs when the stack is empty. */
export function useSafeBack(enabled = true) {
  const router = useRouter();

  const goBack = useCallback(() => {
    safeGoBack(router);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;

      const onBackPress = () => {
        safeGoBack(router);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [enabled, router]),
  );

  return goBack;
}
