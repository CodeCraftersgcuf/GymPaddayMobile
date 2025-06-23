import React, { forwardRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from './colors';
import CustomSlider from './CustomSlider';
import Button from './Button';

type EditBudgetBottomSheetProps = {
  isDark: boolean;
  budget: number;
  duration: number;
  onSave: (budget: number, duration: number) => void;
};

// Ref type from @gorhom/bottom-sheet
type BottomSheetRef = React.RefObject<BottomSheet>;

const EditBudgetBottomSheet = forwardRef<BottomSheet, EditBudgetBottomSheetProps>(
  ({ isDark, budget, duration, onSave }, ref) => {
    const theme = isDark ? colors.dark : colors.light;
    const [localBudget, setLocalBudget] = useState<number>(budget);
    const [localDuration, setLocalDuration] = useState<number>(duration);

    const snapPoints = ['50%'];

    const handleSave = useCallback(() => {
      onSave(localBudget, localDuration);
      (ref as BottomSheetRef).current?.close();
    }, [localBudget, localDuration, onSave]);

    const formatCurrency = (value: number): string => `N ${value.toLocaleString()}`;
    const formatDuration = (value: number): string => `${Math.round(value)} Days`;

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetView style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>Edit Budget</Text>

          <CustomSlider
            label="Daily Budget"
            value={localBudget}
            onValueChange={setLocalBudget}
            minimumValue={2000}
            maximumValue={50000}
            isDark={isDark}
            formatValue={formatCurrency}
          />

          <CustomSlider
            label="Duration"
            value={localDuration}
            onValueChange={setLocalDuration}
            minimumValue={1}
            maximumValue={30}
            isDark={isDark}
            formatValue={formatDuration}
          />

          <Text style={[styles.note, { color: colors.light.primary }]}>
            Minimum budget is N2,000 for 1 day
          </Text>

          <Button
            title="Save"
            onPress={handleSave}
            isDark={isDark}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create<{
  container: ViewStyle;
  title: TextStyle;
  note: TextStyle;
}>({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  note: {
    fontSize: 14,
    marginBottom: 24,
  },
});

export default EditBudgetBottomSheet;
