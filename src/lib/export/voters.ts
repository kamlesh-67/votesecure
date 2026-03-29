import ExcelJS from "exceljs";
import type { VoterListItem } from "@/types";

/**
 * Builds an ExcelJS workbook for voter list export.
 * Columns: Sr. No, Name, Mobile (masked), Status, Voted At, Reference ID.
 *
 * Returns a Buffer ready to send as a file download.
 */
export async function buildVotersExcel(voters: VoterListItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VoteSecure";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Voters List");

  sheet.columns = [
    { header: "Sr. No.", key: "srNo", width: 10 },
    { header: "Full Name", key: "name", width: 30 },
    { header: "Mobile (Masked)", key: "mobile", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Voted At", key: "votedAt", width: 22 },
    { header: "Vote Reference ID", key: "referenceId", width: 28 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001857" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Data rows
  voters.forEach((voter, idx) => {
    const row = sheet.addRow({
      srNo: idx + 1,
      name: voter.name,
      mobile: voter.mobile,
      status: voter.hasVoted ? "Voted ✓" : "Pending",
      votedAt: voter.votedAt ? new Date(voter.votedAt).toLocaleString("en-IN") : "—",
      referenceId: voter.voteReferenceId ?? "—",
    });

    // Color voted rows slightly green, not-voted rows default
    if (voter.hasVoted) {
      row.getCell("status").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD4EDDA" },
      };
    }
  });

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 6 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Builds a blank voter upload template with sample rows and column hints.
 */
export async function buildVotersTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VoteSecure";

  const sheet = workbook.addWorksheet("Voters");

  sheet.columns = [
    { header: "name", key: "name", width: 30 },
    { header: "mobile", key: "mobile", width: 15 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001857" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center" };
  });

  // Add hint row (row 2) in italic gray
  const hintRow = sheet.addRow({ name: "(Full Name)", mobile: "(10-digit mobile)" });
  hintRow.font = { italic: true, color: { argb: "FF808080" } };

  // Sample rows
  sheet.addRow({ name: "Rahul Kumar", mobile: "9876543210" });
  sheet.addRow({ name: "Priya Sharma", mobile: "8765432109" });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
