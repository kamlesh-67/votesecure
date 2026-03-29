import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { isDbConnectionError } from "./demo-data";
import type { VoterPayload, AdminPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "demo-secret-only-for-local-testing";
const VOTER_COOKIE = process.env.SESSION_COOKIE_NAME ?? "vs_session";
const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE_NAME ?? "vs_admin_session";

// ── Voter Session ────────────────────────────────────────────────────────────

/**
 * Creates a voter JWT and sets an HttpOnly cookie.
 * In normal mode: also stores token in DB for revocation support.
 * In demo mode (DB unreachable): skips DB write, JWT is the sole auth.
 */
export async function createVoterSession(
  voterId: string,
  mobile: string,
): Promise<void> {
  const payload: VoterPayload = { voterId, mobile, role: "voter" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30m" });

  // Attempt DB token store; skip gracefully in demo mode
  try {
    await prisma.voter.update({
      where: { id: voterId },
      data: { sessionToken: token },
    });
  } catch (e) {
    if (!isDbConnectionError(e)) throw e;
    console.warn("[session] Demo mode: skipping voter session token DB write.");
  }

  const cookieStore = await cookies();
  cookieStore.set(VOTER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });
}

/**
 * Validates the voter session cookie.
 * In normal mode: cross-checks token against DB.
 * In demo mode (DB unreachable): trusts the JWT signature alone.
 */
export async function requireVoterSession(): Promise<VoterPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VOTER_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  let payload: VoterPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as VoterPayload;
  } catch {
    throw new Error("UNAUTHORIZED");
  }

  // Cross-check token matches DB (revocation support) — skip in demo mode
  try {
    const voter = await prisma.voter.findUnique({
      where: { id: payload.voterId },
      select: { sessionToken: true, hasVoted: true, isActive: true },
    });

    if (!voter?.isActive) throw new Error("VOTER_DISABLED");
    if (voter.sessionToken !== token) throw new Error("SESSION_REVOKED");
    if (voter.hasVoted) throw new Error("ALREADY_VOTED");
  } catch (e) {
    // Re-throw business logic errors
    const msg = e instanceof Error ? e.message : "";
    if (msg === "VOTER_DISABLED" || msg === "SESSION_REVOKED" || msg === "ALREADY_VOTED") {
      throw e;
    }
    if (!isDbConnectionError(e)) throw e;
    // Demo mode: trust JWT alone
    console.warn("[session] Demo mode: skipping voter DB token cross-check.");
  }

  return payload;
}

/**
 * Revokes the voter session. Skips DB write in demo mode.
 */
export async function revokeVoterSession(voterId: string): Promise<void> {
  try {
    await prisma.voter.update({
      where: { id: voterId },
      data: { sessionToken: null },
    });
  } catch (e) {
    if (!isDbConnectionError(e)) throw e;
  }
  const cookieStore = await cookies();
  cookieStore.delete(VOTER_COOKIE);
}

// ── Admin Session ────────────────────────────────────────────────────────────

/**
 * Creates an admin JWT and sets an HttpOnly cookie.
 * Session expires in 4 hours. Scoped to /admin path.
 */
export async function createAdminSession(
  adminId: string,
  mobile: string,
  role: string,
): Promise<void> {
  const payload: AdminPayload = {
    adminId,
    mobile,
    role: role as AdminPayload["role"],
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 4 * 60 * 60, // 4 hours
    path: "/",  // Must be "/" so cookie is sent to /api/admin/* routes
  });
}

/**
 * Validates the admin session cookie. Throws if invalid.
 */
export async function requireAdminSession(): Promise<AdminPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

/**
 * Revokes the admin session on logout.
 */
export async function revokeAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Masks a mobile number — returns "XXXXXX" + last 4 digits.
 */
export function maskMobile(mobile: string): string {
  return "XXXXXX" + mobile.slice(-4);
}
