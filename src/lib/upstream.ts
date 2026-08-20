export const UPSTREAM_TIMEOUT_MS = 60_000;

/** Prevent an unavailable provider from holding a dashboard request open. */
export function upstreamSignal(): AbortSignal {
  return AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
}
