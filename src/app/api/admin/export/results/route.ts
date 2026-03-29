export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { buildResultsExcel } from "@/lib/export/results";
import { unauthorized, serverError } from "@/lib/apiResponse";
import type { CandidateWithVotes } from "@/types";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const [candidates, totalVoters, election] = await Promise.all([
      prisma.candidate.findMany({
        include: { _count: { select: { votes: true } } },
        orderBy: [{ isNota: "asc" }, { displayOrder: "asc" }],
      }),
      prisma.voter.count({ where: { isActive: true } }),
      prisma.electionConfig.findUnique({ where: { id: "singleton" } }),
    ]);

    const totalVotes = candidates.reduce((sum: number, c) => sum + c._count.votes, 0);
    const sorted = [...candidates].sort((a, b) => b._count.votes - a._count.votes);

    let rank = 1;
    let prev: number | null = null;
    const rankMap = new Map<string, number>();
    for (const c of sorted.filter((c) => !c.isNota)) {
      if (prev !== null && c._count.votes < prev) rank++;
      rankMap.set(c.id, rank);
      prev = c._count.votes;
    }

    const withVotes: CandidateWithVotes[] = candidates.map((c: typeof candidates[number]) => ({
      id: c.id,
      serialNumber: c.serialNumber,
      name: c.name,
      position: c.position,
      party: c.party,
      bio: c.bio,
      photoUrl: c.photoUrl,
      symbolUrl: c.symbolUrl,
      isNota: c.isNota,
      isActive: c.isActive,
      displayOrder: c.displayOrder,
      createdAt: c.createdAt.toISOString(),
      voteCount: c._count.votes,
      percentage: totalVotes > 0 ? parseFloat(((c._count.votes / totalVotes) * 100).toFixed(2)) : 0,
      rank: rankMap.get(c.id) ?? 0,
    }));

    const buffer = await buildResultsExcel(withVotes, {
      title: election?.title ?? "Election 2025",
      isClosed: election?.isClosed ?? false,
      closedAt: election?.closedAt?.toISOString() ?? null,
      closedBy: election?.closedBy ?? null,
    }, totalVoters);

    await logAudit({ action: "RESULTS_EXPORTED", adminId: payload.adminId });

    const filename = `election-results-${new Date().toISOString().split("T")[0]}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("[export/results]", e);
    return serverError();
  }
}
