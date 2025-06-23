import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from './colors';

type RadioButtonProps = {
  selected: boolean;
  onPress: (event: GestureResponderEvent) => void;
  label: string;
  isDark: boolean;
};

const RadioButton: React.FC<RadioButtonProps> = ({ selected, onPress, label, isDark }) => {
  const theme = isDark ? colors.dark : colors.light;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.radio, { borderColor: theme.border }]}>
        {selected && <View style={[styles.radioSelected, { backgroundColor: colors.light.primary }]} />}
      </View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

type Styles = {
  container: ViewStyle;
  radio: ViewStyle;
  radioSelected: ViewStyle;
  label: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
  },
});

export default RadioButton;
