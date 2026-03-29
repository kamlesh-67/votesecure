import { prisma } from "./prisma";
import type { AuditAction } from "@/types";

// Prisma v7-compatible Json object type (matches InputJsonValue)
type JsonObject = { [key: string]: string | number | boolean | null | JsonObject | JsonObject[] };


interface AuditParams {
  action: AuditAction;
  mobile?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: JsonObject;
}

/**
 * Logs a security-relevant action to the AuditLog table.
 *
 * Fire-and-forget — errors are swallowed so audit logging
 * NEVER crashes the main execution flow.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // Intentionally silent — audit log failures must not block votes
    console.error("[audit] Failed to log action:", params.action);
  }
}
