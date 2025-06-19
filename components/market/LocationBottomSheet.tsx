import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import {Ionicons as Icon} from '@expo/vector-icons';

interface Location {
  id: string;
  title: string;
}

interface LocationBottomSheetProps {
  locations: Location[];
  selectedLocation: string;
  onSelectLocation: (locationId: string) => void;
  isDark: boolean;
}

const LocationBottomSheet = forwardRef<BottomSheet, LocationBottomSheetProps>(
  ({ locations, selectedLocation, onSelectLocation, isDark }, ref) => {
    const snapPoints = useMemo(() => ['60%'], []);

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

    const handleLocationSelect = (locationId: string) => {
      onSelectLocation(locationId);
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
          <Text style={[styles.title, { color: theme.text }]}>Location</Text>
          
          <View style={styles.locationsContainer}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationItem,
                  { borderBottomColor: theme.borderColor }
                ]}
                onPress={() => handleLocationSelect(location.id)}
              >
                <View style={styles.locationLeft}>
                  <Icon name="location-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.locationTitle, { color: theme.text }]}>
                    {location.title}
                  </Text>
                </View>
                
                <View style={[
                  styles.radioButton,
                  { borderColor: selectedLocation === location.id ? '#FF0000' : theme.borderColor }
                ]}>
                  {selectedLocation === location.id && (
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
  locationsContainer: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
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

export default LocationBottomSheet;