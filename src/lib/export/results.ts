import ExcelJS from "exceljs";
import type { CandidateWithVotes, ElectionStatus } from "@/types";

/**
 * Builds an ExcelJS workbook with election results.
 * - Sheet 1: Candidate Rankings (rank, name, party, votes, %)
 * - Sheet 2: Summary (title, date, turnout %, winner)
 *
 * Returns a Buffer ready to send as a file download.
 */
export async function buildResultsExcel(
  candidates: CandidateWithVotes[],
  election: ElectionStatus,
  totalVoters: number,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VoteSecure";
  workbook.created = new Date();

  // ── Sheet 1: Rankings ──────────────────────────────────────────────────────
  const rankSheet = workbook.addWorksheet("Election Results");

  // Header row styles
  rankSheet.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Serial No.", key: "serialNumber", width: 12 },
    { header: "Candidate Name", key: "name", width: 30 },
    { header: "Party / Affiliation", key: "party", width: 25 },
    { header: "Votes Received", key: "voteCount", width: 16 },
    { header: "Percentage (%)", key: "percentage", width: 16 },
  ];

  // Style header row
  const headerRow = rankSheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001857" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Data rows
  candidates.forEach((c) => {
    const row = rankSheet.addRow({
      rank: c.rank,
      serialNumber: c.serialNumber,
      name: c.name,
      party: c.party ?? "Independent",
      voteCount: c.voteCount,
      percentage: `${c.percentage.toFixed(2)}%`,
    });
    // Highlight winner (rank 1, not NOTA)
    if (c.rank === 1 && !c.isNota) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
        cell.font = { bold: true };
      });
    }
  });

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 40 },
  ];

  const winner = candidates.find((c) => c.rank === 1 && !c.isNota);
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  const summaryData = [
    { field: "Election Title", value: election.title },
    { field: "Status", value: election.isClosed ? "Closed" : "Open" },
    { field: "Closed At", value: election.closedAt ?? "N/A" },
    { field: "Total Registered Voters", value: totalVoters },
    { field: "Total Votes Cast", value: totalVotes },
    { field: "Turnout (%)", value: `${((totalVotes / totalVoters) * 100).toFixed(2)}%` },
    { field: "Winner", value: winner ? `${winner.name} (${winner.party ?? "Independent"})` : "N/A" },
    { field: "Winner Votes", value: winner?.voteCount ?? "N/A" },
    { field: "Exported At", value: new Date().toISOString() },
  ];

  summaryData.forEach((d) => summarySheet.addRow(d));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
