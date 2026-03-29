"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { VoterListItem, PaginatedResponse } from "@/types";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  surface: "#f7f9ff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
  error: "#ba1a1a",
};

type FilterType = "all" | "voted" | "not_voted";

export default function AdminVotersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<VoterListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const limit = 20;

  function fetchVoters(p = page, s = search, f = filter) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (s) params.set("search", s);
    if (f !== "all") params.set("filter", f);
    fetch(`/api/admin/voters?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => setData(j.data))
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchVoters(); }, [page, filter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
      fetchVoters(1, searchInput, filter);
    }, 350);
  }, [searchInput]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/voters/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Upload failed."); return; }
      const { inserted, duplicates, errors } = json.data;
      toast.success(`Uploaded: ${inserted} added, ${duplicates} skipped, ${errors.length} errors.`);
      fetchVoters(1, "", "all");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.primary }}>Voters</h1>
          <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVariant }}>
            {data ? `${data.total.toLocaleString()} registered voters` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/admin/voters/template"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{ borderColor: C.outlineVariant, color: C.primary, backgroundColor: C.surfaceContainerLowest }}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Template
          </a>
          <label
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all"
            style={{ backgroundColor: C.primaryContainer, color: "#ffffff" }}
          >
            {uploading ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">upload_file</span>
            )}
            Upload Voters
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: C.onSurfaceVariant }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm"
            style={{
              borderColor: C.outlineVariant,
              backgroundColor: C.surfaceContainerLowest,
              color: C.onSurface,
              outline: "none",
            }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: C.outlineVariant }}>
          {(["all", "voted", "not_voted"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className="px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f ? C.primaryContainer : C.surfaceContainerLowest,
                color: filter === f ? "#ffffff" : C.onSurfaceVariant,
              }}
            >
              {f === "all" ? "All" : f === "voted" ? "Voted" : "Not Voted"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
          border: `1px solid ${C.outlineVariant}30`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.surfaceContainerLow }}>
                {["Name", "Mobile", "Status", "Voted At", "Ref ID"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: C.onSurfaceVariant }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <span className="material-symbols-outlined animate-spin text-2xl" style={{ color: C.primary }}>
                      progress_activity
                    </span>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm" style={{ color: C.onSurfaceVariant }}>
                    No voters found.
                  </td>
                </tr>
              ) : (
                data?.items.map((voter, i) => (
                  <tr
                    key={voter.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? C.surfaceContainerLowest : C.surface,
                      borderBottom: `1px solid ${C.outlineVariant}20`,
                    }}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: C.onSurface }}>
                      {voter.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: C.onSurfaceVariant }}>
                      {voter.mobile}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"
                        style={{
                          backgroundColor: voter.hasVoted ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          color: voter.hasVoted ? "#059669" : "#d97706",
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-xs"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {voter.hasVoted ? "check_circle" : "pending"}
                        </span>
                        {voter.hasVoted ? "Voted" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: C.onSurfaceVariant }}>
                      {voter.votedAt
                        ? new Date(voter.votedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: C.primary }}>
                      {voter.voteReferenceId ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: `${C.outlineVariant}30` }}
          >
            <span className="text-xs" style={{ color: C.onSurfaceVariant }}>
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: C.surfaceContainerLow, color: C.primary }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: C.surfaceContainerLow, color: C.primary }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
