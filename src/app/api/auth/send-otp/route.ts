export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpSendLimiter } from "@/lib/redis";
import { generateOtp, hashOtp, otpExpiresAt } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { logAudit } from "@/lib/audit";
import {
  ok, err, tooManyRequests, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { sendOtpSchema } from "@/lib/validators";
import { isDbConnectionError } from "@/lib/demo-data";

// Demo OTP store (in-memory, per instance lifetime)
const demoOtpStore = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = sendOtpSchema.safeParse(body);
    if (!result.success) return err(formatZodError(result.error.issues));

    const { mobile, purpose } = result.data;
    const ip = getIp(req);

    // ── Rate limit (skip if Redis not configured) ─────────────────────────
    try {
      const { success: allowed } = await otpSendLimiter.limit(mobile);
      if (!allowed) return tooManyRequests("Too many OTP requests. Please wait 10 minutes.");
    } catch { /* Redis not configured — skip in demo mode */ }

    // ── Verify entity exists ──────────────────────────────────────────────
    try {
      if (purpose === "voter") {
        const voter = await prisma.voter.findUnique({
          where: { mobile },
          select: { isActive: true, hasVoted: true },
        });
        if (!voter) return err("Mobile number not registered as a voter.", 404);
        if (!voter.isActive) return err("Your voter account has been disabled.", 403);
        if (voter.hasVoted) return err("You have already voted.", 409);
      } else {
        const admin = await prisma.admin.findUnique({
          where: { mobile },
          select: { isActive: true },
        });
        if (!admin) return err("Mobile number not registered as admin.", 404);
        if (!admin.isActive) return err("Admin account disabled.", 403);
      }

      // ── Generate, hash, and store OTP ──────────────────────────────────
      const otp = generateOtp();
      const otpHash = await hashOtp(otp);

      await prisma.otpLog.updateMany({
        where: { mobile, purpose, used: false },
        data: { used: true },
      });
      await prisma.otpLog.create({
        data: { mobile, otpHash, purpose, expiresAt: otpExpiresAt() },
      });

      const { success: smsSent, message } = await sendOtpSms(mobile, otp);
      if (!smsSent) return serverError(message);

      await logAudit({ action: "OTP_SENT", mobile, ipAddress: ip, metadata: { purpose } });
      return ok({ message: "OTP sent successfully." });

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // ── DEMO MODE: accept any 10-digit mobile, OTP is always 123456 ────
      console.warn("[send-otp] Demo mode: DB not reachable. Using demo OTP.");
      demoOtpStore.set(`${mobile}:${purpose}`, "123456");
      return ok({ message: "OTP sent successfully. (Demo mode: use 123456)" });
    }

  } catch (e) {
    console.error("[send-otp]", e);
    return serverError();
  }
}

/** Exported so verify-otp can read demo OTPs without a shared singleton issue. */
export { demoOtpStore };
