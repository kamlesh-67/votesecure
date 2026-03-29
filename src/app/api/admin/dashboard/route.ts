export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { ok, unauthorized, serverError } from "@/lib/apiResponse";
import { subHours, format } from "date-fns";
import {
  isDbConnectionError,
  DEMO_TOTAL_VOTERS,
  DEMO_TOTAL_VOTES,
  DEMO_VOTE_COUNTS,
  DEMO_VOTES_PER_HOUR,
  DEMO_IS_ELECTION_CLOSED,
  DEMO_ELECTION_TITLE,
} from "@/lib/demo-data";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    try {
      const [totalVoters, totalVoted, election] = await Promise.all([
        prisma.voter.count({ where: { isActive: true } }),
        prisma.voter.count({ where: { hasVoted: true } }),
        prisma.electionConfig.findUnique({ where: { id: "singleton" } }),
      ]);

      const turnoutPercent =
        totalVoters > 0 ? parseFloat(((totalVoted / totalVoters) * 100).toFixed(2)) : 0;

      const since = subHours(new Date(), 12);
      const votes = await prisma.vote.findMany({
        where: { castAt: { gte: since } },
        select: { castAt: true },
        orderBy: { castAt: "asc" },
      });

      const hourlyMap = new Map<string, number>();
      for (let i = 11; i >= 0; i--) {
        hourlyMap.set(format(subHours(new Date(), i), "HH:00"), 0);
      }
      for (const vote of votes) {
        const bucket = format(vote.castAt, "HH:00");
        hourlyMap.set(bucket, (hourlyMap.get(bucket) ?? 0) + 1);
      }
      const votesPerHour = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count }));

      const recentActivity = await prisma.auditLog.findMany({
        where: { action: { in: ["VOTE_CAST", "VOTER_DISABLED", "CANDIDATE_CREATED", "ELECTION_CLOSED", "VOTERS_UPLOADED"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { action: true, mobile: true, createdAt: true },
      });

      return ok({
        totalVoters,
        totalVoted,
        turnoutPercent,
        votesRemaining: totalVoters - totalVoted,
        votesPerHour,
        isElectionClosed: election?.isClosed ?? false,
        electionTitle: election?.title ?? "Election 2025",
        recentActivity: recentActivity.map((a) => ({
          action: a.action,
          mobile: a.mobile ? "XXXXXX" + a.mobile.slice(-4) : null,
          at: a.createdAt.toISOString(),
        })),
      });

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // ── DEMO MODE ─────────────────────────────────────────────────────────
      const totalVoted = DEMO_TOTAL_VOTES;
      const turnoutPercent = parseFloat(((totalVoted / DEMO_TOTAL_VOTERS) * 100).toFixed(2));

      return ok({
        totalVoters: DEMO_TOTAL_VOTERS,
        totalVoted,
        turnoutPercent,
        votesRemaining: DEMO_TOTAL_VOTERS - totalVoted,
        votesPerHour: DEMO_VOTES_PER_HOUR,
        isElectionClosed: DEMO_IS_ELECTION_CLOSED,
        electionTitle: DEMO_ELECTION_TITLE,
        recentActivity: [],
        _demo: true,
      });
    }
  } catch (e) {
    console.error("[admin/dashboard]", e);
    return serverError();
  }
}
