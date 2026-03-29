export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import {
  ok, err, notFound, unauthorized, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { candidateUpdateSchema } from "@/lib/validators";
import { uploadCandidatePhoto, deleteStorageFile } from "@/lib/fileUpload";

type Params = { params: Promise<{ id: string }> };

// ── PATCH: Update candidate ───────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const { id } = await params;
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) return notFound("Candidate not found.");

    const contentType = req.headers.get("content-type") ?? "";

    let updates: Record<string, unknown> = {};
    let newPhotoUrl: string | null = null;
    let newSymbolUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const photo = formData.get("photo") as File | null;
      const symbol = formData.get("symbol") as File | null;

      const rawData: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (key !== "photo" && key !== "symbol") {
          rawData[key] = value === "true" ? true : value === "false" ? false : value;
        }
      }
      if (rawData.serialNumber) rawData.serialNumber = Number(rawData.serialNumber);
      if (rawData.displayOrder) rawData.displayOrder = Number(rawData.displayOrder);

      const result = candidateUpdateSchema.safeParse(rawData);
      if (!result.success) return err(formatZodError(result.error.issues));
      updates = result.data;

      if (photo && photo.size > 0) {
        const buf = Buffer.from(await photo.arrayBuffer());
        newPhotoUrl = await uploadCandidatePhoto(buf, existing.name, "candidates");
        if (existing.photoUrl) await deleteStorageFile(existing.photoUrl, "candidates");
        updates.photoUrl = newPhotoUrl;
      }
      if (symbol && symbol.size > 0) {
        const buf = Buffer.from(await symbol.arrayBuffer());
        newSymbolUrl = await uploadCandidatePhoto(buf, existing.name + "_symbol", "symbols");
        if (existing.symbolUrl) await deleteStorageFile(existing.symbolUrl, "symbols");
        updates.symbolUrl = newSymbolUrl;
      }
    } else {
      const body = await req.json();
      const result = candidateUpdateSchema.safeParse(body);
      if (!result.success) return err(formatZodError(result.error.issues));
      updates = result.data;
    }

    const updated = await prisma.candidate.update({ where: { id }, data: updates });

    await logAudit({
      action: "CANDIDATE_UPDATED",
      adminId: payload.adminId,
      ipAddress: getIp(req),
      metadata: { candidateId: id, changes: Object.keys(updates).join(",") },
    });

    return ok(updated);
  } catch (e) {
    console.error("[candidates/[id] PATCH]", e);
    return serverError();
  }
}

// ── DELETE: Remove candidate ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { _count: { select: { votes: true } } },
    });
    if (!candidate) return notFound("Candidate not found.");

    if (candidate._count.votes > 0) {
      // Soft-delete if votes exist — preserve referential integrity
      await prisma.candidate.update({ where: { id }, data: { isActive: false } });
    } else {
      // Hard-delete if no votes
      if (candidate.photoUrl) await deleteStorageFile(candidate.photoUrl, "candidates");
      if (candidate.symbolUrl) await deleteStorageFile(candidate.symbolUrl, "symbols");
      await prisma.candidate.delete({ where: { id } });
    }

    await logAudit({
      action: "CANDIDATE_DELETED",
      adminId: payload.adminId,
      ipAddress: getIp(req),
      metadata: { candidateId: id, name: candidate.name },
    });

    return ok({ message: "Candidate removed." });
  } catch (e) {
    console.error("[candidates/[id] DELETE]", e);
    return serverError();
  }
}
