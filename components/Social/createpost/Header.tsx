import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons'
import { useTheme } from '@/contexts/themeContext';

interface HeaderProps {
  onSubmit: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export default function Header({ onSubmit, isLoading = false, isEditMode = false }: HeaderProps) {
  const router = useRouter();
  const { dark } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: dark ? '#1a1a1a' : '#fff' }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={isLoading}
      >
        <Ionicons name="chevron-left" size={24} color={dark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: dark ? '#fff' : '#000' }]}>
        {isEditMode ? 'Edit Post' : 'New Post'}
      </Text>

      <TouchableOpacity
        style={[
          styles.shareButton,
          {
            backgroundColor: isLoading ? '#ccc' : '#007AFF',
            opacity: isLoading ? 0.6 : 1
          }
        ]}
        onPress={onSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.shareButtonText}>
            {isEditMode ? 'Update' : 'Share'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});