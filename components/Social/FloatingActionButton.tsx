import { images } from '@/constants';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate
} from 'react-native-reanimated';

interface FloatingActionButtonProps {
  onStartLive?: () => void;
  onCreatePost?: () => void;
}

const FAB_SIZE = 35;
const PLUS_ICON_SIZE = 14;

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onStartLive,
  onCreatePost
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    animation.value = withSpring(toValue, {
      damping: 15,
      stiffness: 100,
    });
    setIsOpen(!isOpen);
  };

  const liveButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(interpolate(animation.value, [0, 1], [0, 1])) },
        {
          translateY: withSpring(
            interpolate(animation.value, [0, 1], [0, 140])
          )
        }
      ],
      opacity: withTiming(interpolate(animation.value, [0, 0.5, 1], [0, 0, 1])),
    };
  });

  const postButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(interpolate(animation.value, [0, 1], [0, 1])) },
        {
          translateY: withSpring(
            interpolate(animation.value, [0, 1], [0, 70])
          )
        }
      ],
      opacity: withTiming(interpolate(animation.value, [0, 0.5, 1], [0, 0, 1])),
    };
  });

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(`${interpolate(animation.value, [0, 1], [0, 45])}deg`)
        }
      ],
    };
  });

  const handleStartLive = () => {
    toggleMenu();
    onStartLive?.();
  };

  const handleCreatePost = () => {
    toggleMenu();
    onCreatePost?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.fab} onPress={toggleMenu} activeOpacity={0.8}>
        <Animated.View style={rotateStyle}>
          <Image
            source={images.CreatePlus}
            style={{ width: PLUS_ICON_SIZE, height: PLUS_ICON_SIZE }}
          />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleMenu}
          style={styles.modalBackdrop}
        >
          <View style={styles.menuAnchor} pointerEvents="box-none">
            <Animated.View style={[styles.menuButton, postButtonStyle]}>
              <TouchableOpacity style={styles.button} onPress={handleCreatePost}>
                <Text style={styles.buttonText}>Create Post</Text>
                <View style={[styles.ImagesButton, styles.postButton]}>
                  <Image
                    source={images.notifcationIcon}
                    tintColor={'white'}
                    style={{ width: 25, height: 25 }}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuButton, liveButtonStyle]}>
              <TouchableOpacity style={styles.button} onPress={handleStartLive}>
                <Text style={styles.buttonText}>Start Live</Text>
                <View style={[styles.ImagesButton, styles.liveButton]}>
                  <Image
                    source={images.CreateVideo}
                    tintColor={'white'}
                    style={{ width: 25, height: 25 }}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#940304',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  menuAnchor: {
    position: 'absolute',
    top: 52,
    right: 60,
    alignItems: 'flex-end',
  },
  menuButton: {
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  liveButton: {
    backgroundColor: '#6c5ce7',
  },
  postButton: {
    backgroundColor: '#ff00ff',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default FloatingActionButton;
