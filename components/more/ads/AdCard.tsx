import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ad } from './ads';
import { useTheme } from '@/contexts/themeContext';

interface AdCardProps {
  ad: Ad;
  onEdit: (ad: Ad) => void;
  onToggleStatus: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  onViewDetails: (ad: Ad) => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  onEdit,
  onToggleStatus,
  onDelete,
  onViewDetails
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'running':
        return colors.success;
      case 'closed':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return dark ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.1)';
      case 'running':
        return dark ? 'rgba(76, 217, 100, 0.1)' : 'rgba(76, 217, 100, 0.1)';
      case 'closed':
        return dark ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.1)';
      default:
        return colors.surface;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onViewDetails(ad)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          shadowColor: dark ? '#000' : '#000',
        }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: ad.image }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {ad.title}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {ad.price}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(ad.status) }
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(ad.status) }
              ]}
            >
              {ad.status}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {ad.timestamp}
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => onEdit(ad)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
            >
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {ad.status !== 'closed' && (
              <TouchableOpacity
                onPress={() => onToggleStatus(ad)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Ionicons
                  name={ad.status === 'running' ? 'pause-outline' : 'play-outline'}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onDelete(ad)}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    aspectRatio: 1,
    width:'100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});