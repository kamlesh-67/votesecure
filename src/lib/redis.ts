import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * ── RESILIENT REDIS CLIENT ──────────────────────────────────────────────────
 * Lazy-initializes the Redis client only if credentials are present.
 * Prevents build-time crashes and cluttering logs in Vercel with no Redis.
 */
let redisClient: Redis | null = null;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

/** 
 * Returns a rate limiter instance OR a mock with .limit() that always passes.
 * Ensures the app remains functional in "Demo Mode" without Upstash.
 */
function createResilientLimiter(prefix: string, tokens: number, window: string) {
  const redis = getRedis();

  if (!redis) {
    return {
      limit: async () => ({ success: true, remaining: tokens, limit: tokens, reset: 0 }),
    };
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window as any),
    prefix: `rl:${prefix}`,
  });
}

// ── Rate Limiters (Lazy Cache) ──────────────────────────────────────────────

let _otpSendLimiter: any = null;
export function getOtpSendLimiter() {
  if (!_otpSendLimiter) _otpSendLimiter = createResilientLimiter("otp_send", 3, "10 m");
  return _otpSendLimiter;
}

let _otpVerifyLimiter: any = null;
export function getOtpVerifyLimiter() {
  if (!_otpVerifyLimiter) _otpVerifyLimiter = createResilientLimiter("otp_verify", 5, "15 m");
  return _otpVerifyLimiter;
}

let _globalLimiter: any = null;
export function getGlobalLimiter() {
  if (!_globalLimiter) _globalLimiter = createResilientLimiter("global", 100, "1 m");
  return _globalLimiter;
}
