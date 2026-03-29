"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ── Color tokens ──────────────────────────────────────────────
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
  secondary: "#fdab12",
};

type Step = "mobile" | "otp";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const purpose = (params.get("purpose") as "voter" | "admin") ?? "voter";

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, purpose }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to send OTP."); return; }
      setMaskedMobile("XXXXXX" + mobile.slice(-4));
      setStep("otp");
      setCountdown(60);
      toast.success("OTP sent to your mobile.");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) { toast.error("Please enter all 6 digits."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp: otpString, purpose }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Verification failed."); return; }
      const { redirect } = json.data;
      toast.success("Identity verified!");
      router.push(redirect ?? (purpose === "admin" ? "/admin/dashboard" : "/vote"));
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("").map((_, i) => text[i] ?? "");
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleResend() {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, purpose }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to resend."); return; }
      setOtp(Array(6).fill(""));
      setCountdown(60);
      toast.success("OTP resent.");
      otpRefs.current[0]?.focus();
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.surface, color: C.onSurface }}>
      {/* Header */}
      <header
        className="w-full flex justify-between items-center px-6 py-4"
        style={{ backgroundColor: "rgba(247,249,255,0.7)", backdropFilter: "blur(20px)" }}
      >
        {step === "otp" ? (
          <button
            onClick={() => { setStep("mobile"); setOtp(Array(6).fill("")); }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined" style={{ color: C.primary }}>arrow_back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
        <span className="font-bold tracking-tighter text-lg" style={{ color: C.primary }}>VoteSecure</span>
        <div className="w-10" />
      </header>

      <main className="flex-grow flex flex-col items-center px-6 pt-10 max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="relative mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-3xl rotate-12 opacity-20" style={{ backgroundColor: "#dce1ff" }} />
          <div
            className="absolute inset-0 rounded-3xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: C.surfaceContainerHigh }}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}
            >
              {step === "otp" ? "shield_person" : purpose === "admin" ? "admin_panel_settings" : "how_to_vote"}
            </span>
          </div>
        </div>

        {step === "mobile" ? (
          <form onSubmit={handleSendOtp} className="w-full space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="font-extrabold text-3xl tracking-tight" style={{ color: C.onSurface }}>
                {purpose === "admin" ? "Admin Login" : "Welcome, Voter"}
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                {purpose === "admin"
                  ? "Enter your registered admin mobile number."
                  : "Enter your registered mobile number to begin."}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.onSurfaceVariant }}>
                Mobile Number
              </label>
              <div className="flex items-center gap-3">
                <span
                  className="px-4 py-4 rounded-xl font-mono font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: C.surfaceContainerHigh, color: C.primary }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className="flex-1 px-4 py-4 rounded-xl text-lg font-mono font-semibold border-2 outline-none transition-all"
                  style={{
                    backgroundColor: C.surfaceContainerLowest,
                    borderColor: mobile.length === 10 ? C.primary : C.outlineVariant,
                    color: C.onSurface,
                  }}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full py-4 rounded-xl font-extrabold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: C.primaryContainer,
                color: "#ffffff",
                opacity: loading || mobile.length !== 10 ? 0.6 : 1,
                boxShadow: "0 4px 24px rgba(27,47,110,0.3)",
              }}
            >
              {loading
                ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                : <><span className="material-symbols-outlined">send</span>Send OTP</>}
            </button>

            <div
              className="p-4 rounded-xl flex items-start gap-3 border"
              style={{ backgroundColor: "rgba(237,244,255,0.5)", borderColor: "rgba(197,197,210,0.2)" }}
            >
              <span className="material-symbols-outlined text-xl mt-0.5" style={{ color: C.primary }}>lock</span>
              <p className="text-sm leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                {purpose === "admin"
                  ? "Admin sessions are time-limited and fully audited."
                  : "Your vote is anonymous and encrypted. Only eligibility is verified."}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full space-y-8">
            <div className="text-center space-y-3">
              <h1 className="font-bold text-3xl tracking-tight" style={{ color: C.onSurface }}>Verify Your Identity</h1>
              <p className="text-lg leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                OTP sent to{" "}
                <span className="font-mono font-semibold" style={{ color: C.primary }}>+91-{maskedMobile}</span>
              </p>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-full aspect-square text-center font-mono text-2xl font-bold rounded-xl border-2 outline-none transition-all"
                  style={{
                    backgroundColor: digit ? C.primary : C.surfaceContainerLowest,
                    color: digit ? "#ffffff" : C.onSurface,
                    borderColor: digit ? C.primary : C.outlineVariant,
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: C.surfaceContainerLow }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.secondary }}>schedule</span>
                <span className="font-mono text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
                  {countdown > 0 ? `Resend OTP in 00:${String(countdown).padStart(2, "0")}` : "You can resend now"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-sm font-semibold"
                style={{ color: C.primary, opacity: countdown > 0 ? 0.4 : 1 }}
              >
                Resend SMS
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full py-4 rounded-xl font-extrabold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: C.primaryContainer,
                color: "#ffffff",
                opacity: loading || otp.join("").length < 6 ? 0.6 : 1,
                boxShadow: "0 4px 24px rgba(27,47,110,0.3)",
              }}
            >
              {loading
                ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                : <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>Verify &amp; Proceed</>}
            </button>

            <div
              className="p-4 rounded-xl flex items-start gap-3 border"
              style={{ backgroundColor: "rgba(237,244,255,0.5)", borderColor: "rgba(197,197,210,0.15)" }}
            >
              <span className="material-symbols-outlined text-xl mt-0.5" style={{ color: C.primary }}>info</span>
              <p className="text-sm leading-tight" style={{ color: C.onSurfaceVariant }}>
                OTP valid for <strong>5 minutes</strong>. VoteSecure staff will never ask for your code.
              </p>
            </div>
          </form>
        )}
      </main>

      <footer className="py-8 flex justify-center items-center opacity-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">encrypted</span>
          <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            End-to-End Encrypted Session
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function VoterLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f9ff" }}>
        <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "#001857" }}>
          progress_activity
        </span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
