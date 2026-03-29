export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/session";
import { buildVotersTemplate } from "@/lib/export/voters";
import { unauthorized, serverError } from "@/lib/apiResponse";

export async function GET() {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const buffer = await buildVotersTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="voter-upload-template.xlsx"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e) {
    console.error("[voters/template]", e);
    return serverError();
  }
}
