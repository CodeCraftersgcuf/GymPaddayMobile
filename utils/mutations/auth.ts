import { apiCall } from "../customApiCall";
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
      throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Register Error:', error);
    throw error;
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
