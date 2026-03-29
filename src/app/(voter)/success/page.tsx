"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  secondaryContainer: "#fdab12",
};

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "—";
  const name = params.get("name") ?? "—";
  const party = params.get("party") ?? "";
  const rawAt = params.get("at");
  const at = rawAt ? new Date(rawAt).toLocaleString("en-IN") : "—";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden relative"
      style={{ backgroundColor: C.surface, color: C.onSurface }}
    >
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full"
          style={{ backgroundColor: C.surfaceContainerHigh, filter: "blur(120px)", opacity: 0.6 }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full"
          style={{ backgroundColor: C.primaryFixed, filter: "blur(120px)", opacity: 0.3 }}
        />
      </div>

      <main className="w-full max-w-lg flex flex-col items-center">
        {/* Success icon */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-8 relative">
            <div
              className="absolute inset-0 rounded-full scale-150 opacity-20"
              style={{ backgroundColor: "#d1fae5", filter: "blur(20px)" }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#10b981", boxShadow: "0 8px 32px rgba(16,185,129,0.3)" }}
            >
              <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>
          <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight mb-3" style={{ color: C.primary }}>
            Vote Cast Successfully!
          </h1>
          <p className="text-lg max-w-xs mx-auto leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Thank you for participating in the democratic process.
          </p>
        </div>

        {/* Vote receipt card */}
        <div
          className="w-full rounded-xl overflow-hidden mb-8"
          style={{ boxShadow: "0 8px 32px rgba(9,29,46,0.06)", backgroundColor: C.surfaceContainerLowest }}
        >
          <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${C.primary}, ${C.primaryContainer})` }} />

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: `${C.onSurfaceVariant}99` }}>
                Official Vote Receipt
              </span>
              <span className="material-symbols-outlined opacity-10" style={{ color: C.primaryContainer, fontVariationSettings: "'FILL' 1" }}>
                account_balance
              </span>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.onSurfaceVariant }}>
                  Voted For
                </span>
                <div
                  className="flex items-center gap-3 p-4 rounded-lg border-l-4"
                  style={{ backgroundColor: C.surfaceContainerLow, borderLeftColor: C.secondaryContainer }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: "#825500", fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-tight" style={{ color: C.primary }}>{name}</p>
                    {party && <p className="text-sm" style={{ color: C.onSurfaceVariant }}>{party}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed" style={{ borderColor: `${C.onSurfaceVariant}30` }}>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.onSurfaceVariant }}>Timestamp</span>
                  <span className="font-mono text-sm" style={{ color: C.onSurface }}>{at}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.onSurfaceVariant }}>Reference ID</span>
                  <span className="font-mono text-sm font-bold" style={{ color: C.primary }}>{ref}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceContainerHighest }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ color: "#059669" }}>verified</span>
              <span className="text-xs font-semibold uppercase tracking-tighter" style={{ color: "#065f46" }}>
                Cryptographically Verified
              </span>
            </div>
            <span className="material-symbols-outlined opacity-20" style={{ color: C.primary }}>security</span>
          </div>
        </div>

        <div
          className="flex items-start gap-3 p-4 rounded-lg mb-10 w-full border"
          style={{ backgroundColor: "rgba(186,26,26,0.05)", borderColor: "rgba(186,26,26,0.1)" }}
        >
          <span className="material-symbols-outlined mt-0.5" style={{ color: "#ba1a1a" }}>lock_person</span>
          <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            <strong style={{ color: "#ba1a1a" }}>Security Notice:</strong> You cannot vote again for this election cycle.
          </p>
        </div>

        <div className="mt-4 opacity-40 flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-sm">account_balance</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em]">VoteSecure</span>
        </div>
      </main>
    </div>
  );
}

export default function VoteSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f9ff" }}>
        <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "#001857" }}>
          progress_activity
        </span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
