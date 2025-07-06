import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { toggleCampaignStatus } from '@/utils/mutations/toggle';
import { deleteAdCompaign } from '@/utils/mutations/boost';
import { Alert } from 'react-native';

// --- This type matches your mapped Ad type
export interface Ad {
  id: string;
  status: string;
  type: 'marketplace' | 'social';
  [key: string]: any; // allow extra fields
}

// This is your hook
export function useAdCampaignActions(adsApiData?: any[]) {
  const route = useRouter();
  const queryClient = useQueryClient();

  // --- 1. Toggle Status (play/pause)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      token
    }: {
      id: number;
      action: 'pause' | 'resume';
      token: string;
    }) => {
      return await toggleCampaignStatus({ id, action, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ad-campaigns']);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to toggle status');
    }
  });

  async function handleToggleStatus(ad: Ad) {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      let action: 'pause' | 'resume' = 'pause';
      if (ad.status === 'pending' || ad.status === 'running' || ad.status === 'active') {
        action = 'pause';
      } else if (ad.status === 'paused' || ad.status === 'closed') {
        action = 'resume';
      }
      toggleStatusMutation.mutate({ id: Number(ad.id), action, token });
    } catch (e) {
      Alert.alert('Error', e?.toString() ?? 'Unexpected error');
    }
  }

  // --- 2. Delete
 const { mutate: deleteAd, isLoading: isDeleting } = useMutation({
  mutationFn: async (id: number) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('No auth token');
    return await deleteAdCompaign({ id, token });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['ad-campaigns']);
    route.back(); // 👈 THIS will take you back
  },
  onError: (error) => {
    Alert.alert('Error', 'Failed to delete ad campaign.');
    console.error('Delete ad campaign error:', error);
  }
});


  function handleDelete(ad: Ad) {
    Alert.alert(
      'Delete Ad Campaign',
      'Are you sure you want to delete this ad campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAd(Number(ad.id))
        }
      ]
    );
  }

  // --- 3. Edit (navigate to audience editor)
  function handleEdit(ad: Ad) {
    const isEditable = true;
    const boostType = ad.type === "marketplace" ? "listing" : "post";
    // Find original API object for full data (not mapped Ad)
    const originalItem =
      Array.isArray(adsApiData) &&
      adsApiData.find((item) => String(item.id) === ad.id);

    if (!originalItem) {
      Alert.alert("Ad not found in the source data.");
      return;
    }

    route.push({
      pathname: "/BoostPostScreen_audience",
      params: {
        isEditable,
        boostType,
        campaignId: ad.id,
        campaign: JSON.stringify(originalItem),
        listing: originalItem.listing ? JSON.stringify(originalItem.listing) : null,
        post: originalItem.post ? JSON.stringify(originalItem.post) : null,
      },
    });
  }

  return {
    handleEdit,
    handleToggleStatus,
    handleDelete,
    isDeleting,
    toggleStatusMutation,
  };
}
