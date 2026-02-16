import { API_ENDPOINTS } from "../../apiConfig";
import { ApiError } from "../customApiCall";

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
      // Preserve full API response (message + validation errors) so UI can show them
      throw new ApiError(
        result,
        response.statusText,
        result?.message || 'Failed to create business account',
        response.status
      );
    }
    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error('❌ Fetch Error (createBusiness):', error);
    throw new ApiError(
      { message: error?.message || 'Network error occurred' },
      'Network Error',
      error?.message || 'Network error occurred',
      500
    );
  }
};
