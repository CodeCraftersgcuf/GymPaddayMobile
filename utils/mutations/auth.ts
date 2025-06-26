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
  data: {
    username: string;
    fullname: string;
    email: string;
    phone: string;
    age: number;
    gender: string;
    password: string;
    password_confirmation: string;
  };
}) => {
  console.log("Register data:", data);
  return await apiCall(API_ENDPOINTS.AUTH.Register, "POST", data);
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
