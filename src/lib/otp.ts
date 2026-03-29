import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for true randomness — NOT Math.random().
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hashes an OTP using bcrypt (cost factor 10).
 * The plain OTP must be discarded immediately after calling this.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verifies a plain OTP against its stored bcrypt hash.
 */
export async function verifyOtp(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Returns a Date 5 minutes from now — OTP expiry timestamp.
 */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}
