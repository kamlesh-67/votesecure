export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireVoterSession, revokeVoterSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import {
  ok, err, unauthorized, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { voteSchema } from "@/lib/validators";
import {
  isDbConnectionError,
  DEMO_CANDIDATES,
  DEMO_SESSION_VOTER,
} from "@/lib/demo-data";

export async function POST(req: NextRequest) {
  let voterId = "";

  try {
    let payload;
    try {
      payload = await requireVoterSession();
    } catch {
      return unauthorized("Invalid or expired session. Please log in again.");
    }

    voterId = payload.voterId;
    const ip = getIp(req);
    const ua = req.headers.get("user-agent") ?? "";

    const body = await req.json();
    const result = voteSchema.safeParse(body);
    if (!result.success) return err(formatZodError(result.error.issues));
    const { candidateId } = result.data;

    // ── Try real DB path ──────────────────────────────────────────────────
    try {
      const election = await prisma.electionConfig.findUnique({
        where: { id: "singleton" },
        select: { isClosed: true },
      });
      if (election?.isClosed) return err("The election has closed.", 409);

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true, name: true, party: true, symbolUrl: true, isActive: true },
      });
      if (!candidate?.isActive) return err("Invalid or inactive candidate.", 400);

      const vote = await prisma.$transaction(async (tx) => {
        const voter = await tx.voter.findUnique({
          where: { id: voterId },
          select: { hasVoted: true, isActive: true, mobile: true },
        });
        if (!voter?.isActive) throw new Error("VOTER_DISABLED");
        if (voter.hasVoted) throw new Error("ALREADY_VOTED");

        const newVote = await tx.vote.create({
          data: { voterId, candidateId, ipAddress: ip, userAgent: ua },
          select: { referenceId: true, castAt: true },
        });
        await tx.voter.update({
          where: { id: voterId },
          data: {
            hasVoted: true,
            votedAt: newVote.castAt,
            voteReferenceId: newVote.referenceId,
            sessionToken: null,
          },
        });
        return { ...newVote, mobile: voter.mobile };
      });

      const cookieStore = await cookies();
      const sessionCookie = process.env.SESSION_COOKIE_NAME ?? "vs_session";
      cookieStore.delete(sessionCookie);

      const votedHash = crypto.createHash("sha256").update(vote.mobile).digest("hex");
      cookieStore.set("vs_voted", votedHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
      });

      await logAudit({
        action: "VOTE_CAST",
        mobile: vote.mobile,
        ipAddress: ip,
        userAgent: ua,
        metadata: { referenceId: vote.referenceId, candidateId },
      });

      return ok({
        success: true,
        referenceId: vote.referenceId,
        candidateName: candidate.name,
        candidateParty: candidate.party,
        candidateSymbolUrl: candidate.symbolUrl,
        castAt: vote.castAt.toISOString(),
      });

    } catch (innerErr: unknown) {
      // Re-throw known business logic errors
      const msg = innerErr instanceof Error ? innerErr.message : "";
      if (msg === "ALREADY_VOTED") return err("You have already voted.", 409);
      if (msg === "VOTER_DISABLED") return err("Your account has been disabled.", 403);
      if (msg.includes("P2002") || msg.includes("Unique constraint")) {
        return err("You have already voted.", 409);
      }

      if (!isDbConnectionError(innerErr)) throw innerErr;

      // ── DEMO MODE ─────────────────────────────────────────────────────────
      console.warn("[voter/vote] Demo mode: simulating vote cast.");
      const demoCandidate = DEMO_CANDIDATES.find((c) => c.id === candidateId);
      if (!demoCandidate) return err("Invalid candidate.", 400);

      const demoRef = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      const castAt = new Date().toISOString();

      return ok({
        success: true,
        referenceId: demoRef,
        candidateName: demoCandidate.name,
        candidateParty: demoCandidate.party ?? null,
        candidateSymbolUrl: null,
        castAt,
        _demo: true,
      });
    }

  } catch (e: unknown) {
    console.error("[voter/vote]", e);
    return serverError();
  }
}
