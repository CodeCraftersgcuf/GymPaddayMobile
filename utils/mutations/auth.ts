import { apiCall, ApiError } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const loginUser = async ({
  data,
}: {
  data: {
    email: string;
    password: string;
  };
}) => {
  console.log("Login data:", data);
  return await apiCall(API_ENDPOINTS.AUTH.Login, "POST", data);
};

export const registerUser = async ({
  data,
}: {
  data: FormData;
}) => {
  try {
    console.log("Register data:", data);
    
    const response = await fetch(API_ENDPOINTS.AUTH.Register, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        // Don't set Content-Type for FormData - let React Native set it automatically with boundary
      },
      body: data,
    });

    const result = await response.json();

    if (!response.ok) {
      // Log the full error response for debugging
      console.error('❌ Register Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: result,
      });
      
      // Throw ApiError to preserve validation errors structure
      throw new ApiError(
        result,
        response.statusText,
        result?.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return result;
  } catch (error: any) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // For other errors, log and wrap in ApiError
    console.error('❌ Register Error:', error);
    throw new ApiError(
      { message: error?.message || 'Registration failed' },
      'Network Error',
      error?.message || 'Registration failed. Please try again.',
      500
    );
  }
};

export const forgotPassword = async ({
  data,
}: {
  data: {
    email: string;
  };
}) => {
  // Sends a 4/6-digit OTP to the user's email
  console.log("Forgot password data:", data);
  return await apiCall(API_ENDPOINTS.AUTH.ForgotPassword, "POST", data);
};

export const verifyOtp = async ({
  data,
}: {
  data: {
    email: string;
    otp: string; // changed from 'token' to 'otp'
  };
}) => {
  // Verifies the OTP (no password yet)
  return await apiCall(API_ENDPOINTS.AUTH.VerifyOtp, "POST", data);
};

export const resetPassword = async ({
  data,
}: {
  data: {
    email: string;
    otp: string; // renamed from token
    password: string;
    password_confirmation: string;
  };
}) => {
  // Resets the password using OTP
  return await apiCall(API_ENDPOINTS.AUTH.ResetPassword, "POST", data);
};
