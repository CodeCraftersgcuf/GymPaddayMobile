import Toast from "react-native-toast-message";
import { ApiError } from "./customApiCall";
import { capitalize } from "./stringHelpers";

export const showApiErrorToast = (
  error: any,
  fallback = "Something went wrong"
) => {
  if (error instanceof ApiError && error.statusCode === 422) {
    const errors = error.data?.errors;

    if (Array.isArray(errors) && errors.length > 0) {
      const message = errors
        .map((err: any) => `${capitalize(err.field || "Field")}: ${err.reason}`)
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

  Toast.show({
    type: "error",
    text1: "Error",
    text2: error?.message || fallback,
  });
};
