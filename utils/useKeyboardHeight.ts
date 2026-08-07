import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Reliable keyboard overlap height for bottom-pinned inputs (live chat, comments).
 * Uses both reported height and screenY overlap for Samsung / edge-to-edge quirks.
 */
export function useKeyboardHeight(enabled = true): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      const keyboardTop = event.endCoordinates.screenY;
      const overlap = Math.max(0, windowHeight - keyboardTop);
      const reported = event.endCoordinates.height;
      setHeight(Math.max(reported, overlap));
    };

    const onHide = () => setHeight(0);

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [enabled]);

  return height;
}

export function keyboardInputOffset(
  keyboardHeight: number,
  insetBottom = 0,
  extra = 6,
): number {
  if (keyboardHeight > 0) {
    return keyboardHeight + extra;
  }
  return Math.max(insetBottom, 8);
}
