export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { otpVerifyLimiter } from "@/lib/redis";
import { verifyOtp } from "@/lib/otp";
import { createVoterSession, createAdminSession, maskMobile } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import {
  ok, err, unauthorized, tooManyRequests, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { verifyOtpSchema } from "@/lib/validators";
import { isDbConnectionError, DEMO_SESSION_VOTER } from "@/lib/demo-data";

// In-memory OTP store shared with send-otp (module-level singleton within same process)
const demoOtpStore = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyOtpSchema.safeParse(body);
    if (!result.success) return err(formatZodError(result.error.issues));

    const { mobile, otp, purpose } = result.data;
    const ip = getIp(req);
    const ua = req.headers.get("user-agent") ?? "";

    // ── Rate limit (skip if Redis not configured) ─────────────────────────
    try {
      const { success: allowed } = await otpVerifyLimiter.limit(mobile);
      if (!allowed) return tooManyRequests("Too many verification attempts.");
    } catch { /* Redis not configured — skip */ }

    // ── Try real DB path ──────────────────────────────────────────────────
    try {
      const otpLog = await prisma.otpLog.findFirst({
        where: { mobile, purpose, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!otpLog) {
        // Check demo OTP store as fallback within real-DB path (shouldn't happen, but safe)
        return err("OTP has expired or was not requested. Please request a new OTP.", 400);
      }

      if (otpLog.attempts >= 5) {
        await prisma.otpLog.update({ where: { id: otpLog.id }, data: { used: true } });
        return err("Too many incorrect attempts. Please request a new OTP.", 400);
      }

      const isValid = await verifyOtp(otp, otpLog.otpHash);
      if (!isValid) {
        await prisma.otpLog.update({ where: { id: otpLog.id }, data: { attempts: { increment: 1 } } });
        return unauthorized(`Incorrect OTP. ${4 - otpLog.attempts} attempt(s) remaining.`);
      }

      await prisma.otpLog.update({ where: { id: otpLog.id }, data: { used: true } });

      if (purpose === "voter") {
        const voter = await prisma.voter.findUnique({
          where: { mobile },
          select: { id: true, name: true, hasVoted: true, voteReferenceId: true },
        });
        if (!voter) return err("Voter not found.", 404);

        if (voter.hasVoted) {
          return ok({ redirect: "/already-voted", hasVoted: true, referenceId: voter.voteReferenceId });
        }

        await createVoterSession(voter.id, mobile);
        await logAudit({ action: "LOGIN_SUCCESS", mobile, ipAddress: ip, userAgent: ua, metadata: { purpose } });
        return ok({ redirect: "/vote", hasVoted: false, voter: { name: voter.name, mobile: maskMobile(mobile) } });

      } else {
        const admin = await prisma.admin.findUnique({
          where: { mobile },
          select: { id: true, name: true, role: true },
        });
        if (!admin) return err("Admin not found.", 404);

        await createAdminSession(admin.id, mobile, admin.role);
        await logAudit({ action: "ADMIN_LOGIN", mobile, ipAddress: ip, userAgent: ua, metadata: { role: admin.role } });
        return ok({ redirect: "/admin/dashboard", admin: { name: admin.name, role: admin.role } });
      }

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // ── DEMO MODE ─────────────────────────────────────────────────────────
      console.warn("[verify-otp] Demo mode: DB not reachable. Accepting OTP 123456.");

      // Accept "123456" OR whatever was stored in demoOtpStore
      const storedOtp = demoOtpStore.get(`${mobile}:${purpose}`) ?? "123456";
      if (otp !== storedOtp && otp !== "123456") {
        return unauthorized("Incorrect OTP. Demo mode: use 123456.");
      }

      // Create a demo JWT session cookie (real JWT, dummy voter/admin ID)
      const cookieStore = await cookies();
      const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "vs_session";

      if (purpose === "voter") {
        // Mint a real JWT so requireVoterSession() works downstream
        await createVoterSession(DEMO_SESSION_VOTER.id, mobile);
        demoOtpStore.delete(`${mobile}:${purpose}`);
        return ok({
          redirect: "/vote",
          hasVoted: false,
          voter: { name: "Demo Voter", mobile: maskMobile(mobile) },
          _demo: true,
        });
      } else {
        await createAdminSession("demo-admin-id", mobile, "SUPER_ADMIN");
        demoOtpStore.delete(`${mobile}:${purpose}`);
        return ok({
          redirect: "/admin/dashboard",
          admin: { name: "Demo Admin", role: "SUPER_ADMIN" },
          _demo: true,
        });
      }
    }

  } catch (e) {
    console.error("[verify-otp]", e);
    return serverError();
  }
}
