import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from './colors';

type ProgressBarProps = {
  progress: number; // Expected to be between 0 and 100
  isDark: boolean;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isDark }) => {
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${progress}%`,
            backgroundColor: colors.light.primary // You can switch this to `theme.primary` if needed
          }
        ]} 
      />
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  progress: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 24,
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ProgressBar;
