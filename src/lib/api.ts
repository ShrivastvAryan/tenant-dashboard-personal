"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { clearAuthCookies, isAuthSessionError } from "@/lib/auth-session";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
});

const PUBLIC_PATHS = [
  "/login/",
  "/refreshtoken/",
  "/sendOTP/",
  "/signup/",
  "/verify/",
  "/auth/request-reset-pass/",
  "/auth/verify-token/",
  "/auth/reset-pass/",
];

axiosInstance.interceptors.request.use(
  async (request: any) => {
    if (DEBUG) {
      console.log("[DJANGO] " + request.method.toUpperCase() + " " + request.url);
    }
    // Never log request bodies here. Authentication and webhook payloads can
    // contain passwords, OTPs, tokens, API keys, and signing secrets.
    request.headers ??= {};
    Object.assign(request.headers, backendHeaders());

    if (!request.headers["X-API-KEY"] && !request.headers["x-api-key"]) {
      request.headers["X-API-KEY"] = "efgh1234";
    }

    if (PUBLIC_PATHS.includes(request.url)) return request;

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access-token")?.value;

    if (accessToken) {
      request.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return request;
  },
  (error: any) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isAuthSessionError(error)) {
      await clearAuthCookies();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
