export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, maskMobile } from "@/lib/session";
import { buildVotersExcel } from "@/lib/export/voters";
import { unauthorized, serverError } from "@/lib/apiResponse";
import type { VoterListItem } from "@/types";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        mobile: true,
        isActive: true,
        hasVoted: true,
        votedAt: true,
        voteReferenceId: true,
      },
    });

    const items: VoterListItem[] = voters.map((v: {
      id: string; name: string; mobile: string; isActive: boolean;
      hasVoted: boolean; votedAt: Date | null; voteReferenceId: string | null;
    }) => ({
      id: v.id,
      name: v.name,
      mobile: maskMobile(v.mobile),
      isActive: v.isActive,
      hasVoted: v.hasVoted,
      votedAt: v.votedAt?.toISOString() ?? null,
      voteReferenceId: v.voteReferenceId,
    }));

    const buffer = await buildVotersExcel(items);
    const filename = `voters-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e) {
    console.error("[export/voters]", e);
    return serverError();
  }
}
