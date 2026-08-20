"use server";

import { axiosInstance } from "@/lib/api";
import axios from "axios";
import { cookies, headers } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  SESSION_COOKIE_OPTIONS,
  TEMP_SESSION_COOKIE_OPTIONS,
} from "@/constants/auth";
import {
  loginLimiter,
  otpLimiter,
  resetPasswordLimiter,
  getClientIp,
} from "@/lib/rate-limit";

export interface LoginResult {
  success: boolean;
  message: string;
  showOTP?: boolean;
  auth_type?: string;
  error?: any;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

function getPasswordResetHost(requestHeaders: Awaited<ReturnType<typeof headers>>): string | undefined {
  const sourceUrls = [requestHeaders.get("origin"), requestHeaders.get("referer")];

  for (const sourceUrl of sourceUrls) {
    if (!sourceUrl) continue;
    try {
      return new URL(sourceUrl).host;
    } catch {
      // Fall through to proxy/host headers when a proxy sends a malformed URL.
    }
  }

  return requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim()
    || requestHeaders.get("host")?.trim();
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return fallback;
  }
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

export async function requestResetPassword(email: string): Promise<PasswordResetResult> {
  try {
    const ip = await getClientIp();
    const { limited, retryAfterMs } = resetPasswordLimiter.check(ip);

    if (limited) {
      const retryMinutes = Math.ceil(retryAfterMs / 60_000);
      return {
        success: false,
        message: `Too many requests. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      };
    }

    const requestHeaders = await headers();
    const resetHost = getPasswordResetHost(requestHeaders);
    const response = await axiosInstance.post("/auth/request-reset-pass/", {
      email: email.trim().toLowerCase(),
      reset_host: resetHost,
    });

    return {
      success: true,
      message: response.data?.message || "Password reset link sent",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to request password reset"),
    };
  }
}

export async function verifyPasswordResetToken(token: string): Promise<PasswordResetResult> {
  try {
    const response = await axiosInstance.post("/auth/verify-token/", { token });
    return {
      success: response.data?.message === "Token is valid",
      message: response.data?.message || "Unable to verify reset link",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, "This password reset link is invalid or expired"),
    };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    const response = await axiosInstance.post("/auth/reset-pass/", {
      token,
      newPass: newPassword,
    });
    const success = response.data?.message?.toLowerCase().includes("success") === true;
    if (success) {
      const cookieStore = await cookies();
      cookieStore.delete("access-token");
      cookieStore.delete("refresh-token");
      cookieStore.delete("wallet-id");
      cookieStore.delete("user-email");
      cookieStore.delete("username");
      cookieStore.delete("user-cred");
      cookieStore.delete("login-challenge");
    }
    return {
      success,
      message: response.data?.message || "Password reset completed",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, "Failed to reset password"),
    };
  }
}

export async function initiateLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const ip = await getClientIp();
    const { limited, retryAfterMs } = loginLimiter.check(ip);

    if (limited) {
      const retryMinutes = Math.ceil(retryAfterMs / 60_000);
      return {
        success: false,
        showOTP: false,
        message: `Too many login attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      };
    }

    const cookieStore = await cookies();

    // Clear any existing auth cookies to prevent session confusion
    cookieStore.delete("user-cred");
    cookieStore.delete("login-challenge");
    cookieStore.delete("access-token");
    cookieStore.delete("refresh-token");

    // Send login request to backend - this checks credentials and auth type
    const res = await axiosInstance.post("/login/", {
      email,
      password,
      type: "MERCHANT",
    });

    const authType = res.data?.auth_type;

    if (authType === "oauth") {
      return {
        success: false,
        showOTP: false,
        auth_type: "oauth",
        message: "This account uses Google login. Please continue with Google.",
      };
    }

    const challenge = res.data?.challenge;
    if (typeof challenge !== "string" || !challenge) {
      throw new Error("The login service returned an invalid challenge.");
    }

    // Store only the opaque, short-lived challenge. Never persist the password.
    cookieStore.set(
      "login-challenge",
      challenge,
      TEMP_SESSION_COOKIE_OPTIONS
    );

    return {
      success: true,
      showOTP: true,
      message: "OTP sent to your email. Please verify to complete login.",
    };
  } catch (err: any) {
    const cookieStore = await cookies();
    // Clear any cookies on login failure
    cookieStore.delete("user-cred");
    cookieStore.delete("login-challenge");

    // Extract error message from various possible formats
    let errorMessage = "Login failed. Please try again.";
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (Array.isArray(err.response?.data)) {
      errorMessage = err.response.data[0] || errorMessage;
    }

    return {
      success: false,
      showOTP: false,
      message: errorMessage,
      error: err.response?.data || err.message,
    };
  }
}

export async function verifyOTP(
  otp: string
): Promise<LoginResult & { userData?: any }> {
  try {
    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        showOTP: true,
        message: "Enter a valid 6-digit code.",
      };
    }

    const ip = await getClientIp();
    const { limited, retryAfterMs } = otpLimiter.check(ip);

    if (limited) {
      const retryMinutes = Math.ceil(retryAfterMs / 60_000);
      return {
        success: false,
        showOTP: false,
        message: `Too many verification attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
      };
    }

    const cookieStore = await cookies();
    const challenge = cookieStore.get("login-challenge")?.value;
    if (!challenge) {
      return {
        success: false,
        showOTP: false,
        message: "Login session expired. Please start again.",
      };
    }

    const verifyRes = await axiosInstance.post("/verify/", {
      otp: Number(otp),
      action: "login",
      challenge,
    });

    const data = verifyRes.data;
    const isVerified =
      typeof data.message === "string" && data.message.toLowerCase().includes("otp verified");

    if (!isVerified) {
      return {
        success: false,
        showOTP: true,
        message: data?.message || "Verification failed",
      };
    }

    // Successful challenge verification returns tokens directly.
    const userData = data;
    if (!userData.access_token) {
      return { success: false, showOTP: false, message: "Login verification failed" };
    }

    // Clear temporary session cookies
    cookieStore.delete("user-cred");
    cookieStore.delete("login-challenge");

    // Set authentication cookies with gateway-matched lifespans
    cookieStore.set("access-token", userData.access_token, ACCESS_TOKEN_COOKIE_OPTIONS);
    cookieStore.set("refresh-token", userData.refresh_token, SESSION_COOKIE_OPTIONS);
    cookieStore.set("wallet-id", userData.uniqueId, SESSION_COOKIE_OPTIONS);
    cookieStore.set("user-email", userData.email || "", SESSION_COOKIE_OPTIONS);
    cookieStore.set(
      "username",
      userData.username || userData.email?.split("@")[0] || "User",
      SESSION_COOKIE_OPTIONS
    );

    return {
      success: true,
      showOTP: false,
      message: "Login successful",
      userData,
    };
  } catch (err: any) {
    const status = err?.response?.status;
    const payload = err?.response?.data;
    const message =
      payload?.message || payload?.error || err?.message || "Failed to verify OTP";

    if (status === 401) {
      const cookieStore = await cookies();
      cookieStore.delete("login-challenge");
    }

    return {
      success: false,
      showOTP: Boolean(payload?.showOTP),
      message,
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("access-token");
  cookieStore.delete("refresh-token");
  cookieStore.delete("wallet-id");
  cookieStore.delete("user-email");
  cookieStore.delete("username");
  cookieStore.delete("user-cred");
  cookieStore.delete("login-challenge");
}
