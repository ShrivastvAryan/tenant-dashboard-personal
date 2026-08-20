export const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8989";

export const backendBase = BACKEND_URL;

export function backendHeaders(headers: Record<string, string> = {}) {
  let isDashxBackend = false;
  try {
    isDashxBackend = new URL(BACKEND_URL).hostname === "be.dashx.xyz";
  } catch {
    // Invalid backend URLs are handled by the request itself.
  }

  const devKey = process.env.DEV_STATIC_KEY;
  let isLocalBackend = false;
  try {
    const port = new URL(BACKEND_URL).port;
    isLocalBackend = port === "8989" || port === "8000";
  } catch {
    // Invalid backend URLs are handled by the request itself.
  }

  if ((!isDashxBackend && !isLocalBackend) || !devKey) {
    return headers;
  }

  return {
    ...headers,
    "X-Dev-Key": devKey,
  };
}
