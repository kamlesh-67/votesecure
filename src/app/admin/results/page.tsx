"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ElectionResults } from "@/types";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  primaryFixed: "#dce1ff",
  surface: "#f7f9ff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  surfaceContainerHighest: "#d1e4fb",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
  error: "#ba1a1a",
};

export default function AdminResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/results")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => setResults(j.data))
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCloseElection() {
    setClosing(true);
    try {
      const res = await fetch("/api/admin/election/close", { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to close."); return; }
      toast.success("Election closed. Results are now final.");
      setShowCloseConfirm(false);
      // Reload
      const r2 = await fetch("/api/admin/results");
      const j2 = await r2.json();
      setResults(j2.data);
    } catch { toast.error("Network error."); }
    finally { setClosing(false); }
  }

  if (loading || !results) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: C.primary }}>
          progress_activity
        </span>
      </div>
    );
  }

  const maxVotes = Math.max(...results.candidates.map((c) => c.voteCount), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.primary }}>Election Results</h1>
          <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVariant }}>
            {results.totalVotes.toLocaleString()} votes cast · {results.turnoutPercent.toFixed(1)}% turnout
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/admin/export/results"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{ borderColor: C.outlineVariant, color: C.primary, backgroundColor: C.surfaceContainerLowest }}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Excel
          </a>
          {!results.isElectionClosed && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: C.error, color: "#ffffff" }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              Close Election
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {results.isElectionClosed ? (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <span className="material-symbols-outlined" style={{ color: "#059669", fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
          <p className="font-semibold" style={{ color: "#059669" }}>
            Election Closed · Results are Final
          </p>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <span className="material-symbols-outlined" style={{ color: "#d97706", fontVariationSettings: "'FILL' 1" }}>
            radio_button_checked
          </span>
          <p className="font-semibold" style={{ color: "#d97706" }}>
            Election In Progress · Live Tally
          </p>
        </div>
      )}

      {/* Winner card */}
      {results.winner && results.isElectionClosed && (
        <div
          className="rounded-2xl p-6 overflow-hidden relative"
          style={{ backgroundColor: C.primaryContainer, boxShadow: "0 8px 32px rgba(27,47,110,0.3)" }}
        >
          <div
            className="absolute top-0 right-0 opacity-10 pointer-events-none select-none"
            style={{ fontSize: "12rem", lineHeight: 1 }}
          >
            🏆
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.secondaryContainer }}>
            Winner
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{results.winner.name}</h2>
          {results.winner.party && (
            <p className="text-lg mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>{results.winner.party}</p>
          )}
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Votes</p>
              <p className="text-2xl font-bold text-white">{results.winner.voteCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Vote Share</p>
              <p className="text-2xl font-bold text-white">{results.winner.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate results */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
          border: `1px solid ${C.outlineVariant}30`,
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: `${C.outlineVariant}30` }}>
          <h2 className="font-bold text-lg" style={{ color: C.primary }}>Vote Tally</h2>
        </div>

        <div className="divide-y" style={{ borderColor: `${C.outlineVariant}20` }}>
          {results.candidates
            .filter((c) => !c.isNota)
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((candidate, idx) => (
              <div key={candidate.id} className="p-5 flex items-center gap-4">
                {/* Rank */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: idx === 0 ? C.secondaryContainer : C.surfaceContainerHigh,
                    color: idx === 0 ? "#684300" : C.onSurfaceVariant,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Photo */}
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: C.surfaceContainerHigh }}
                  >
                    <span className="material-symbols-outlined" style={{ color: C.onSurfaceVariant }}>person</span>
                  </div>
                )}

                {/* Info + bar */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-bold" style={{ color: C.onSurface }}>{candidate.name}</p>
                      {candidate.party && (
                        <p className="text-xs" style={{ color: C.onSurfaceVariant }}>{candidate.party}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-bold" style={{ color: C.primary }}>
                        {candidate.voteCount.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: C.onSurfaceVariant }}>
                        {candidate.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceContainerHigh }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(candidate.voteCount / maxVotes) * 100}%`,
                        backgroundColor: idx === 0 ? C.secondaryContainer : C.primaryFixed,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

          {/* NOTA */}
          {results.candidates.filter((c) => c.isNota).map((nota) => (
            <div key={nota.id} className="p-5 flex items-center gap-4 opacity-60">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.surfaceContainerHigh }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>block</span>
              </div>
              <div className="flex-grow">
                <p className="font-bold text-sm uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  NOTA
                </p>
                <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: C.surfaceContainerHigh }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(nota.voteCount / maxVotes) * 100}%`, backgroundColor: C.outlineVariant }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: C.onSurfaceVariant }}>
                {nota.voteCount} · {nota.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Close election confirm modal */}
      {showCloseConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(9,29,46,0.6)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ backgroundColor: C.surfaceContainerLowest }}
          >
            <span
              className="material-symbols-outlined text-5xl mb-4"
              style={{ color: C.error, fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <h2 className="font-extrabold text-xl mb-2" style={{ color: C.error }}>
              Close Election?
            </h2>
            <p className="text-sm mb-6" style={{ color: C.onSurfaceVariant }}>
              This action is <strong>irreversible</strong>. Voting will be permanently disabled and results will be locked.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold border"
                style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseElection}
                disabled={closing}
                className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: C.error, opacity: closing ? 0.7 : 1 }}
              >
                {closing ? "Closing..." : "Yes, Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
