import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE_NAMES = [
  "access-token",
  "refresh-token",
  "wallet-id",
  "user-email",
  "username",
  "user-cred",
  "login-challenge",
];

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  for (const name of AUTH_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}

export function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function isAuthSessionError(error: any) {
  const status = error?.response?.status;
  const payload = error?.response?.data || {};
  const code = String(payload?.code || "").toUpperCase();
  const message = String(payload?.error || payload?.message || payload?.detail || error?.message || "").toLowerCase();

  if (code === "SESSION_INVALIDATED") return true;
  if (message.includes("session invalidated")) return true;
  if (message.includes("session expired")) return true;

  return (
    status === 401 &&
    (message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("invalid token") ||
      message.includes("token expired"))
  );
}

export async function redirectToLoginIfAuthError(error: unknown) {
  if (isNextRedirectError(error)) {
    throw error;
  }

  if (isAuthSessionError(error)) {
    await clearAuthCookies();
    redirect("/login");
  }
}
