import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from './colors';

type CustomSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  label: string;
  isDark: boolean;
  formatValue?: (value: number) => string | number;
};

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  label,
  isDark,
  formatValue,
}) => {
  const theme = isDark ? colors.dark : colors.light;
  const trackWidth = useRef(0);

  // Calculate thumb position based on value
  const getThumbLeft = () => {
    if (trackWidth.current === 0) return 0;
    const ratio = (value - minimumValue) / (maximumValue - minimumValue);
    return ratio * (trackWidth.current - THUMB_SIZE);
  };

  // Handle pan gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        handleMove(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt, gestureState) => {
        handleMove(evt.nativeEvent.locationX);
      },
    })
  ).current;

  // Update value based on thumb position
  const handleMove = (x: number) => {
    let pos = x - THUMB_SIZE / 2;
    pos = Math.max(0, Math.min(pos, trackWidth.current - THUMB_SIZE));
    const ratio = pos / (trackWidth.current - THUMB_SIZE);
    const newValue =
      minimumValue + ratio * (maximumValue - minimumValue);
    onValueChange(Number(newValue.toFixed(2)));
  };

  // Get track width on layout
  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.sliderContainer}>
        <View
          style={[
            styles.track,
            { backgroundColor: theme.border, height: TRACK_HEIGHT },
          ]}
          onLayout={onTrackLayout}
        >
          <View
            style={[
              styles.filledTrack,
              {
                backgroundColor: colors.light.primary,
                width: getThumbLeft() + THUMB_SIZE / 2,
                height: TRACK_HEIGHT,
              },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.light.primary,
                left: getThumbLeft(),
                top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
              },
            ]}
            {...panResponder.panHandlers}
          />
        </View>
      </View>
      <Text style={[styles.value, { color: theme.text }]}>
        {formatValue ? formatValue(value) : value}
      </Text>
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  label: TextStyle;
  sliderContainer: ViewStyle;
  thumb: ViewStyle;
  track: ViewStyle;
  filledTrack: ViewStyle;
  value: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    marginBottom: 16,
    color:'#00000080'
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  track: {
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#ccc',
    position: 'relative',
    justifyContent: 'center',
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  value: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default CustomSlider;
