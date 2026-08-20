/**
 * Authentication token and session duration constants
 * These values MUST match the backend JWT token configuration
 *
 * Backend JWT Configuration (dashx-backend/middlewares/JWT.py):
 * - access_expiration = datetime.utcnow() + timedelta(days=3)
 * - refresh_expiration = datetime.utcnow() + timedelta(days=7)
 *
 * Note: Backend has TODO to revert access token to 30 minutes for security
 */

// Decide if cookies should be marked Secure
const IS_SECURE_COOKIE =
  process.env.NODE_ENV === "production" ||
  String(process.env.NEXT_PUBLIC_SECURE_COOKIES).toLowerCase() === "true";

// Token lifespans (in seconds) - MUST match backend JWT configuration
export const ACCESS_TOKEN_LIFESPAN = 3 * 24 * 60 * 60; // 3 days (matches backend)
export const REFRESH_TOKEN_LIFESPAN = 7 * 24 * 60 * 60; // 7 days (matches backend)

// Session information should persist as long as refresh token is valid
export const SESSION_INFO_LIFESPAN = REFRESH_TOKEN_LIFESPAN; // 7 days

// Cookie configuration objects for consistent application
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  maxAge: ACCESS_TOKEN_LIFESPAN,
  secure: IS_SECURE_COOKIE,
  sameSite: "lax" as const, // Changed from strict to lax for iOS Safari compatibility
  httpOnly: true,
  path: "/",
};

export const SESSION_COOKIE_OPTIONS = {
  maxAge: SESSION_INFO_LIFESPAN,
  secure: IS_SECURE_COOKIE,
  sameSite: "lax" as const, // Changed from strict to lax for iOS Safari compatibility
  httpOnly: true,
  path: "/",
};

// Temporary session cookies for opaque authentication challenges.
export const TEMP_SESSION_LIFESPAN = 5 * 60; // 5 minutes

export const TEMP_SESSION_COOKIE_OPTIONS = {
  maxAge: TEMP_SESSION_LIFESPAN,
  secure: IS_SECURE_COOKIE,
  sameSite: "lax" as const, // Less strict for cross-page navigation in production
  httpOnly: true,
  path: "/",
};

// Client-readable cookie options for UI preferences (not sensitive data)
// Used for flags that determine UI behavior like is_lowpower_user
export const CLIENT_READABLE_COOKIE_OPTIONS = {
  maxAge: SESSION_INFO_LIFESPAN,
  secure: IS_SECURE_COOKIE,
  sameSite: "lax" as const, // Changed from strict to lax for iOS Safari compatibility
  httpOnly: false, // Client can read these
  path: "/",
};
