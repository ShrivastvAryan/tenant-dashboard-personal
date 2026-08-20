/**
 * In-memory sliding-window rate limiter for brute-force protection.
 *
 * Each bucket is keyed by a caller-chosen string (typically IP or IP+route).
 * Stale entries are lazily evicted so memory stays bounded.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window. */
  maxAttempts: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

/**
 * Creates a named rate limiter that persists across invocations (module-level
 * singleton per `name`). Safe for serverless cold-starts: each new instance
 * starts empty and fills up organically.
 */
export function createRateLimiter(name: string, options: RateLimiterOptions) {
  const { maxAttempts, windowMs } = options;
  const store = getStore(name);

  return {
    /**
     * Record a hit and check whether the caller has exceeded the limit.
     *
     * @returns `{ limited: false }` when the request is allowed, or
     *          `{ limited: true, retryAfterMs }` when it should be blocked.
     */
    check(key: string): { limited: boolean; retryAfterMs: number; remaining: number } {
      const now = Date.now();
      let entry = store.get(key);

      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      // Evict timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

      if (entry.timestamps.length >= maxAttempts) {
        const oldest = entry.timestamps[0];
        const retryAfterMs = windowMs - (now - oldest);
        return { limited: true, retryAfterMs, remaining: 0 };
      }

      entry.timestamps.push(now);
      return { limited: false, retryAfterMs: 0, remaining: maxAttempts - entry.timestamps.length };
    },
  };
}

// ── Pre-configured limiters ──────────────────────────────────────────────

/** Secondary per-instance guard; the backend applies the authoritative limit. */
export const loginLimiter = createRateLimiter("login", {
  maxAttempts: 15,
  windowMs: 60 * 1000,
});

/** Allow shared-NAT users while the backend enforces five tries per challenge. */
export const otpLimiter = createRateLimiter("otp-verify", {
  maxAttempts: 20,
  windowMs: 60 * 1000,
});

/** 3 password-reset requests per IP in a 15-minute window */
export const resetPasswordLimiter = createRateLimiter("reset-password", {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
});

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Best-effort client IP extracted from standard proxy headers.
 * Falls back to "unknown" so the limiter still works (just with a shared
 * bucket — better than no protection).
 */
export async function getClientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}
