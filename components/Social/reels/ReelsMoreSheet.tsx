import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FeedPostVideo } from '@/contexts/FeedVideoPoolContext';

type ReelsMoreSheetProps = {
  visible: boolean;
  post: FeedPostVideo | null;
  onClose: () => void;
  onDownload: (post: FeedPostVideo) => void;
  onHide: (postId: number) => void;
  onNotInterested: (postId: number) => void;
};

type Row = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

export default function ReelsMoreSheet({
  visible,
  post,
  onClose,
  onDownload,
  onHide,
  onNotInterested,
}: ReelsMoreSheetProps) {
  if (!post) return null;

  const rows: Row[] = [
    {
      key: 'download',
      label: 'Download',
      icon: 'download-outline',
      onPress: () => {
        onClose();
        onDownload(post);
      },
    },
    {
      key: 'not-interested',
      label: 'Not interested',
      icon: 'eye-off-outline',
      onPress: () => {
        onClose();
        onNotInterested(post.id);
      },
    },
    {
      key: 'hide',
      label: 'Hide this post',
      icon: 'close-circle-outline',
      onPress: () => {
        onClose();
        onHide(post.id);
      },
    },
    {
      key: 'report',
      label: 'Report',
      icon: 'flag-outline',
      destructive: true,
      onPress: () => {
        onClose();
        Alert.alert('Reported', 'Thanks for letting us know. We will review this post.');
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {rows.map((row) => (
          <TouchableOpacity key={row.key} style={styles.row} onPress={row.onPress} activeOpacity={0.7}>
            <Ionicons
              name={row.icon}
              size={24}
              color={row.destructive ? '#ff3b30' : '#fff'}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowLabel, row.destructive && styles.destructive]}>{row.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingBottom: 34,
    paddingHorizontal: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowIcon: {
    marginRight: 16,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  destructive: {
    color: '#ff3b30',
  },
  cancel: {
    marginTop: 8,
    marginHorizontal: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#2c2c2e',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
