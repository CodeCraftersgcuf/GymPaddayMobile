import { API_ENDPOINTS } from "../../apiConfig";

export const editUserProfile = async ({
  token,
  data,
}: {
  token: string;
  data: FormData;
}) => {
  const url = API_ENDPOINTS.USER.PROFILE.EditProfile;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let React Native set it automatically with boundary
      },
      body: data, // FormData is passed directly
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update profile');
    }
    return result;
  } catch (error: any) {
    console.error('❌ Fetch Error (editUserProfile):', error);
    throw new Error(error.message || 'Network error occurred');
  }
};