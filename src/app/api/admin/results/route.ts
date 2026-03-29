export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { ok, unauthorized, serverError } from "@/lib/apiResponse";
import {
  isDbConnectionError,
  DEMO_CANDIDATES,
  DEMO_VOTE_COUNTS,
  DEMO_TOTAL_VOTES,
  DEMO_TOTAL_VOTERS,
  DEMO_IS_ELECTION_CLOSED,
  DEMO_ELECTION_TITLE,
} from "@/lib/demo-data";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    try {
      const [candidates, totalVoters, election] = await Promise.all([
        prisma.candidate.findMany({
          include: { _count: { select: { votes: true } } },
          orderBy: [{ isNota: "asc" }, { displayOrder: "asc" }],
        }),
        prisma.voter.count({ where: { isActive: true } }),
        prisma.electionConfig.findUnique({ where: { id: "singleton" } }),
      ]);

      const totalVotes = candidates.reduce((sum: number, c) => sum + c._count.votes, 0);

      const ranked = candidates
        .filter((c) => !c.isNota)
        .sort((a, b) => b._count.votes - a._count.votes);

      let rank = 1;
      let prevVotes: number | null = null;
      const rankMap = new Map<string, number>();
      for (const c of ranked) {
        if (prevVotes !== null && c._count.votes < prevVotes) rank++;
        rankMap.set(c.id, rank);
        prevVotes = c._count.votes;
      }

      const results = candidates.map((c) => ({
        id: c.id,
        serialNumber: c.serialNumber,
        name: c.name,
        position: c.position,
        party: c.party,
        bio: c.bio,
        photoUrl: c.photoUrl,
        symbolUrl: c.symbolUrl,
        isActive: c.isActive,
        isNota: c.isNota,
        displayOrder: c.displayOrder,
        createdAt: c.createdAt.toISOString(),
        voteCount: c._count.votes,
        percentage: totalVotes > 0 ? parseFloat(((c._count.votes / totalVotes) * 100).toFixed(2)) : 0,
        rank: rankMap.get(c.id) ?? 0,
      }));

      const winner = election?.isClosed
        ? results.find((c) => !c.isNota && c.rank === 1) ?? null
        : null;

      return ok({
        candidates: results,
        totalVotes,
        totalVoters,
        turnoutPercent: totalVoters > 0 ? parseFloat(((totalVotes / totalVoters) * 100).toFixed(2)) : 0,
        isElectionClosed: election?.isClosed ?? false,
        winner,
      });

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // ── DEMO MODE ─────────────────────────────────────────────────────────
      const results = DEMO_CANDIDATES.map((c) => {
        const voteCount = DEMO_VOTE_COUNTS[c.id] ?? 0;
        return {
          id: c.id,
          serialNumber: c.serialNumber,
          name: c.name,
          position: c.position,
          party: c.party ?? null,
          bio: c.bio ?? null,
          photoUrl: null,
          symbolUrl: null,
          isActive: true,
          isNota: c.isNota,
          displayOrder: c.displayOrder,
          createdAt: new Date().toISOString(),
          voteCount,
          percentage: DEMO_TOTAL_VOTES > 0 ? parseFloat(((voteCount / DEMO_TOTAL_VOTES) * 100).toFixed(2)) : 0,
          rank: 0,
        };
      });

      // Assign ranks
      const ranked = [...results].filter((c) => !c.isNota).sort((a, b) => b.voteCount - a.voteCount);
      let rank = 1; let prev: number | null = null;
      for (const c of ranked) {
        if (prev !== null && c.voteCount < prev) rank++;
        const entry = results.find((r) => r.id === c.id);
        if (entry) entry.rank = rank;
        prev = c.voteCount;
      }

      const winner = DEMO_IS_ELECTION_CLOSED
        ? results.find((c) => !c.isNota && c.rank === 1) ?? null
        : null;

      return ok({
        candidates: results,
        totalVotes: DEMO_TOTAL_VOTES,
        totalVoters: DEMO_TOTAL_VOTERS,
        turnoutPercent: parseFloat(((DEMO_TOTAL_VOTES / DEMO_TOTAL_VOTERS) * 100).toFixed(2)),
        isElectionClosed: DEMO_IS_ELECTION_CLOSED,
        winner,
        electionTitle: DEMO_ELECTION_TITLE,
        _demo: true,
      });
    }
  } catch (e) {
    console.error("[admin/results]", e);
    return serverError();
  }
}
