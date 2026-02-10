import { API_ENDPOINTS } from "../../apiConfig";

export const createBusiness = async ({
  token,
  data,
}: {
  token: string;
  data: FormData;
}) => {
  const url = API_ENDPOINTS.USER.BUSINESSES.Create;
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
      throw new Error(result.message || 'Failed to create business account');
    }
    return result;
  } catch (error: any) {
    console.error('❌ Fetch Error (createBusiness):', error);
    throw new Error(error.message || 'Network error occurred');
  }
};
