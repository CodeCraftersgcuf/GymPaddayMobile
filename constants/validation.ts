// utils/validation.ts
import * as Yup from "yup";

export const validationSignInSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});
export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
});
export const forgetValidation = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});
export const CodeValidation = Yup.object().shape({
  code: Yup.string().required("Code is required"),
});
