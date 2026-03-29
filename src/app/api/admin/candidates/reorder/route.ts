export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { ok, err, unauthorized, serverError, formatZodError } from "@/lib/apiResponse";
import { reorderCandidatesSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const body = await req.json();
    const result = reorderCandidatesSchema.safeParse(body);
    if (!result.success) return err(formatZodError(result.error.issues));

    const { orderedIds } = result.data;

    // Update displayOrder for each candidate in a transaction
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.candidate.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    return ok({ message: "Candidates reordered successfully." });
  } catch (e) {
    console.error("[candidates/reorder]", e);
    return serverError();
  }
}
