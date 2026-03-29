export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireVoterSession } from "@/lib/session";
import { ok, unauthorized, err, serverError } from "@/lib/apiResponse";
import { isDbConnectionError, DEMO_CANDIDATES, DEMO_ELECTION_TITLE } from "@/lib/demo-data";

export async function GET() {
  try {
    const payload = await requireVoterSession().catch(() => null);
    if (!payload) return unauthorized();

    try {
      const electionConfig = await prisma.electionConfig.findUnique({
        where: { id: "singleton" },
        select: { isClosed: true, title: true },
      });

      if (electionConfig?.isClosed) {
        return err("The election has been closed. Voting is no longer permitted.", 403);
      }

      const candidates = await prisma.candidate.findMany({
        where: { isActive: true },
        orderBy: [{ isNota: "asc" }, { displayOrder: "asc" }],
        select: {
          id: true,
          serialNumber: true,
          name: true,
          position: true,
          party: true,
          bio: true,
          photoUrl: true,
          symbolUrl: true,
          isNota: true,
        },
      });

      return ok({ candidates, electionTitle: electionConfig?.title ?? "Election 2025" });

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // Demo mode — return demo candidates (no vote counts visible to voters)
      const demoCandidates = DEMO_CANDIDATES.map((c) => ({
        id: c.id,
        serialNumber: c.serialNumber,
        name: c.name,
        position: c.position,
        party: c.party,
        bio: c.bio,
        photoUrl: c.photoUrl,
        symbolUrl: c.symbolUrl,
        isNota: c.isNota,
      }));
      return ok({ candidates: demoCandidates, electionTitle: DEMO_ELECTION_TITLE, _demo: true });
    }
  } catch (e) {
    console.error("[voter/candidates]", e);
    return serverError();
  }
}
