import { Image, StyleSheet, Text, View, Modal, ToastAndroid, Platform, Alert } from 'react-native'
import React, { useState } from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'
import { TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store';
import { followUnfollowUser } from '@/utils/queries/socialMedia'

interface ViewpostDetailProps {
    onHide?: () => void;
    onReport?: () => void;
    onClose?: () => void;
    userId?: string | number; // Optional userId prop for future use
}

const ViewpostDetail: React.FC<ViewpostDetailProps> = ({ onHide, onReport, onClose,userId }) => {
    const { dark } = useTheme();
    const [reportModalVisible, setReportModalVisible] = useState(false);
const queryClient = useQueryClient();

const followMutation = useMutation({
  mutationFn: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('No auth token');
    return await followUnfollowUser(Number(userId), token);
  },
  onSuccess: () => {
    showToast('Action Performed Successfully');
    // queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    // queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    if (onClose) onClose();
  },
  onError: (error) => {
    console.error('Error following/unfollowing user:', error);
    showToast('Failed to follow/unfollow user');
  },
});
    const showToast = (msg: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
            Alert.alert('', msg);
        }
    };
const handleFollow = () => {
  if (!userId) {
    showToast('Invalid user ID');
    return;
  }
  followMutation.mutate(); // triggers the mutation
};

    const handleHide = () => {
        if (onHide) onHide();
        if (onClose) onClose();
    };

    const handleReport = () => {
        setReportModalVisible(true);
    };

    const confirmReport = (reason: string) => {
        console.log("Reported for:", reason);
        if (onReport) onReport();
        showToast("Your report has been noted.");
        if (onHide) onHide(); // reuse hide logic
        if (onClose) onClose();
        setReportModalVisible(false);
    };

    const Options = [
        {
            icon: images.followIcon,
            title: 'Follow User',
            handleFunction: handleFollow,
        },
        {
            icon: images.eysIcon,
            title: 'Hide Post',
            handleFunction: handleHide,
        },
        {
            icon: images.reportIcons,
            title: 'Report post',
            handleFunction: handleReport,
        },
    ];

    const reportReasons = ['Violence', 'Harassment', 'Nudity', 'Spam'];

    return (
        <View style={{ gap: 0 }}>
            {Options.map((item, index) => (
                <TouchableOpacity key={index} onPress={item.handleFunction}>
                    <ThemedView darkColor='#252525' style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15 }}>
                        <Image source={item.icon} style={{ width: 25, height: 25 }} tintColor={item.title === 'Report post' ? 'red' : dark ? 'white' : 'black'} />
                        <ThemeText
                            lightColor={item.title === 'Report post' ? 'red' : 'black'}
                            darkColor={item.title === 'Report post' ? 'red' : 'white'}
                        >
                            {item.title}
                        </ThemeText>
                    </ThemedView>
                </TouchableOpacity>
            ))}

            {/* Report Reason Modal */}
            <Modal visible={reportModalVisible} transparent animationType='fade'>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: dark ? '#252525' : '#fff' }]}>
                        <ThemeText style={styles.modalTitle}>Report Post</ThemeText>
                        {reportReasons.map((reason, idx) => (
                            <TouchableOpacity key={idx} onPress={() => confirmReport(reason)} style={styles.reportOption}>
                                <Text style={{ color: dark ? '#fff' : '#000' }}>{reason}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.cancelButton}>
                            <Text style={{ color: 'red' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ViewpostDetail;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    reportOption: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    cancelButton: {
        marginTop: 15,
        alignItems: 'center',
    },
});
