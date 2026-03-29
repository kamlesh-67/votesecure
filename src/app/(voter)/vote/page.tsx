"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CandidatePublic, VoteCastResult } from "@/types";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  primaryFixed: "#dce1ff",
  surface: "#f7f9ff",
  surfaceContainer: "#e3efff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  surfaceContainerHighest: "#d1e4fb",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondary: "#825500",
  secondaryContainer: "#fdab12",
  onSecondaryContainer: "#684300",
};

type ConfirmState = "idle" | "confirming" | "submitting" | "done";

export default function VotePage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidatePublic[]>([]);
  const [electionTitle, setElectionTitle] = useState("Election 2025");
  const [voterName, setVoterName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");
  const [result, setResult] = useState<VoteCastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(1800); // 30 min

  // Session countdown
  useEffect(() => {
    const t = setInterval(() => {
      setSessionExpiry((s) => {
        if (s <= 1) { router.push("/login"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Load voter + candidates
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [meRes, candRes] = await Promise.all([
        fetch("/api/voter/me"),
        fetch("/api/voter/candidates"),
      ]);
      if (!meRes.ok || !candRes.ok) {
        router.push("/login");
        return;
      }
      const me = await meRes.json();
      const cand = await candRes.json();
      if (me.data?.hasVoted) { router.push("/already-voted"); return; }
      setVoterName(me.data?.name ?? "");
      setCandidates(cand.data?.candidates ?? []);
      setElectionTitle(cand.data?.electionTitle ?? "Election 2025");
      setLoading(false);
    }
    load().catch(() => router.push("/login"));
  }, []);

  const selectedCandidate = candidates.find((c) => c.id === selectedId);
  const minutes = String(Math.floor(sessionExpiry / 60)).padStart(2, "0");
  const seconds = String(sessionExpiry % 60).padStart(2, "0");

  async function handleVote() {
    if (!selectedId) return;
    setConfirmState("submitting");
    try {
      const res = await fetch("/api/voter/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to cast vote.");
        setConfirmState("idle");
        return;
      }
      setResult(json.data as VoteCastResult);
      setConfirmState("done");
      setTimeout(() => router.push(`/success?ref=${json.data.referenceId}&name=${encodeURIComponent(json.data.candidateName)}&party=${encodeURIComponent(json.data.candidateParty ?? "")}&at=${encodeURIComponent(json.data.castAt)}`), 1200);
    } catch {
      toast.error("Network error. Please try again.");
      setConfirmState("idle");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.surface }}>
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: C.primary }}>
            progress_activity
          </span>
          <p className="font-mono text-sm" style={{ color: C.onSurfaceVariant }}>
            Loading secure ballot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.surface, color: C.onSurface }}>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 w-full"
        style={{ backgroundColor: "rgba(247,249,255,0.85)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.outlineVariant}30` }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>
            how_to_vote
          </span>
          <span className="font-bold tracking-tighter text-lg" style={{ color: C.primary }}>VoteSecure</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm font-semibold" style={{ color: `${C.primary}99` }}>
            {voterName}
          </span>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: C.surfaceContainerHigh }}
          >
            <span className="material-symbols-outlined text-xs" style={{ color: C.primary }}>timer</span>
            <span className="font-mono text-sm font-bold tracking-tighter" style={{ color: C.primary }}>
              {minutes}:{seconds}
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-2xl mx-auto w-full px-6 pt-8 pb-36">
        {/* Header */}
        <header className="mb-10 space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: C.onSurfaceVariant }}>
                {electionTitle}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight" style={{ color: C.primary }}>
                Cast Your Vote
              </h1>
              <p className="text-lg mt-1" style={{ color: C.onSurfaceVariant }}>
                Select your preferred candidate below
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className="w-20 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: C.surfaceContainerHighest }}
              >
                <div className="w-full h-full rounded-full" style={{ backgroundColor: C.secondaryContainer }} />
              </div>
              <span className="block font-mono text-xs font-bold mt-1" style={{ color: C.primary }}>
                Step 1 of 1
              </span>
            </div>
          </div>
        </header>

        {/* Candidate list */}
        <section className="space-y-4">
          {candidates.filter((c) => !c.isNota).map((candidate) => {
            const isSelected = selectedId === candidate.id;
            return (
              <button
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
                className="group relative w-full flex items-center p-5 rounded-xl border-2 transition-all duration-200 text-left"
                style={{
                  backgroundColor: isSelected ? "#fff8e1" : C.surfaceContainerLowest,
                  borderColor: isSelected ? C.secondaryContainer : "transparent",
                  boxShadow: isSelected ? `0 4px 16px rgba(253,171,18,0.15)` : "0 1px 4px rgba(9,29,46,0.06)",
                }}
              >
                {/* Radio */}
                <div className="mr-5 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: isSelected ? C.secondaryContainer : C.outlineVariant }}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: C.secondaryContainer }} />
                    )}
                  </div>
                </div>

                {/* Photo */}
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="w-14 h-14 rounded-full object-cover mr-4 flex-shrink-0"
                    style={{ border: isSelected ? `2px solid ${C.secondaryContainer}` : "2px solid transparent" }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                    style={{ backgroundColor: isSelected ? C.surfaceContainerHigh : C.surfaceContainer }}
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ color: isSelected ? C.primary : C.onSurfaceVariant }}>
                      person
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wide mb-0.5" style={{ color: C.onSurfaceVariant }}>
                    #{candidate.serialNumber}
                  </p>
                  <h3 className="font-bold text-lg leading-tight truncate" style={{ color: C.onSurface }}>
                    {candidate.name}
                  </h3>
                  {candidate.party && (
                    <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
                      {candidate.party}
                    </p>
                  )}
                </div>

                {/* Symbol */}
                {candidate.symbolUrl ? (
                  <img
                    src={candidate.symbolUrl}
                    alt="symbol"
                    className="w-10 h-10 object-contain rounded-lg ml-2 flex-shrink-0"
                    style={{ backgroundColor: C.surfaceContainerLow }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg ml-2 flex-shrink-0"
                    style={{ backgroundColor: isSelected ? "#ffffff" : C.surfaceContainerLow }}
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ color: isSelected ? C.secondary : C.onSurfaceVariant }}>
                      bolt
                    </span>
                  </div>
                )}

                {/* Accent bar */}
                {isSelected && (
                  <div
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full"
                    style={{ backgroundColor: C.secondaryContainer }}
                  />
                )}
              </button>
            );
          })}

          {/* NOTA */}
          {candidates.filter((c) => c.isNota).map((nota) => {
            const isSelected = selectedId === nota.id;
            return (
              <button
                key={nota.id}
                onClick={() => setSelectedId(nota.id)}
                className="relative w-full flex items-center p-5 rounded-xl border transition-all duration-200 mt-8 text-left"
                style={{
                  backgroundColor: isSelected ? "#fff8e1" : C.surfaceContainer,
                  borderColor: isSelected ? C.secondaryContainer : `${C.outlineVariant}30`,
                }}
              >
                <div className="mr-5 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: isSelected ? C.secondaryContainer : C.outlineVariant }}
                  >
                    {isSelected && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: C.secondaryContainer }} />}
                  </div>
                </div>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                  style={{ backgroundColor: `${C.outlineVariant}30` }}
                >
                  <span className="material-symbols-outlined" style={{ color: C.onSurfaceVariant }}>block</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg uppercase tracking-wide leading-tight" style={{ color: C.onSurfaceVariant }}>
                    None of the Above
                  </h3>
                  <p className="text-xs font-medium" style={{ color: `${C.onSurfaceVariant}70` }}>
                    Abstain from voting for any candidate
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Info note */}
        <div
          className="mt-12 p-6 rounded-xl flex gap-4"
          style={{ backgroundColor: C.surfaceContainerLow }}
        >
          <span className="material-symbols-outlined" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          <div className="space-y-1">
            <p className="text-sm font-bold" style={{ color: C.primary }}>End-to-End Verifiable</p>
            <p className="text-xs leading-relaxed" style={{ color: C.onSurfaceVariant }}>
              Your selection is anonymously and securely recorded. Your identity is never linked to your choice.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <footer
        className="fixed bottom-0 left-0 w-full z-50"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 -8px 32px rgba(9,29,46,0.12)" }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.onSurfaceVariant }}>
                Selected:
              </span>
              {selectedCandidate ? (
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: C.primaryFixed, color: C.primary }}
                >
                  {selectedCandidate.name}
                </span>
              ) : (
                <span className="text-sm" style={{ color: C.onSurfaceVariant }}>None</span>
              )}
            </div>
            <div className="flex items-center gap-1" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Session</span>
            </div>
          </div>

          {confirmState === "idle" || confirmState === "confirming" ? (
            confirmState === "confirming" ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center" style={{ color: C.onSurface }}>
                  Confirm vote for <strong>{selectedCandidate?.name}</strong>? This action is <strong>irreversible</strong>.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmState("idle")}
                    className="flex-1 py-3 rounded-full font-bold border-2 transition-all"
                    style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVote}
                    className="flex-1 py-3 rounded-full font-bold text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: "#2ECC71", boxShadow: "0 4px 16px rgba(46,204,113,0.3)" }}
                  >
                    ✓ Confirm Vote
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { if (selectedId) setConfirmState("confirming"); else toast.error("Please select a candidate."); }}
                disabled={!selectedId}
                className="w-full py-4 rounded-full font-extrabold text-lg text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                style={{
                  backgroundColor: selectedId ? "#2ECC71" : "#c5c5d2",
                  boxShadow: selectedId ? "0 4px 24px rgba(46,204,113,0.25)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  how_to_vote
                </span>
                Submit Vote
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-full font-extrabold text-lg text-white flex items-center justify-center gap-3 opacity-80"
              style={{ backgroundColor: "#2ECC71" }}
            >
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {confirmState === "done" ? "Vote Cast!" : "Submitting..."}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
