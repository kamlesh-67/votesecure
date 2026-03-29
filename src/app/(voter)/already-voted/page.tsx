"use client";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  primaryFixed: "#dce1ff",
  surface: "#f7f9ff",
  surfaceContainer: "#e3efff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
};

export default function AlreadyVotedPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative"
      style={{ backgroundColor: C.surface, color: C.onSurface }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-10%] w-96 h-96 rounded-full"
          style={{ backgroundColor: C.primaryFixed, filter: "blur(120px)", opacity: 0.4 }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-96 h-96 rounded-full"
          style={{ backgroundColor: C.surfaceContainerHigh, filter: "blur(120px)", opacity: 0.6 }}
        />
      </div>

      <main className="max-w-md w-full flex flex-col items-center">
        {/* Lock icon */}
        <div className="relative mb-10">
          <div
            className="absolute inset-0 rounded-3xl rotate-6 opacity-20"
            style={{ backgroundColor: C.secondaryContainer }}
          />
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: C.surfaceContainerLowest }}
          >
            <span
              className="material-symbols-outlined text-[4rem]"
              style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}
            >
              how_to_vote
            </span>
            <div
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#10b981", boxShadow: "0 4px 12px rgba(16,185,129,0.4)" }}
            >
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            </div>
          </div>
        </div>

        <h1 className="font-extrabold text-3xl tracking-tight mb-3" style={{ color: C.primary }}>
          You&apos;ve Already Voted
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: C.onSurfaceVariant }}>
          Your vote has been securely recorded. Thank you for exercising your democratic right.
        </p>

        {/* Status card */}
        <div
          className="w-full rounded-xl p-6 mb-8 text-left"
          style={{
            backgroundColor: C.surfaceContainerLowest,
            boxShadow: "0 4px 32px rgba(9,29,46,0.06)",
            border: `1px solid ${C.outlineVariant}30`,
          }}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: "#10b981", fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Status
                </p>
                <p className="font-bold" style={{ color: "#059669" }}>Vote Successfully Recorded</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.surfaceContainerLow }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.primary }}>
                  encrypted
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Privacy
                </p>
                <p className="font-semibold" style={{ color: C.onSurface }}>Your choice is anonymous and sealed</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.surfaceContainerLow }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.primary }}>
                  lock
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Security
                </p>
                <p className="font-semibold" style={{ color: C.onSurface }}>Further voting attempts blocked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom identity */}
        <div className="opacity-40 flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-sm">account_balance</span>
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            VoteSecure · Election Commission
          </span>
        </div>
      </main>
    </div>
  );
}
