import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import {Ionicons as Icon} from '@expo/vector-icons';

interface Category {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface CategoryBottomSheetProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  isDark: boolean;
}

const CategoryBottomSheet = forwardRef<BottomSheet, CategoryBottomSheetProps>(
  ({ categories, selectedCategory, onSelectCategory, isDark }, ref) => {
    const snapPoints = useMemo(() => ['50%'], []);

    const theme = {
      background: isDark ? '#000000' : '#FFFFFF',
      cardBackground: isDark ? '#181818' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#CCCCCC' : '#666666',
      borderColor: isDark ? '#333333' : '#E5E5E5',
    };

    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    );

    const handleCategorySelect = (categoryId: string) => {
      onSelectCategory(categoryId);
      // @ts-ignore
      ref?.current?.close();
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.cardBackground }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetView style={styles.contentContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Category</Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  { borderBottomColor: theme.borderColor }
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Icon name={category.icon} size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>
                    {category.title}
                  </Text>
                </View>
                
                <View style={[
                  styles.radioButton,
                  { borderColor: selectedCategory === category.id ? '#FF0000' : theme.borderColor }
                ]}>
                  {selectedCategory === category.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
  },
});

export default CategoryBottomSheet;