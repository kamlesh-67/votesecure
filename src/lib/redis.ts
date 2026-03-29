import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ── Redis client ────────────────────────────────────────────────────────────
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Rate Limiters ───────────────────────────────────────────────────────────

/** 3 OTP sends per mobile per 10 minutes */
export const otpSendLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "rl:otp_send",
});

/** 5 OTP verification attempts per mobile per 15 minutes */
export const otpVerifyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:otp_verify",
});

/** 100 requests per minute per IP — applied globally */
export const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:global",
});
