import React, { forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';

interface BottomSheetMenuProps {
  dark: boolean;
  onNavigateToListing: () => void;
  onClose: () => void;
}

const BottomSheetMenu = forwardRef<BottomSheet, BottomSheetMenuProps>(
  ({ dark, onNavigateToListing, onClose }, ref) => {
    const snapPoints = ['25%', '50%'];

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: dark ? '#181818' : '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: dark ? '#666666' : '#CCCCCC' }}
      >
        <View style={styles.container}>
          <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
            Menu Options
          </Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={onNavigateToListing}
          >
            <MaterialIcons 
              name="list" 
              size={24} 
              color={dark ? '#FFFFFF' : '#000000'} 
            />
            <Text style={[styles.menuItemText, { color: dark ? '#FFFFFF' : '#000000' }]}>
              Go to Listing
            </Text>
            <MaterialIcons 
              name="arrow-forward-ios" 
              size={16} 
              color={dark ? '#666666' : '#CCCCCC'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons 
              name="settings" 
              size={24} 
              color={dark ? '#FFFFFF' : '#000000'} 
            />
            <Text style={[styles.menuItemText, { color: dark ? '#FFFFFF' : '#000000' }]}>
              Settings
            </Text>
            <MaterialIcons 
              name="arrow-forward-ios" 
              size={16} 
              color={dark ? '#666666' : '#CCCCCC'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons 
              name="help" 
              size={24} 
              color={dark ? '#FFFFFF' : '#000000'} 
            />
            <Text style={[styles.menuItemText, { color: dark ? '#FFFFFF' : '#000000' }]}>
              Help & Support
            </Text>
            <MaterialIcons 
              name="arrow-forward-ios" 
              size={16} 
              color={dark ? '#666666' : '#CCCCCC'} 
            />
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
});

export default BottomSheetMenu;