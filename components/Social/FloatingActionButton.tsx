import { images } from '@/constants';
import { BRAND_PRIMARY } from '@/constants/Colors';
import { useTheme } from '@/contexts/themeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps {
  onStartLive?: () => void;
  onCreatePost?: () => void;
}

type MenuAction = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  onPress: () => void;
};

const FAB_SIZE = 35;
const PLUS_ICON_SIZE = 14;

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onStartLive,
  onCreatePost,
}) => {
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = React.useState(false);
  const openProgress = useSharedValue(0);

  useEffect(() => {
    openProgress.value = withTiming(isOpen ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isOpen, openProgress]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withSpring(`${openProgress.value * 45}deg`, {
          damping: 16,
          stiffness: 160,
        }),
      },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
    transform: [
      {
        translateY: withSpring((1 - openProgress.value) * 14, {
          damping: 18,
          stiffness: 160,
        }),
      },
      {
        scale: withSpring(0.94 + openProgress.value * 0.06, {
          damping: 16,
          stiffness: 150,
        }),
      },
    ],
  }));

  const handleStartLive = () => {
    closeMenu();
    onStartLive?.();
  };

  const handleCreatePost = () => {
    closeMenu();
    onCreatePost?.();
  };

  const actions: MenuAction[] = [
    {
      key: 'post',
      title: 'Create Post',
      subtitle: 'Share with community',
      icon: 'create-outline',
      iconBg: BRAND_PRIMARY,
      onPress: handleCreatePost,
    },
    {
      key: 'live',
      title: 'Go Live',
      subtitle: 'Stream in real-time',
      icon: 'radio-outline',
      iconBg: '#9B1830',
      onPress: handleStartLive,
    },
  ];

  const cardBg = dark ? '#1C1C1E' : '#FFFFFF';
  const titleColor = dark ? '#FFFFFF' : '#111111';
  const subtitleColor = dark ? '#A0A0A5' : '#8A8A8E';
  const dividerColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const headerColor = dark ? '#F5F5F5' : '#111111';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Close create menu' : 'Open create menu'}
      >
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
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeMenu} />

          <Animated.View
            style={[
              styles.card,
              cardStyle,
              {
                backgroundColor: cardBg,
                top: insets.top + 58,
                shadowColor: dark ? '#000' : '#1A1A1A',
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardHeaderTitle, { color: headerColor }]}>Create</Text>
              <TouchableOpacity
                style={[styles.closeChip, { backgroundColor: dark ? '#2C2C2E' : '#F2F2F4' }]}
                onPress={closeMenu}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={16} color={dark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            {actions.map((action, index) => (
              <React.Fragment key={action.key}>
                {index > 0 && (
                  <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                )}
                <TouchableOpacity
                  style={styles.row}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconTile, { backgroundColor: action.iconBg }]}>
                    <Ionicons name={action.icon} size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.textBlock}>
                    <Text style={[styles.title, { color: titleColor }]}>{action.title}</Text>
                    <Text style={[styles.subtitle, { color: subtitleColor }]}>
                      {action.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={subtitleColor} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Animated.View>
        </View>
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
    backgroundColor: BRAND_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    position: 'absolute',
    right: 16,
    width: 286,
    borderRadius: 22,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 10,
  },
});

export default FloatingActionButton;
