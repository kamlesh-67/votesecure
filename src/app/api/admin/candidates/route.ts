export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import {
  ok, err, unauthorized, serverError, formatZodError, getIp,
} from "@/lib/apiResponse";
import { candidateSchema } from "@/lib/validators";
import { uploadCandidatePhoto } from "@/lib/fileUpload";
import { isDbConnectionError, DEMO_CANDIDATES } from "@/lib/demo-data";

// In-memory demo candidates store (mutable for demo CRUD)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let demoCandidates: Record<string, any>[] = DEMO_CANDIDATES.map((c) => ({ ...c }));

// ── GET: List all candidates ─────────────────────────────────────────────────
export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    try {
      const candidates = await prisma.candidate.findMany({
        orderBy: [{ isNota: "asc" }, { displayOrder: "asc" }],
      });
      return ok(candidates.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })));
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;
      console.warn("[admin/candidates GET] Demo mode.");
      return ok(demoCandidates.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        _demo: true,
      })));
    }
  } catch (e) {
    console.error("[admin/candidates GET]", e);
    return serverError();
  }
}

// ── POST: Create candidate ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const formData = await req.formData();
    const photo = formData.get("photo") as File | null;
    const symbol = formData.get("symbol") as File | null;

    const rawData = {
      serialNumber: Number(formData.get("serialNumber")),
      name: formData.get("name") as string,
      position: formData.get("position") as string | null,
      party: formData.get("party") as string | null,
      bio: formData.get("bio") as string | null,
      isActive: formData.get("isActive") !== "false",
      isNota: formData.get("isNota") === "true",
      displayOrder: Number(formData.get("displayOrder") ?? 0),
    };

    const result = candidateSchema.safeParse(rawData);
    if (!result.success) return err(formatZodError(result.error.issues));

    try {
      let photoUrl: string | null = null;
      let symbolUrl: string | null = null;

      if (photo && photo.size > 0) {
        const buf = Buffer.from(await photo.arrayBuffer());
        photoUrl = await uploadCandidatePhoto(buf, result.data.name, "candidates");
      }
      if (symbol && symbol.size > 0) {
        const buf = Buffer.from(await symbol.arrayBuffer());
        symbolUrl = await uploadCandidatePhoto(buf, result.data.name + "_symbol", "symbols");
      }

      const candidate = await prisma.candidate.create({
        data: { ...result.data, photoUrl, symbolUrl },
      });

      await logAudit({
        action: "CANDIDATE_CREATED",
        adminId: payload.adminId,
        ipAddress: getIp(req),
        metadata: { candidateId: candidate.id, name: candidate.name },
      });

      return ok(candidate, 201);
    } catch (dbErr) {
      if (!isDbConnectionError(dbErr)) throw dbErr;
      // Demo: add to in-memory store
      console.warn("[admin/candidates POST] Demo mode.");
      const newCandidate = {
        id: `demo-${Date.now()}`,
        serialNumber: result.data.serialNumber,
        name: result.data.name,
        position: result.data.position ?? null,
        party: result.data.party ?? null,
        bio: result.data.bio ?? null,
        isActive: result.data.isActive,
        isNota: result.data.isNota,
        displayOrder: result.data.displayOrder,
        photoUrl: null,
        symbolUrl: null,
        voteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      demoCandidates.push(newCandidate);
      return ok({ ...newCandidate, _demo: true }, 201);
    }
  } catch (e) {
    console.error("[admin/candidates POST]", e);
    return serverError();
  }
}
