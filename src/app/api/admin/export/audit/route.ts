export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { buildAuditExcel } from "@/lib/export/audit";
import { unauthorized, forbidden, serverError } from "@/lib/apiResponse";
import type { AuditLogEntry } from "@/types";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    // ── super_admin ONLY ───────────────────────────────────────────────────
    if (payload.role !== "super_admin") {
      return forbidden("Only super_admin can export the audit log.");
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50_000, // safety cap
    });

    const entries: AuditLogEntry[] = logs.map((l: {
      id: string; action: string; mobile: string | null; adminId: string | null;
      ipAddress: string | null; userAgent: string | null;
      metadata: unknown; createdAt: Date;
    }) => ({
      id: l.id,
      action: l.action as AuditLogEntry["action"],
      mobile: l.mobile,
      adminId: l.adminId,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      metadata: l.metadata as AuditLogEntry["metadata"],
      createdAt: l.createdAt.toISOString(),
    }));

    const buffer = await buildAuditExcel(entries);
    const filename = `audit-log-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e) {
    console.error("[export/audit]", e);
    return serverError();
  }
}
