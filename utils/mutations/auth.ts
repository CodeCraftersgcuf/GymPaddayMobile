import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const loginUser = async ({
  data
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
  data
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
  return await apiCall(API_ENDPOINTS.AUTH.Register, "POST", data);
};

export const forgotPassword = async ({
  data
}: {
  data: {
    email: string;
  };
}) => {
  return await apiCall(API_ENDPOINTS.AUTH.ForgotPassword, "POST", data);
};

export const verifyOtp = async ({
  data
}: {
  data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  };
}) => {
  return await apiCall(API_ENDPOINTS.AUTH.VerifyOtp, "POST", data);
};
