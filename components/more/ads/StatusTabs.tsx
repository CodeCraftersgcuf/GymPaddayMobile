import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AdStatus } from './ads';
import { useTheme } from '@/contexts/themeContext';

interface StatusTabsProps {
  activeStatus: AdStatus;
  onStatusChange: (status: AdStatus) => void;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  activeStatus,
  onStatusChange
}) => {
  const { dark } = useTheme();
  const colors = {
    background: dark ? '#181818' : '#fff',
    surface: dark ? '#232323' : '#f8f9fa',
    border: dark ? '#232323' : '#e0e0e0',
    text: dark ? '#fff' : '#181818',
    textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
    primary: '#FF3B30',
    success: '#4CD964',
  };

  const tabs = [
    { value: 'all' as AdStatus, label: 'All' },
    { value: 'pending' as AdStatus, label: 'Pending' },
    { value: 'running' as AdStatus, label: 'Running' },
    { value: 'closed' as AdStatus, label: 'Closed' }
  ];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onStatusChange(tab.value)}
            style={styles.tab}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeStatus === tab.value ? colors.text : colors.textSecondary,
                  fontWeight: activeStatus === tab.value ? '600' : '400'
                }
              ]}
            >
              {tab.label}
            </Text>
            {activeStatus === tab.value && (
              <View
                style={[styles.activeIndicator, { backgroundColor: colors.primary }]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});