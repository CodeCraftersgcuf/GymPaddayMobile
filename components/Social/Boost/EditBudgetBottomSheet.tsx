import React, { forwardRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from './colors';
import Button from './Button';

const MIN_DAILY_GP = 2000;
const MAX_DAILY_GP = 50000;
const MIN_DAYS = 1;
const MAX_DAYS = 30;

type EditBudgetBottomSheetProps = {
  isDark: boolean;
  budget: number;
  duration: number;
  onSave: (budget: number, duration: number) => void;
};

const EditBudgetBottomSheet = forwardRef<BottomSheet, EditBudgetBottomSheetProps>(
  ({ isDark, budget, duration, onSave }, ref) => {
    const theme = isDark ? colors.dark : colors.light;
    const [budgetStr, setBudgetStr] = useState(String(Math.round(budget)));
    const [durationStr, setDurationStr] = useState(String(Math.round(duration)));

    const snapPoints = ['55%'];

    const syncFromProps = useCallback(() => {
      setBudgetStr(String(Math.round(budget)));
      setDurationStr(String(Math.round(duration)));
    }, [budget, duration]);

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index >= 0) {
          syncFromProps();
        }
      },
      [syncFromProps]
    );

    const close = useCallback(() => {
      (ref as React.RefObject<BottomSheet | null>)?.current?.close();
    }, [ref]);

    const handleSave = useCallback(() => {
      const b = parseInt(budgetStr.replace(/\D/g, ''), 10);
      const d = parseInt(durationStr.replace(/\D/g, ''), 10);
      if (!Number.isFinite(b) || !Number.isFinite(d)) {
        Alert.alert('Invalid input', 'Please enter whole numbers for daily budget (GP) and duration (days).');
        return;
      }
      const clampedB = Math.min(MAX_DAILY_GP, Math.max(MIN_DAILY_GP, b));
      const clampedD = Math.min(MAX_DAYS, Math.max(MIN_DAYS, d));
      onSave(clampedB, clampedD);
      close();
    }, [budgetStr, durationStr, onSave, close]);

    const handleCancel = useCallback(() => {
      syncFromProps();
      close();
    }, [syncFromProps, close]);

    const inputStyle = [
      styles.input,
      {
        backgroundColor: theme.surface,
        color: theme.text,
        borderColor: theme.textSecondary,
      },
    ];

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetView style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>Edit budget & duration</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Type exact amounts (same limits as the sliders).
          </Text>

          <Text style={[styles.label, { color: theme.text }]}>Daily budget (GP)</Text>
          <TextInput
            style={inputStyle}
            value={budgetStr}
            onChangeText={(t) => setBudgetStr(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder={`${MIN_DAILY_GP.toLocaleString()} – ${MAX_DAILY_GP.toLocaleString()}`}
            placeholderTextColor={theme.textSecondary}
          />

          <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Duration (days)</Text>
          <TextInput
            style={inputStyle}
            value={durationStr}
            onChangeText={(t) => setDurationStr(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder={`${MIN_DAYS} – ${MAX_DAYS}`}
            placeholderTextColor={theme.textSecondary}
          />

          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {(() => {
              const bp = parseInt(budgetStr, 10);
              const dp = parseInt(durationStr, 10);
              const ok = Number.isFinite(bp) && Number.isFinite(dp) && bp > 0 && dp > 0;
              return ok
                ? `Total upfront (preview): GP ${(bp * dp).toLocaleString()}`
                : 'Total upfront (preview): —';
            })()}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.saveWrap}>
              <Button title="Save" onPress={handleSave} isDark={isDark} />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

EditBudgetBottomSheet.displayName = 'EditBudgetBottomSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },
  note: {
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  saveWrap: {
    width: '100%',
  },
});

export default EditBudgetBottomSheet;
