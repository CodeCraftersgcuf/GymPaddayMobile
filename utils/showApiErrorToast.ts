import Toast from "react-native-toast-message";
import { ApiError } from "./customApiCall";
import { capitalize } from "./stringHelpers";

export const showApiErrorToast = (
  error: any,
  fallback = "Something went wrong"
) => {
  if (error instanceof ApiError && error.statusCode === 422) {
    const errors = error.data?.errors;

    // Handle Laravel validation errors format: { "field": ["message1", "message2"] }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const errorMessages: string[] = [];
      
      // Field name mapping for better readability
      const fieldNameMap: Record<string, string> = {
        'username': 'Username',
        'fullname': 'Full Name',
        'email': 'Email',
        'phone': 'Phone Number',
        'age': 'Age',
        'gender': 'Gender',
        'password': 'Password',
        'password_confirmation': 'Password Confirmation',
        'profile_picture': 'Profile Picture',
        'business_name': 'Business Name',
        'business_email': 'Business Email',
        'business_phone': 'Business Phone',
        'photo': 'Business Certificate / Document',
        'category': 'Category',
        'address': 'Address',
      };
      
      Object.keys(errors).forEach((field) => {
        const fieldErrors = errors[field];
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          // Use mapped name or format the field name nicely
          const fieldName = fieldNameMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          errorMessages.push(`${fieldName}: ${fieldErrors[0]}`);
        } else if (typeof fieldErrors === 'string') {
          const fieldName = fieldNameMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          errorMessages.push(`${fieldName}: ${fieldErrors}`);
        }
      });

      if (errorMessages.length > 0) {
        Toast.show({
          type: "error",
          text1: errorMessages.length === 1 ? "Validation Error" : "Validation Errors",
          text2: errorMessages.join("\n"),
          autoHide: false,
          visibilityTime: 6000,
        });
        return;
      }
    }

    // Handle array format: [{ field: "email", reason: "already taken" }]
    if (Array.isArray(errors) && errors.length > 0) {
      const message = errors
        .map((err: any) => {
          if (typeof err === 'string') return err;
          return `${capitalize(err.field || "Field")}: ${err.reason || err.message || err}`;
        })
        .join("\n");

      Toast.show({
        type: "error",
        text1: "Validation Errors",
        text2: message,
        autoHide: false,
        visibilityTime: 6000,
      });
      return;
    }
  }

  // Handle general error messages
  const errorMessage = error?.data?.message || error?.message || fallback;
  
  Toast.show({
    type: "error",
    text1: "Error",
    text2: errorMessage,
    visibilityTime: 4000,
  });
};

// Helper function to extract field-specific errors from Laravel validation response
export const extractFieldErrors = (error: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  if (error instanceof ApiError && error.statusCode === 422) {
    const errors = error.data?.errors;
    
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      Object.keys(errors).forEach((field) => {
        const fieldErrorMessages = errors[field];
        if (Array.isArray(fieldErrorMessages) && fieldErrorMessages.length > 0) {
          // Take the first error message for each field
          fieldErrors[field] = fieldErrorMessages[0];
        } else if (typeof fieldErrorMessages === 'string') {
          fieldErrors[field] = fieldErrorMessages;
        }
      });
    }
  }
  
  return fieldErrors;
};
