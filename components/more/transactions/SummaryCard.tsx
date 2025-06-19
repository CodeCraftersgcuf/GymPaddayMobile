import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
  leftLabel: string;
  leftAmount: string;
  rightLabel: string;
  rightAmount: string;
  lastUpdated: string;
}

export default function SummaryCard({ 
  leftLabel, 
  leftAmount, 
  rightLabel, 
  rightAmount, 
  lastUpdated 
}: SummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.section}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{leftLabel}</Text>
          </View>
          <Text style={styles.amount}>{leftAmount}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{rightLabel}</Text>
          </View>
          <Text style={styles.amount}>{rightAmount}</Text>
        </View>
      </View>
      <Text style={styles.lastUpdated}>{lastUpdated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  section: {
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  lastUpdated: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});