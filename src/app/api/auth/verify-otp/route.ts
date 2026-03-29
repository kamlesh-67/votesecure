export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOtpVerifyLimiter } from "@/lib/redis";
import { verifyOtp } from "@/lib/otp";
import { createVoterSession, createAdminSession, maskMobile } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import {
  ok, err, unauthorized, tooManyRequests, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { verifyOtpSchema } from "@/lib/validators";
import { isDbConnectionError, DEMO_SESSION_VOTER, demoOtpStore } from "@/lib/demo-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyOtpSchema.safeParse(body);
    if (!result.success) return err(formatZodError(result.error.issues));

    const { mobile, otp, purpose } = result.data;
    const ip = getIp(req);
    const ua = req.headers.get("user-agent") ?? "";

    // ── Resilient Rate limit (auto-passes if Redis not configured) ────────
    const limiter = getOtpVerifyLimiter();
    const { success: allowed } = await limiter.limit(mobile);
    if (!allowed) return tooManyRequests("Too many verification attempts.");

    // ── Try real DB path ──────────────────────────────────────────────────
    try {
      const otpLog = await prisma.otpLog.findFirst({
        where: { mobile, purpose, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!otpLog) {
        // Double-check if the OTP is in the demo store even in the "real path"
        // for seamless transitions if the DB went down after sending but before verifying.
        if (demoOtpStore.has(`${mobile}:${purpose}`)) {
            throw new Error("P1001: Demo mode recovery triggered.");
        }
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
      console.warn("[verify-otp] Demo mode fallback triggered. (DB unreachable)");

      // Accept whatever was stored in the centralized demoOtpStore, fallback to "123456"
      const storedOtp = demoOtpStore.get(`${mobile}:${purpose}`) ?? "123456";
      if (otp !== storedOtp && otp !== "123456") {
        return unauthorized("Incorrect OTP. Demo mode: use 123456.");
      }

      // Cleanup on sucessful verification
      demoOtpStore.delete(`${mobile}:${purpose}`);

      if (purpose === "voter") {
        await createVoterSession(DEMO_SESSION_VOTER.id, mobile);
        return ok({
          redirect: "/vote",
          hasVoted: false,
          voter: { name: "Demo Voter", mobile: maskMobile(mobile) },
          _demo: true,
        });
      } else {
        await createAdminSession("demo-admin-id", mobile, "SUPER_ADMIN");
        return ok({
          redirect: "/admin/dashboard",
          admin: { name: "Demo Admin", role: "SUPER_ADMIN" },
          _demo: true,
        });
      }
    }

  } catch (e) {
    console.error("[verify-otp] Unhandled error:", e);
    return serverError();
  }
}
