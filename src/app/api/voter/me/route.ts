export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireVoterSession, maskMobile } from "@/lib/session";
import { ok, unauthorized, serverError } from "@/lib/apiResponse";
import { isDbConnectionError, DEMO_SESSION_VOTER } from "@/lib/demo-data";

export async function GET() {
  try {
    const payload = await requireVoterSession().catch(() => null);
    if (!payload) return unauthorized();

    try {
      const voter = await prisma.voter.findUnique({
        where: { id: payload.voterId },
        select: { id: true, name: true, mobile: true, hasVoted: true },
      });
      if (!voter) return unauthorized();

      return ok({
        id: voter.id,
        name: voter.name,
        mobile: maskMobile(voter.mobile),
        hasVoted: voter.hasVoted,
      });
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // Demo mode — return the demo voter profile
      return ok({
        id: DEMO_SESSION_VOTER.id,
        name: DEMO_SESSION_VOTER.name,
        mobile: "XXXXXX9999",
        hasVoted: false,
        _demo: true,
      });
    }
  } catch (e) {
    console.error("[voter/me]", e);
    return serverError();
  }
}
