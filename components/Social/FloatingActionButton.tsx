import { images } from '@/constants';
import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

/** Matches TabHeader `UserImage` (profile) */
const HEADER_ICON_SIZE = 35;
const MENU_GAP = 8;
const MENU_CLUSTER_WIDTH = 140;

interface FloatingActionButtonProps {
  onStartLive?: () => void;
  onCreatePost?: () => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onStartLive,
  onCreatePost,
  expanded,
  onExpandedChange,
}) => {
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withSpring(expanded ? 1 : 0, {
      damping: 16,
      stiffness: 140,
    });
  }, [expanded]);

  /** Menu drops down from below the +; hidden state slightly upward */
  const menuColumnStyle = useAnimatedStyle(() => {
    const t = interpolate(animation.value, [0, 1], [-12, 0]);
    const s = interpolate(animation.value, [0, 1], [0.92, 1]);
    const o = interpolate(animation.value, [0, 0.25, 1], [0, 0.5, 1]);
    return {
      opacity: withTiming(o),
      transform: [{ translateY: withSpring(t) }, { scale: withSpring(s) }],
    };
  });

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(
            `${interpolate(animation.value, [0, 1], [0, 45])}deg`,
          ),
        },
      ],
    };
  });

  const toggleMenu = () => onExpandedChange(!expanded);

  const handleStartLive = () => {
    onExpandedChange(false);
    onStartLive?.();
  };

  const handleCreatePost = () => {
    onExpandedChange(false);
    onCreatePost?.();
  };

  return (
    <View style={styles.anchor}>
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? 'Close create menu' : 'Create post or go live'
        }
      >
        <Animated.View style={rotateStyle}>
          <Image source={images.CreatePlus} style={styles.plusIcon} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[styles.menuColumnBelow, menuColumnStyle]}
        collapsable={false}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[styles.circleAction, styles.postButton]}
          onPress={handleCreatePost}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create post"
        >
          <Image
            source={images.notifcationIcon}
            tintColor="white"
            style={styles.circleActionIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleAction, styles.liveButton]}
          onPress={handleStartLive}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Start live stream"
        >
          <Image
            source={images.CreateVideo}
            tintColor="white"
            style={styles.circleActionIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: {
    width: HEADER_ICON_SIZE,
    minHeight: HEADER_ICON_SIZE,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginHorizontal: 2,
    zIndex: 20,
    overflow: 'visible',
  },
  /** Anchored under the + so actions open downward into the feed, not above the header */
  menuColumnBelow: {
    position: 'absolute',
    top: HEADER_ICON_SIZE + MENU_GAP,
    width: MENU_CLUSTER_WIDTH,
    left: (HEADER_ICON_SIZE - MENU_CLUSTER_WIDTH) / 2,
    flexDirection: 'column',
    alignItems: 'center',
    gap: MENU_GAP,
  },
  fab: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: HEADER_ICON_SIZE / 2,
    backgroundColor: '#940304',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    zIndex: 2,
  },
  plusIcon: {
    width: 16,
    height: 16,
  },
  circleAction: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: HEADER_ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  circleActionIcon: {
    width: 17,
    height: 17,
  },
  liveButton: {
    backgroundColor: '#6c5ce7',
  },
  postButton: {
    backgroundColor: '#ff00ff',
  },
});

export default FloatingActionButton;
