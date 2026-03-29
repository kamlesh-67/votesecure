export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { ok, err, unauthorized, serverError, getIp } from "@/lib/apiResponse";
import { voterRowSchema } from "@/lib/validators";
import type { VoterUploadError } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAdminSession().catch(() => null);
    if (!payload) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err("No file uploaded.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const isExcel =
      file.name.endsWith(".xlsx") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const isCsv = file.name.endsWith(".csv") || file.type === "text/csv";

    if (!isExcel && !isCsv) {
      return err("Only .xlsx and .csv files are supported.");
    }

    const rows: { name: string; mobile: string }[] = [];

    // ── Parse file ─────────────────────────────────────────────────────────
    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer.buffer as ArrayBuffer);
      const sheet = workbook.worksheets[0];
      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip header
        const name = String(row.getCell(1).value ?? "").trim();
        const mobile = String(row.getCell(2).value ?? "").trim().replace(/\D/g, "");
        if (name || mobile) rows.push({ name, mobile });
      });
    } else {
      const csvText = buffer.toString("utf-8");
      const parsed = Papa.parse<{ name: string; mobile: string }>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.toLowerCase().trim(),
      });
      for (const r of parsed.data) {
        rows.push({
          name: String(r.name ?? "").trim(),
          mobile: String(r.mobile ?? "").trim().replace(/\D/g, ""),
        });
      }
    }

    if (rows.length === 0) return err("File is empty or has no valid rows.");
    if (rows.length > 10_000) return err("Upload limit is 10,000 voters per file.");

    // ── Validate each row ─────────────────────────────────────────────────
    const validRows: { name: string; mobile: string }[] = [];
    const errors: VoterUploadError[] = [];

    rows.forEach((row, idx) => {
      const result = voterRowSchema.safeParse(row);
      if (result.success) {
        validRows.push(result.data);
      } else {
        errors.push({
          row: idx + 2, // +2 for 1-indexed + header
          mobile: row.mobile,
          reason: result.error.issues[0]?.message ?? "Invalid row",
        });
      }
    });

    // ── Remove in-file duplicates ─────────────────────────────────────────
    const seen = new Set<string>();
    const deduped = validRows.filter((r) => {
      if (seen.has(r.mobile)) return false;
      seen.add(r.mobile);
      return true;
    });

    // ── Batch insert with skip duplicates (handles DB duplicates) ─────────
    const result = await prisma.voter.createMany({
      data: deduped.map((r) => ({ name: r.name, mobile: r.mobile })),
      skipDuplicates: true,
    });

    const duplicates = deduped.length - result.count;

    await logAudit({
      action: "VOTERS_UPLOADED",
      adminId: payload.adminId,
      ipAddress: getIp(req),
      metadata: { inserted: result.count, duplicates, errors: errors.length },
    });

    return ok({ inserted: result.count, duplicates, errors }, 201);
  } catch (e) {
    console.error("[voters/upload]", e);
    return serverError();
  }
}
