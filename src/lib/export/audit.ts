import ExcelJS from "exceljs";
import type { AuditLogEntry } from "@/types";

/**
 * Builds an ExcelJS workbook for the audit log export.
 * Accessible to super_admin only (enforced at API route level).
 *
 * Columns: Timestamp, Action, Mobile, Admin ID, IP Address, Details (JSON).
 *
 * Returns a Buffer ready to send as a file download.
 */
export async function buildAuditExcel(logs: AuditLogEntry[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VoteSecure";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Audit Log");

  sheet.columns = [
    { header: "Timestamp (IST)", key: "createdAt", width: 24 },
    { header: "Action", key: "action", width: 30 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Admin ID", key: "adminId", width: 28 },
    { header: "IP Address", key: "ipAddress", width: 18 },
    { header: "User Agent", key: "userAgent", width: 40 },
    { header: "Metadata (JSON)", key: "metadata", width: 50 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B2F6E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Action color coding
  const actionColors: Record<string, string> = {
    VOTE_CAST: "FFD4EDDA",
    VOTE_ATTEMPT_DUPLICATE: "FFFFDAD6",
    ELECTION_CLOSED: "FFFFF3CD",
    VOTER_DISABLED: "FFFFDAD6",
    OTP_FAILED: "FFFFFFD6",
    LOGIN_FAILED: "FFFFFFD6",
  };

  logs.forEach((log) => {
    const row = sheet.addRow({
      createdAt: new Date(log.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      action: log.action,
      mobile: log.mobile ?? "—",
      adminId: log.adminId ?? "—",
      ipAddress: log.ipAddress ?? "—",
      userAgent: log.userAgent ?? "—",
      metadata: log.metadata ? JSON.stringify(log.metadata) : "—",
    });

    // Color-code sensitive action rows
    const bgColor = actionColors[log.action];
    if (bgColor) {
      row.getCell("action").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
    }
  });

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 7 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
