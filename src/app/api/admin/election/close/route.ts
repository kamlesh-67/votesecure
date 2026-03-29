export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { ok, err, unauthorized, forbidden, serverError, getIp } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    // ── super_admin only ──────────────────────────────────────────────────
    if (payload.role !== "super_admin") {
      return forbidden("Only super_admin can close the election.");
    }

    const election = await prisma.electionConfig.findUnique({
      where: { id: "singleton" },
      select: { isClosed: true },
    });

    if (election?.isClosed) {
      return err("The election is already closed.", 409);
    }

    await prisma.electionConfig.update({
      where: { id: "singleton" },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedBy: payload.adminId,
      },
    });

    await logAudit({
      action: "ELECTION_CLOSED",
      adminId: payload.adminId,
      ipAddress: getIp(req),
    });

    return ok({ message: "Election closed successfully. No further votes will be accepted." });
  } catch (e) {
    console.error("[election/close]", e);
    return serverError();
  }
}
