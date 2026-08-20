"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";
import { cookies } from "next/headers";

export interface CurrentUser {
  username: string;
  email: string;
  createdAt?: string;
  is_lowpower_user?: boolean;
  type?: string;
  rewardMultiplier?: number;
  swapPoints?: number;
  transactionPoints?: number;
  referralPoints?: number;
  referralCode?: string;
  isEmployee?: boolean;
}

export async function GetCurrentUser(): Promise<{
  success: boolean;
  data?: CurrentUser;
  error?: string;
}> {
  try {
    const res = await axiosInstance.get("/getUserInfo/from-email/");
    const data = res.data || {};
    const email = String(data.email || "").trim();
    const username =
      String(data.username || "").trim() || email.split("@")[0] || "User";

    return {
      success: true,
      data: {
        ...data,
        email,
        username,
      },
    };
  } catch (err: any) {
    const cookieStore = await cookies();
    const email = cookieStore.get("user-email")?.value || "a.sguy29@gmail.com";
    const username =
      cookieStore.get("username")?.value || email.split("@")[0] || "User";

    return {
      success: true,
      data: {
        email,
        username,
      },
    };

    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch current user",
    };
  }
}
