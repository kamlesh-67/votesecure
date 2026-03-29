export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { ok, unauthorized, serverError } from "@/lib/apiResponse";
import { paginationSchema } from "@/lib/validators";
import { isDbConnectionError, DEMO_VOTERS } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const { searchParams } = new URL(req.url);
    const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return ok({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });

    const { page, limit, search, filter } = parsed.data;
    const skip = (page - 1) * limit;

    try {
      const votedFilter =
        filter === "voted" ? true : filter === "not_voted" ? false : undefined;

      const searchFilter = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { mobile: { contains: search } },
            ],
          }
        : {};

      const where = {
        isActive: true,
        ...(votedFilter !== undefined && { hasVoted: votedFilter }),
        ...searchFilter,
      };

      const [voters, total] = await Promise.all([
        prisma.voter.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            mobile: true,
            isActive: true,
            hasVoted: true,
            votedAt: true,
            voteReferenceId: true,
          },
        }),
        prisma.voter.count({ where }),
      ]);

      const items = voters.map((v) => ({
        id: v.id,
        name: v.name,
        mobile: "XXXXXX" + v.mobile.slice(-4),
        isActive: v.isActive,
        hasVoted: v.hasVoted,
        votedAt: v.votedAt?.toISOString() ?? null,
        voteReferenceId: v.voteReferenceId,
      }));

      return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });

    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;

      // ── DEMO MODE ─────────────────────────────────────────────────────────
      let filtered = [...DEMO_VOTERS];

      // Apply filter
      if (filter === "voted") filtered = filtered.filter((v) => v.hasVoted);
      else if (filter === "not_voted") filtered = filtered.filter((v) => !v.hasVoted);

      // Apply search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (v) => v.name.toLowerCase().includes(q) || v.mobile.includes(q)
        );
      }

      const total = filtered.length;
      const items = filtered.slice(skip, skip + limit).map((v) => ({
        id: v.id,
        name: v.name,
        mobile: "XXXXXX" + v.mobile.slice(-4),
        isActive: true,
        hasVoted: v.hasVoted,
        votedAt: v.votedAt?.toISOString() ?? null,
        voteReferenceId: v.voteReferenceId,
      }));

      return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit), _demo: true });
    }
  } catch (e) {
    console.error("[admin/voters]", e);
    return serverError();
  }
}
