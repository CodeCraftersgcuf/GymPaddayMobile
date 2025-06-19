import { images } from '@/constants';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface FloatingActionButtonProps {
  onStartLive?: () => void;
  onCreatePost?: () => void;
}

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
            interpolate(animation.value, [0, 1], [0, -140])
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
            interpolate(animation.value, [0, 1], [0, -70])
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

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleMenu}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.overlay} />
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        {/* Live Button */}
        <Animated.View style={[styles.menuButton, liveButtonStyle,{marginBottom:0},{right:15}]}>
          <TouchableOpacity style={styles.button} onPress={onStartLive}>
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

        {/* Post Button */}
        <Animated.View style={[styles.menuButton, postButtonStyle]}>
          <TouchableOpacity style={styles.button} onPress={onCreatePost}>
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

        {/* Main FAB */}
        <TouchableOpacity style={styles.fab} onPress={toggleMenu} activeOpacity={0.8}>
          <Animated.View style={rotateStyle}>
            <Image source={images.CreatePlus} style={{ width: 20, height: 20 }} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );

};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 0,
  },
  container: {
    position: 'absolute',
    bottom: 90, // Ensure it is visible
    right: 20, // Ensure it is visible
    alignItems: 'center',
    zIndex: 10, // Ensure it is above other components
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  menuButton: {
    position: 'absolute',
    bottom: 0,
    right: 30,
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
    // right:0,
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