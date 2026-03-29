"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

// Admin login: redirect to /login with purpose=admin
export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: "#1b2f6e",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)",
      }}
    >
      {/* Watermark */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none select-none overflow-hidden">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "40rem", color: "#dce1ff", fontVariationSettings: "'FILL' 1" }}
        >
          admin_panel_settings
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-10">
        {/* Logo */}
        <div className="space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div
              className="absolute w-28 h-28 rounded-full border-4 opacity-20"
              style={{ borderColor: "#fdab12" }}
            />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#ffffff", boxShadow: "0 8px 32px rgba(0,24,87,0.4)" }}
            >
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: "#001857", fontVariationSettings: "'FILL' 1" }}
              >
                admin_panel_settings
              </span>
            </div>
          </div>

          <div>
            <h1
              className="font-extrabold text-3xl tracking-tighter uppercase"
              style={{ color: "#ffffff", fontFamily: "Inter, sans-serif" }}
            >
              Admin Console
            </h1>
            <p className="font-semibold tracking-wide mt-1" style={{ color: "#fdab12" }}>
              VoteSecure · Institutional Authority
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/login?purpose=admin"
          className="w-full py-4 rounded-xl font-extrabold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "#fdab12",
            color: "#001857",
            boxShadow: "0 4px 24px rgba(253,171,18,0.4)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock_open
          </span>
          Authenticate with OTP
        </Link>

        {/* Back to voter */}
        <Link
          href="/login"
          className="text-sm font-medium flex items-center gap-1"
          style={{ color: "rgba(135,153,223,0.7)" }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voter Login
        </Link>

        <p className="text-xs" style={{ color: "rgba(135,153,223,0.5)", letterSpacing: "0.15em" }}>
          RESTRICTED ACCESS · AUTHORIZED PERSONNEL ONLY
        </p>
      </div>
    </div>
  );
}
